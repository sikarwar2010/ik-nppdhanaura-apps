import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from "@nestjs/common"
import { createHash, createHmac } from "node:crypto"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { ExportJobStatus, type Prisma } from "@prisma/client"
import { Queue } from "bullmq"
import IORedis from "ioredis"

import { AuditService } from "../../audit/audit.service"
import type { AuthUser } from "../../auth/auth.decorators"
import {
  computePublicDuesPayload,
  type SurveyForDues,
  type TaxConfigForDues,
} from "../../public-property-tax/dues.util"
import { PrismaService } from "../../prisma/prisma.service"
import { StorageService } from "../../storage/storage.service"
import { TaxConfigsService } from "../../tax-configs/tax-configs.service"
import {
  DEMAND_NOTICE_JOB_TYPE,
  DEMAND_NOTICE_MAX_PROPERTIES,
  DEMAND_NOTICE_ORIENTATION,
  DEMAND_NOTICE_PAPER,
  DEMAND_NOTICE_QUEUE,
} from "./demand-notice.constants"
import { generateDemandNoticeDocumentHtml } from "./demand-notice-html"
import { renderDemandNoticePdfFromHtml } from "./demand-notice-pdf"
import { sortDemandNoticeSurveys } from "./demand-notice-sort"
import {
  partitionDemandNoticeValidation,
  type DemandNoticeValidationError,
} from "./demand-notice.validation"
import { duesPayloadToNoticeViewModel } from "./demand-notice-view-model"

const SURVEY_DUES_SELECT = {
  id: true,
  surveyId: true,
  ownerName: true,
  ownerFatherName: true,
  mobile: true,
  propertyNo: true,
  parcelNo: true,
  houseNo: true,
  streetName: true,
  locality: true,
  colony: true,
  city: true,
  pincode: true,
  propertyUse: true,
  taxRateZone: true,
  roadType: true,
  hasMunicipalWaterSupply: true,
  plotAreaSqFt: true,
  plinthAreaSqFt: true,
  totalBuiltUpAreaSqFt: true,
  ward: { select: { id: true, number: true, name: true } },
  floors: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      floorLabel: true,
      usageType: true,
      usageFactor: true,
      buildingType: true,
      areaSqFt: true,
    },
  },
} satisfies Prisma.SurveySelect

type SurveyDuesRow = Prisma.SurveyGetPayload<{ select: typeof SURVEY_DUES_SELECT }>

export type DemandNoticeFiltersJson = {
  type: typeof DEMAND_NOTICE_JOB_TYPE
  assessmentYearId: string
  wardId: string
  surveyIds: string[]
  sortBy: "parcelNo"
  paperSize: typeof DEMAND_NOTICE_PAPER
  orientation: typeof DEMAND_NOTICE_ORIENTATION
  idempotencyKey: string
  validCount?: number
  invalidCount?: number
  pageCount?: number
  failedCount?: number
  errorMessage?: string
}

@Injectable()
export class DemandNoticeService implements OnModuleDestroy {
  private readonly logger = new Logger(DemandNoticeService.name)
  private queue: Queue | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly taxConfigs: TaxConfigsService,
    private readonly storage: StorageService,
    private readonly audit: AuditService
  ) {
    try {
      const connection = new IORedis(
        process.env.REDIS_URL ?? "redis://localhost:6379",
        { maxRetriesPerRequest: null }
      )
      this.queue = new Queue(DEMAND_NOTICE_QUEUE, { connection })
    } catch (err) {
      this.logger.warn(`Demand notice queue unavailable: ${String(err)}`)
    }
  }

  async onModuleDestroy() {
    await this.queue?.close()
  }

  async listCandidates(input: {
    wardId: string
    assessmentYearId: string
    parcelNo?: string
    q?: string
    page?: number
    pageSize?: number
  }) {
    const wardId = input.wardId?.trim()
    const assessmentYearId = input.assessmentYearId?.trim()
    if (!wardId || !assessmentYearId) {
      throw new BadRequestException({
        code: "WARD_AND_YEAR_REQUIRED",
        message: "wardId and assessmentYearId are required",
      })
    }

    await this.assertPublishedConfig(wardId, assessmentYearId)

    const page = Math.max(1, input.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 50))
    const parcelNo = input.parcelNo?.trim()
    const q = input.q?.trim()

    const where: Prisma.SurveyWhereInput = {
      deletedAt: null,
      status: "ACTIVE",
      wardId,
      ...(parcelNo
        ? { parcelNo: { contains: parcelNo, mode: "insensitive" } }
        : {}),
      ...(q
        ? {
            OR: [
              { surveyId: { contains: q, mode: "insensitive" } },
              { ownerName: { contains: q, mode: "insensitive" } },
              { parcelNo: { contains: q, mode: "insensitive" } },
              { propertyNo: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    }

    const [total, rows] = await Promise.all([
      this.prisma.survey.count({ where }),
      this.prisma.survey.findMany({
        where,
        select: {
          id: true,
          surveyId: true,
          ownerName: true,
          parcelNo: true,
          ward: { select: { id: true, number: true, name: true } },
        },
        orderBy: [{ parcelNo: "asc" }, { surveyId: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const sorted = sortDemandNoticeSurveys(rows)

    return {
      success: true as const,
      data: {
        items: sorted,
        propertiesFound: total,
        paperSize: DEMAND_NOTICE_PAPER,
        orientation: DEMAND_NOTICE_ORIENTATION,
      },
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    }
  }

  async validate(input: {
    wardId: string
    assessmentYearId: string
    surveyIds: string[]
  }) {
    const { surveys, config } = await this.loadSurveysAndConfig(input)
    const items = surveys.map((survey) => {
      const tax = config
        ? computePublicDuesPayload(this.toSurveyForDues(survey), config).tax
        : null
      return {
        survey: this.toSurveyForDues(survey),
        tax,
        hasPublishedTaxConfig: Boolean(config),
      }
    })
    const result = partitionDemandNoticeValidation(items)
    return {
      success: true as const,
      data: {
        selected: surveys.length,
        valid: result.validIds.length,
        invalid: result.invalid.length,
        validIds: result.validIds,
        errors: result.invalid,
      },
    }
  }

  async previewHtml(input: {
    surveyId: string
    assessmentYearId: string
    wardId?: string
    logoUrl?: string
    websiteDisplayHost?: string
  }) {
    const surveyCuid = input.surveyId?.trim()
    const assessmentYearId = input.assessmentYearId?.trim()
    if (!surveyCuid || !assessmentYearId) {
      throw new BadRequestException({
        code: "PREVIEW_PARAMS_REQUIRED",
        message: "surveyId and assessmentYearId are required",
      })
    }

    const survey = await this.prisma.survey.findFirst({
      where: {
        id: surveyCuid,
        deletedAt: null,
        status: "ACTIVE",
        ...(input.wardId ? { wardId: input.wardId } : {}),
      },
      select: SURVEY_DUES_SELECT,
    })
    if (!survey) {
      throw new NotFoundException({
        code: "SURVEY_NOT_FOUND",
        message: "Property record was not found",
      })
    }

    const config = await this.loadConfigOrNull(
      survey.ward.id,
      assessmentYearId
    )
    if (!config) {
      throw new ConflictException({
        code: "TAX_CONFIG_NOT_PUBLISHED",
        message:
          "No published tax configuration for this ward and assessment year.",
      })
    }

    const dues = computePublicDuesPayload(this.toSurveyForDues(survey), config)
    const error = partitionDemandNoticeValidation([
      {
        survey: this.toSurveyForDues(survey),
        tax: dues.tax,
        hasPublishedTaxConfig: true,
      },
    ]).invalid[0]
    if (error) {
      throw new BadRequestException({
        code: "NOTICE_VALIDATION_FAILED",
        message: error.error,
        details: error,
      })
    }

    const vm = duesPayloadToNoticeViewModel(dues)
    const logoUrl =
      input.logoUrl?.trim() || (await this.resolveLogoDataUri()) || undefined
    return generateDemandNoticeDocumentHtml([vm], {
      logoUrl,
      websiteDisplayHost: input.websiteDisplayHost,
      forPdf: false,
    })
  }

  async createJob(
    input: {
      wardId: string
      assessmentYearId: string
      surveyIds: string[]
      paperSize?: string
      orientation?: string
      sortBy?: string
    },
    user: AuthUser
  ) {
    const wardId = input.wardId?.trim()
    const assessmentYearId = input.assessmentYearId?.trim()
    const surveyIds = [...new Set((input.surveyIds ?? []).map((id) => id.trim()).filter(Boolean))]

    if (!wardId || !assessmentYearId) {
      throw new BadRequestException({
        code: "WARD_AND_YEAR_REQUIRED",
        message: "wardId and assessmentYearId are required",
      })
    }
    if (surveyIds.length === 0) {
      throw new BadRequestException({
        code: "NO_PROPERTIES_SELECTED",
        message: "Select at least one property",
      })
    }
    if (surveyIds.length > DEMAND_NOTICE_MAX_PROPERTIES) {
      throw new BadRequestException({
        code: "TOO_MANY_PROPERTIES",
        message: `Maximum ${DEMAND_NOTICE_MAX_PROPERTIES} properties per job`,
      })
    }
    if (
      input.paperSize &&
      input.paperSize.toUpperCase() !== DEMAND_NOTICE_PAPER
    ) {
      throw new BadRequestException({
        code: "UNSUPPORTED_PAPER",
        message: "Only A4 is supported for demand notices",
      })
    }
    if (
      input.orientation &&
      input.orientation.toLowerCase() !== DEMAND_NOTICE_ORIENTATION
    ) {
      throw new BadRequestException({
        code: "UNSUPPORTED_ORIENTATION",
        message: "Only portrait orientation is supported for demand notices",
      })
    }

    const validation = await this.validate({
      wardId,
      assessmentYearId,
      surveyIds,
    })
    if (validation.data.invalid > 0) {
      throw new BadRequestException({
        code: "NOTICE_VALIDATION_FAILED",
        message: `${validation.data.invalid} of ${validation.data.selected} selected properties are invalid. Fix errors before generating.`,
        details: {
          valid: validation.data.valid,
          invalid: validation.data.invalid,
          errors: validation.data.errors,
        },
      })
    }

    const sortedIds = validation.data.validIds
    const idempotencyKey = this.buildIdempotencyKey(
      user.id,
      wardId,
      assessmentYearId,
      sortedIds
    )

    const activeCandidates = await this.prisma.exportJob.findMany({
      where: {
        jobType: DEMAND_NOTICE_JOB_TYPE,
        status: { in: [ExportJobStatus.PENDING, ExportJobStatus.PROCESSING] },
        createdById: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    const active = activeCandidates.find((row) => {
      const f = row.filters as DemandNoticeFiltersJson | null
      return f?.idempotencyKey === idempotencyKey
    })
    if (active) {
      return {
        success: true as const,
        data: await this.toJobResponse(active),
        meta: { deduplicated: true },
      }
    }

    const filters: DemandNoticeFiltersJson = {
      type: DEMAND_NOTICE_JOB_TYPE,
      assessmentYearId,
      wardId,
      surveyIds: sortedIds,
      sortBy: "parcelNo",
      paperSize: DEMAND_NOTICE_PAPER,
      orientation: DEMAND_NOTICE_ORIENTATION,
      idempotencyKey,
      validCount: sortedIds.length,
      invalidCount: 0,
    }

    const job = await this.prisma.exportJob.create({
      data: {
        jobType: DEMAND_NOTICE_JOB_TYPE,
        status: ExportJobStatus.PENDING,
        filters: filters as unknown as Prisma.InputJsonValue,
        rowCount: sortedIds.length,
        processedCount: 0,
        createdById: user.id,
      },
    })

    await this.audit.log({
      action: "CREATE",
      entity: "DemandNoticeExportJob",
      entityId: job.id,
      actorId: user.id,
      newValue: {
        assessmentYearId,
        wardId,
        propertyCount: sortedIds.length,
      },
    })

    if (this.queue) {
      await this.queue.add("process", { jobId: job.id }, { removeOnComplete: 50 })
    } else {
      void this.processJob(job.id).catch((err) => {
        this.logger.error(`Inline demand notice job failed: ${String(err)}`)
      })
    }

    return {
      success: true as const,
      data: await this.toJobResponse(job),
    }
  }

  async getJob(jobId: string, user: AuthUser) {
    const job = await this.prisma.exportJob.findFirst({
      where: {
        id: jobId,
        jobType: DEMAND_NOTICE_JOB_TYPE,
      },
    })
    if (!job) {
      throw new NotFoundException({
        code: "JOB_NOT_FOUND",
        message: "Demand notice job not found",
      })
    }
    if (
      job.createdById &&
      job.createdById !== user.id &&
      !user.permissions.includes("report:export")
    ) {
      throw new NotFoundException({
        code: "JOB_NOT_FOUND",
        message: "Demand notice job not found",
      })
    }
    return {
      success: true as const,
      data: await this.toJobResponse(job),
    }
  }

  async cancelJob(jobId: string, user: AuthUser) {
    const job = await this.prisma.exportJob.findFirst({
      where: { id: jobId, jobType: DEMAND_NOTICE_JOB_TYPE },
    })
    if (!job) {
      throw new NotFoundException({
        code: "JOB_NOT_FOUND",
        message: "Demand notice job not found",
      })
    }
    if (job.createdById && job.createdById !== user.id) {
      throw new NotFoundException({
        code: "JOB_NOT_FOUND",
        message: "Demand notice job not found",
      })
    }
    if (
      job.status !== ExportJobStatus.PENDING &&
      job.status !== ExportJobStatus.PROCESSING
    ) {
      throw new ConflictException({
        code: "JOB_NOT_CANCELLABLE",
        message: `Job is already ${job.status}`,
      })
    }

    const updated = await this.prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: ExportJobStatus.CANCELLED,
        completedAt: new Date(),
      },
    })

    await this.audit.log({
      action: "CANCEL",
      entity: "DemandNoticeExportJob",
      entityId: job.id,
      actorId: user.id,
    })

    return {
      success: true as const,
      data: await this.toJobResponse(updated),
    }
  }

  async processJob(jobId: string) {
    const job = await this.prisma.exportJob.findUnique({ where: { id: jobId } })
    if (!job || job.jobType !== DEMAND_NOTICE_JOB_TYPE) {
      this.logger.warn(`Skipping unknown demand notice job ${jobId}`)
      return
    }
    if (job.status === ExportJobStatus.CANCELLED) return
    if (job.status === ExportJobStatus.COMPLETED) return

    const filters = job.filters as DemandNoticeFiltersJson | null
    if (!filters?.surveyIds?.length || !filters.wardId || !filters.assessmentYearId) {
      await this.failJob(jobId, "Invalid job filters")
      return
    }

    await this.prisma.exportJob.update({
      where: { id: jobId },
      data: { status: ExportJobStatus.PROCESSING, processedCount: 0 },
    })

    try {
      const fresh = await this.prisma.exportJob.findUnique({ where: { id: jobId } })
      if (fresh?.status === ExportJobStatus.CANCELLED) return

      const { surveys, config } = await this.loadSurveysAndConfig({
        wardId: filters.wardId,
        assessmentYearId: filters.assessmentYearId,
        surveyIds: filters.surveyIds,
      })
      if (!config) {
        await this.failJob(jobId, "Published tax configuration missing")
        return
      }

      const ordered = sortDemandNoticeSurveys(surveys)
      const validationItems = ordered.map((survey) => {
        const dues = computePublicDuesPayload(
          this.toSurveyForDues(survey),
          config
        )
        return {
          survey: this.toSurveyForDues(survey),
          tax: dues.tax,
          hasPublishedTaxConfig: true,
          dues,
        }
      })
      const { invalid } = partitionDemandNoticeValidation(validationItems)
      if (invalid.length > 0) {
        const errorKey = await this.storeValidationErrors(jobId, invalid)
        await this.prisma.exportJob.update({
          where: { id: jobId },
          data: {
            status: ExportJobStatus.FAILED,
            errorFileKey: errorKey,
            completedAt: new Date(),
            filters: {
              ...filters,
              invalidCount: invalid.length,
              errorMessage: `${invalid.length} properties failed validation during generation`,
            } as unknown as Prisma.InputJsonValue,
          },
        })
        return
      }

      const logoUrl = (await this.resolveLogoDataUri()) || undefined
      const viewModels = []
      let processed = 0
      for (const item of validationItems) {
        const cancelled = await this.prisma.exportJob.findUnique({
          where: { id: jobId },
          select: { status: true },
        })
        if (cancelled?.status === ExportJobStatus.CANCELLED) return

        viewModels.push(duesPayloadToNoticeViewModel(item.dues))
        processed += 1
        if (processed % 25 === 0 || processed === validationItems.length) {
          await this.prisma.exportJob.update({
            where: { id: jobId },
            data: { processedCount: processed },
          })
        }
      }

      const html = generateDemandNoticeDocumentHtml(viewModels, {
        logoUrl,
        forPdf: true,
      })
      const pdf = await renderDemandNoticePdfFromHtml(html)
      const fileName = `demand-notices-${filters.wardId.slice(0, 8)}-${Date.now()}.pdf`
      const fileKey = `exports/demand-notices/${jobId}/${fileName}`
      await this.storage.putObject(fileKey, pdf, "application/pdf")

      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: ExportJobStatus.COMPLETED,
          fileKey,
          fileName,
          rowCount: viewModels.length,
          processedCount: viewModels.length,
          completedAt: new Date(),
          filters: {
            ...filters,
            pageCount: viewModels.length,
            validCount: viewModels.length,
            invalidCount: 0,
            failedCount: 0,
          } as unknown as Prisma.InputJsonValue,
        },
      })

      await this.audit.log({
        action: "COMPLETE",
        entity: "DemandNoticeExportJob",
        entityId: jobId,
        actorId: job.createdById ?? undefined,
        newValue: {
          pageCount: viewModels.length,
          fileKey,
        },
      })
    } catch (err) {
      this.logger.error(`Demand notice job ${jobId} failed: ${String(err)}`)
      await this.failJob(
        jobId,
        err instanceof Error ? err.message : "PDF generation failed"
      )
    }
  }

  private async failJob(jobId: string, message: string) {
    const job = await this.prisma.exportJob.findUnique({ where: { id: jobId } })
    const filters = (job?.filters ?? {}) as DemandNoticeFiltersJson
    await this.prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: ExportJobStatus.FAILED,
        completedAt: new Date(),
        filters: {
          ...filters,
          errorMessage: message,
          failedCount: 1,
        } as unknown as Prisma.InputJsonValue,
      },
    })
    await this.audit.log({
      action: "FAIL",
      entity: "DemandNoticeExportJob",
      entityId: jobId,
      actorId: job?.createdById ?? undefined,
      newValue: { errorMessage: message },
    })
  }

  private async storeValidationErrors(
    jobId: string,
    errors: DemandNoticeValidationError[]
  ): Promise<string> {
    const key = `exports/demand-notices/${jobId}/validation-errors.json`
    await this.storage.putObject(
      key,
      Buffer.from(JSON.stringify(errors, null, 2), "utf8"),
      "application/json"
    )
    return key
  }

  private async toJobResponse(job: {
    id: string
    status: ExportJobStatus
    filters: Prisma.JsonValue | null
    fileKey: string | null
    fileName: string | null
    errorFileKey: string | null
    rowCount: number | null
    processedCount: number | null
    createdAt: Date
    completedAt: Date | null
    updatedAt: Date
  }) {
    const filters = (job.filters ?? {}) as Partial<DemandNoticeFiltersJson>
    const uiStatus =
      job.status === ExportJobStatus.PENDING ? "QUEUED" : job.status
    let downloadUrl: string | null = null
    if (job.status === ExportJobStatus.COMPLETED && job.fileKey) {
      downloadUrl = await this.storage.getSignedUrl(job.fileKey, 600)
    }
    let errorDownloadUrl: string | null = null
    if (job.errorFileKey) {
      errorDownloadUrl = await this.storage.getSignedUrl(job.errorFileKey, 600)
    }

    return {
      id: job.id,
      jobType: DEMAND_NOTICE_JOB_TYPE,
      status: job.status,
      uiStatus,
      propertyCount: job.rowCount ?? filters.surveyIds?.length ?? 0,
      processedCount: job.processedCount ?? 0,
      pageCount: filters.pageCount ?? null,
      failedCount: filters.failedCount ?? filters.invalidCount ?? 0,
      errorMessage: filters.errorMessage ?? null,
      fileName: job.fileName,
      downloadUrl,
      errorDownloadUrl,
      paperSize: DEMAND_NOTICE_PAPER,
      orientation: DEMAND_NOTICE_ORIENTATION,
      assessmentYearId: filters.assessmentYearId ?? null,
      wardId: filters.wardId ?? null,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      updatedAt: job.updatedAt,
    }
  }

  private async loadSurveysAndConfig(input: {
    wardId: string
    assessmentYearId: string
    surveyIds: string[]
  }) {
    const wardId = input.wardId.trim()
    const assessmentYearId = input.assessmentYearId.trim()
    const surveyIds = [...new Set(input.surveyIds.map((id) => id.trim()).filter(Boolean))]

    if (surveyIds.length === 0) {
      throw new BadRequestException({
        code: "NO_PROPERTIES_SELECTED",
        message: "Select at least one property",
      })
    }

    const config = await this.loadConfigOrNull(wardId, assessmentYearId)
    const surveys = await this.prisma.survey.findMany({
      where: {
        id: { in: surveyIds },
        wardId,
        deletedAt: null,
        status: "ACTIVE",
      },
      select: SURVEY_DUES_SELECT,
    })

    if (surveys.length !== surveyIds.length) {
      const found = new Set(surveys.map((s) => s.id))
      const missing = surveyIds.filter((id) => !found.has(id))
      throw new BadRequestException({
        code: "PROPERTIES_NOT_FOUND",
        message: `${missing.length} selected properties were not found in this ward`,
        details: { missing },
      })
    }

    return { surveys, config }
  }

  private async assertPublishedConfig(wardId: string, assessmentYearId: string) {
    const config = await this.loadConfigOrNull(wardId, assessmentYearId)
    if (!config) {
      throw new ConflictException({
        code: "TAX_CONFIG_NOT_PUBLISHED",
        message:
          "No published tax configuration for this ward and assessment year. Publish rates on Reports → Tax Rates first.",
      })
    }
    return config
  }

  private async loadConfigOrNull(
    wardId: string,
    assessmentYearId: string
  ): Promise<TaxConfigForDues | null> {
    try {
      const config = await this.taxConfigs.getPublishedForWard(
        wardId,
        assessmentYearId
      )
      return {
        id: config.id,
        version: config.version,
        assessablePct: config.assessablePct,
        commercialAssessablePct: config.commercialAssessablePct,
        propertyTaxPct: config.propertyTaxPct,
        waterTaxPct: config.waterTaxPct,
        drainageTaxPct: config.drainageTaxPct,
        penaltyPct: config.penaltyPct,
        assessmentYear: {
          id: config.assessmentYear.id,
          code: config.assessmentYear.code,
          name: config.assessmentYear.name,
        },
        cells: config.cells.map((c) => ({
          roadWidthEntry: { code: c.roadWidthEntry.code },
          constructionEntry: { code: c.constructionEntry.code },
          annualRatePerSqFt: c.annualRatePerSqFt,
        })),
        updatedAt: config.updatedAt,
      }
    } catch {
      return null
    }
  }

  private toSurveyForDues(survey: SurveyDuesRow): SurveyForDues & { id: string } {
    return {
      id: survey.id,
      surveyId: survey.surveyId,
      ownerName: survey.ownerName,
      ownerFatherName: survey.ownerFatherName,
      mobile: survey.mobile,
      propertyNo: survey.propertyNo,
      parcelNo: survey.parcelNo,
      houseNo: survey.houseNo,
      streetName: survey.streetName,
      locality: survey.locality,
      colony: survey.colony,
      city: survey.city,
      pincode: survey.pincode,
      propertyUse: survey.propertyUse,
      taxRateZone: survey.taxRateZone,
      roadType: survey.roadType,
      hasMunicipalWaterSupply: survey.hasMunicipalWaterSupply,
      plotAreaSqFt: survey.plotAreaSqFt,
      plinthAreaSqFt: survey.plinthAreaSqFt,
      totalBuiltUpAreaSqFt: survey.totalBuiltUpAreaSqFt,
      ward: { number: survey.ward.number, name: survey.ward.name },
      floors: survey.floors,
    }
  }

  private buildIdempotencyKey(
    userId: string,
    wardId: string,
    assessmentYearId: string,
    surveyIds: string[]
  ): string {
    const payload = `${userId}|${wardId}|${assessmentYearId}|${[...surveyIds].sort().join(",")}`
    return createHash("sha256").update(payload).digest("hex")
  }

  private async resolveLogoDataUri(): Promise<string | null> {
    const candidates = [
      process.env.DEMAND_NOTICE_LOGO_PATH,
      path.resolve(
        process.cwd(),
        "../portal/public/branding/up-government-logo.png"
      ),
      path.resolve(
        process.cwd(),
        "../../apps/portal/public/branding/up-government-logo.png"
      ),
      path.resolve(
        process.cwd(),
        "apps/portal/public/branding/up-government-logo.png"
      ),
    ].filter((p): p is string => Boolean(p?.trim()))

    for (const candidate of candidates) {
      if (!existsSync(candidate)) continue
      try {
        const buf = await readFile(candidate)
        return `data:image/png;base64,${buf.toString("base64")}`
      } catch {
        /* try next */
      }
    }
    return null
  }
}

/** Exported for tests — HMAC-stable key without Nest DI. */
export function hashDemandNoticeIdempotencyKey(parts: string[]): string {
  return createHmac("sha256", "demand-notice")
    .update(parts.join("|"))
    .digest("hex")
}
