import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import { DuplicateStrategy, ImportJobStatus, Prisma } from "@prisma/client"
import { resolveImportSurveyId } from "@workspace/types"
import { Queue } from "bullmq"
import ExcelJS from "exceljs"
import IORedis from "ioredis"

import { AuditService } from "../audit/audit.service"
import type { AuthUser } from "../auth/auth.decorators"
import { PrismaService } from "../prisma/prisma.service"
import { StorageService } from "../storage/storage.service"
import { computeDataQuality, parseFloorsRaw } from "../surveys/floors.util"
import {
  diffSurveyChanges,
  surveyToAuditSnapshot,
} from "../surveys/survey-audit.util"
import { getUlbCode } from "../surveys/survey-id.util"
import {
  cell,
  extractWardNumber,
  normalizeParcelNo,
  normalizePropertyNo,
  parseBool,
  parseNumber,
  parseSurveyedAt,
} from "./column-maps"
import {
  countNonEmptyDataRows,
  decideDhanauraMatch,
  decideImportedTaxRateZone,
  describeWorkbookHeaderFailure,
  dhanauraOwnerFieldsForUpdate,
  mergeDhanauraSourceExtras,
  parseDhanauraRow,
  readImportLayout,
  readRowStrings,
  resolveWorkbookLayout,
  surveyIdForHouse,
  type HouseMatch,
  type WorkbookHeaderFailure,
  type WorkbookLayout,
} from "./dhanaura-gis-map"
import {
  orphanSurveyWhere,
  shouldPruneOrphanCount,
  shouldReconcileWardAfterImport,
} from "./import-reconcile"
import {
  buildSurveyExportFilename,
  buildSurveyExportWorkbook,
  detectExportPreset,
  type SurveyExportRecord,
} from "./survey-excel-export"

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name)
  private queue: Queue | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService
  ) {
    try {
      const connection = new IORedis(
        process.env.REDIS_URL ?? "redis://localhost:6379",
        {
          maxRetriesPerRequest: null,
        }
      )
      this.queue = new Queue("survey-import", { connection })
    } catch (err) {
      this.logger.warn(`BullMQ queue unavailable: ${String(err)}`)
    }
  }

  async createUpload(
    file: Express.Multer.File,
    user: AuthUser,
    duplicateStrategy: DuplicateStrategy = "UPDATE"
  ) {
    assertImportFile(file)
    const objectKey = `imports/${Date.now()}-${file.originalname}`
    await this.storage.putObject(objectKey, file.buffer, file.mimetype)

    const workbook = await readWorkbook(file.buffer)
    const layout = resolveWorkbookLayout(workbook)
    if (!layout) {
      throwImportHeaderFailure(
        this.logger,
        describeWorkbookHeaderFailure(workbook)
      )
    }
    if (layout.missingRequired.length > 0) {
      const failure = describeWorkbookHeaderFailure(workbook)
      throwImportHeaderFailure(this.logger, {
        ...failure,
        message: `Missing required columns: ${layout.missingRequired.join(", ")}`,
        missingRequired: layout.missingRequired,
        unrecognizedHeaders: layout.unmappedColumns,
        selectedSheet: layout.sheet.name,
        headerRowNumber: layout.headerRowNumber,
        normalizedHeaders: layout.headers.map((header) =>
          header.normalize("NFC")
        ),
      })
    }
    const dataRows = countNonEmptyDataRows(layout.sheet, layout)
    if (dataRows === 0) {
      throw new BadRequestException("Workbook has no usable survey data")
    }

    const job = await this.prisma.importJob.create({
      data: {
        fileName: file.originalname,
        fileSize: file.size,
        objectKey,
        status: ImportJobStatus.READY,
        mappingPreset: layout.preset,
        columnMapping: layoutSummary(layout),
        duplicateStrategy,
        createdById: user.id,
        totalRows: Math.max(0, layout.sheet.rowCount - layout.headerRowNumber),
      },
    })

    return job
  }

  async start(jobId: string) {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } })
    if (!job) throw new NotFoundException("Import job not found")

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: ImportJobStatus.PROCESSING, startedAt: new Date() },
    })

    if (this.queue) {
      await this.queue.add("process", { jobId }, { removeOnComplete: 100 })
    } else {
      // Fallback: process inline when Redis is down
      await this.processJob(jobId)
    }

    return this.getJob(jobId)
  }

  async getJob(jobId: string) {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: { errors: { take: 100, orderBy: { rowNumber: "asc" } } },
    })
    if (!job) throw new NotFoundException("Import job not found")
    return job
  }

  async list(
    page = 1,
    pageSize = 20,
    filters?: { status?: string; q?: string }
  ) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const safeSize =
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(100, Math.floor(pageSize))
        : 20

    const where: Prisma.ImportJobWhereInput = {}
    const status = filters?.status?.trim()
    if (status) {
      if (!Object.values(ImportJobStatus).includes(status as ImportJobStatus)) {
        throw new BadRequestException("Invalid import status")
      }
      where.status = status as ImportJobStatus
    }
    const q = filters?.q?.trim()
    if (q) {
      where.fileName = { contains: q, mode: "insensitive" }
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.importJob.count({ where }),
      this.prisma.importJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ])
    return {
      items,
      meta: {
        page: safePage,
        pageSize: safeSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeSize)),
      },
    }
  }

  async reprocessJob(jobId: string, duplicateStrategy: DuplicateStrategy) {
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        duplicateStrategy,
        status: ImportJobStatus.PROCESSING,
        startedAt: new Date(),
        completedAt: null,
        processedRows: 0,
        successRows: 0,
        failedRows: 0,
        skippedRows: 0,
        insertedRows: 0,
        updatedRows: 0,
        warningRows: 0,
      },
    })
    await this.prisma.importError.deleteMany({ where: { importJobId: jobId } })
    return this.processJob(jobId)
  }

  async processJob(jobId: string) {
    const job = await this.prisma.importJob.findUniqueOrThrow({
      where: { id: jobId },
    })
    if (!job.objectKey) throw new Error("Missing object key")

    const buffer = await this.storage.getObject(job.objectKey)
    let workbook: ExcelJS.Workbook
    try {
      workbook = await readWorkbook(buffer)
    } catch (err) {
      return this.failJob(
        job.id,
        err instanceof Error ? err.message : "Workbook could not be read"
      )
    }
    const layout = resolveWorkbookLayout(workbook)
    if (!layout) {
      const failure = describeWorkbookHeaderFailure(workbook)
      this.logger.warn(
        `Import ${job.id} header failure sheet=${failure.selectedSheet} headerRow=${failure.headerRowNumber} missing=${failure.missingRequired.join("|")}`
      )
      return this.failJob(job.id, failure.message)
    }
    if (layout.missingRequired.length > 0) {
      this.logger.warn(
        `Import ${job.id} missing columns sheet=${layout.sheet.name} headerRow=${layout.headerRowNumber} missing=${layout.missingRequired.join("|")}`
      )
      return this.failJob(
        job.id,
        `Missing required columns: ${layout.missingRequired.join(", ")}`
      )
    }
    const { sheet } = layout
    const { preset, map } = layout
    if (job.mappingPreset !== preset) {
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: { mappingPreset: preset, columnMapping: layoutSummary(layout) },
      })
    }

    if (layout.dhanauraMap) {
      return this.processDhanauraJob(job, layout)
    }
    const columnCount = layout.columnCount
    const wards = await this.prisma.ward.findMany()
    const wardByNumber = new Map(wards.map((w) => [w.number, w]))

    let success = 0
    let failed = 0
    let skipped = 0
    let inserted = 0
    let updated = 0
    let processed = 0
    let pruned = 0
    const touchedSurveyIds = new Set<string>()
    const wardIdsSeen = new Set<string>()

    for (
      let rowNumber = layout.headerRowNumber + 1;
      rowNumber <= sheet.rowCount;
      rowNumber++
    ) {
      const excelRow = sheet.getRow(rowNumber)
      const values: unknown[] = []
      for (let col = 1; col <= columnCount; col++) {
        values[col - 1] = excelRow.getCell(col).value
      }

      const rawSurveyId = cell(values, map.surveyId)
      const blankRow = values.every((_, index) => !cell(values, index))
      if (blankRow) continue
      processed++

      try {
        const wardName = cell(values, map.wardName)
        const wardNumber = extractWardNumber(wardName, rawSurveyId)
        const ward = wardNumber ? wardByNumber.get(wardNumber) : undefined
        if (!ward) {
          throw new Error(`Ward not found for ${wardName || rawSurveyId}`)
        }

        const mobileRaw = cell(values, map.mobile)
        const mobile = !mobileRaw || mobileRaw === "0" ? "" : mobileRaw
        const floorsRaw = cell(values, map.floorsRaw)
        const floors = parseFloorsRaw(floorsRaw)
        const plotAreaSqFt = parseNumber(cell(values, map.plotAreaSqFt))
        const plotAreaSqMeter = parseNumber(cell(values, map.plotAreaSqMeter))
        const plinthAreaSqFt = parseNumber(cell(values, map.plinthAreaSqFt))
        const plinthAreaSqMeter = parseNumber(
          cell(values, map.plinthAreaSqMeter)
        )
        const totalBuiltUpAreaSqFt = parseNumber(
          cell(values, map.totalBuiltUpAreaSqFt)
        )
        const totalBuiltUpAreaSqMeter = parseNumber(
          cell(values, map.totalBuiltUpAreaSqMeter)
        )
        const excelParcelRaw = cell(values, map.parcelNo)
        const excelPropertyRaw = cell(values, map.propertyNo)
        const parcelNo = normalizeParcelNo(excelParcelRaw, rawSurveyId)
        const propertyNo = normalizePropertyNo(excelPropertyRaw, rawSurveyId)
        if (!rawSurveyId && (!parcelNo || !propertyNo)) {
          throw new Error(
            "Survey Id is missing and parcel and property numbers are required"
          )
        }
        const surveyId = resolveImportSurveyId(
          rawSurveyId,
          ward.number,
          parcelNo ?? "",
          propertyNo ?? "",
          getUlbCode()
        )

        const payload = {
          surveyId,
          wardId: ward.id,
          surveyedAt: parseSurveyedAt(cell(values, map.surveyedAt)),
          ownerName: cell(values, map.ownerName) || null,
          ownerFatherName: cell(values, map.ownerFatherName) || null,
          mobile: mobile || null,
          isSlum: parseBool(cell(values, map.isSlum)) ?? false,
          remark: cell(values, map.remark) || null,
          parcelNo,
          propertyNo,
          electricityId: cell(values, map.electricityId) || null,
          khasraNo: cell(values, map.khasraNo) || null,
          registryNo: cell(values, map.registryNo) || null,
          constructedDate: cell(values, map.constructedDate) || null,
          respondentName: cell(values, map.respondentName) || null,
          respondentRelationship:
            cell(values, map.respondentRelationship) || null,
          city: cell(values, map.city) || null,
          pincode: cell(values, map.pincode) || null,
          houseNo: cell(values, map.houseNo) || null,
          streetName: cell(values, map.streetName) || null,
          locality: cell(values, map.locality) || null,
          colony: cell(values, map.colony) || null,
          presentHouseNo: cell(values, map.presentHouseNo) || null,
          presentStreetName: cell(values, map.presentStreetName) || null,
          presentLocality: cell(values, map.presentLocality) || null,
          presentColony: cell(values, map.presentColony) || null,
          presentCity: cell(values, map.presentCity) || null,
          presentPincode: cell(values, map.presentPincode) || null,
          isSameAsProperty: parseBool(cell(values, map.isSameAsProperty)),
          taxRateZone: cell(values, map.taxRateZone) || null,
          propertyOwnership: cell(values, map.propertyOwnership) || null,
          propertyType: cell(values, map.propertyType) || null,
          propertyUse: cell(values, map.propertyUse) || null,
          commercial: cell(values, map.commercial) || null,
          yearOfConstruction: cell(values, map.yearOfConstruction) || null,
          exemptionType: cell(values, map.exemptionType) || null,
          exemptionApplicable: parseBool(cell(values, map.exemptionApplicable)),
          situation: cell(values, map.situation) || null,
          roadType: cell(values, map.roadType) || null,
          floorsRaw: floorsRaw || null,
          plotAreaSqFt,
          plotAreaSqMeter,
          plinthAreaSqFt,
          plinthAreaSqMeter,
          totalBuiltUpAreaSqFt,
          totalBuiltUpAreaSqMeter,
          hasMunicipalWaterSupply: parseBool(
            cell(values, map.hasMunicipalWaterSupply)
          ),
          hasAlternateWater: parseBool(cell(values, map.hasAlternateWater)),
          waterSourceType: cell(values, map.waterSourceType) || null,
          totalWaterConnections: parseNumber(
            cell(values, map.totalWaterConnections)
          ),
          waterConnectionIdType:
            cell(values, map.waterConnectionIdType) || null,
          toiletType: cell(values, map.toiletType) || null,
          hasMunicipalWasteService: parseBool(
            cell(values, map.hasMunicipalWasteService)
          ),
          ownerAadhaar: cell(values, map.ownerAadhaar) || null,
          dataQualityStatus: computeDataQuality({
            mobile,
            propertyNo,
            parcelNo,
            plotAreaSqFt,
            totalBuiltUpAreaSqFt,
          }),
          importJobId: job.id,
          status: "ACTIVE" as const,
        }

        const existing = await this.findImportDuplicate({
          surveyId,
          rawSurveyId,
          wardId: ward.id,
          parcelNo,
          propertyNo,
        })

        if (existing) {
          const isSoftDeleted = existing.deletedAt != null
          if (job.duplicateStrategy === "SKIP" && !isSoftDeleted) {
            skipped++
            success++
            touchedSurveyIds.add(existing.id)
            wardIdsSeen.add(ward.id)
            continue
          }
          // UPDATE strategy, or soft-deleted row (must revive — surveyId is still unique).
          if (job.duplicateStrategy === "UPDATE" || isSoftDeleted) {
            const beforeAudit = surveyToAuditSnapshot(
              existing as unknown as Record<string, unknown>
            )
            const updatedSurvey = await this.prisma.$transaction(async (tx) => {
              await tx.surveyFloor.deleteMany({
                where: { surveyId: existing.id },
              })
              return tx.survey.update({
                where: { id: existing.id },
                data: {
                  ...payload,
                  deletedAt: null,
                  status: "ACTIVE",
                  floors: {
                    create: floors.map((f) => ({
                      floorLabel: f.floorLabel,
                      areaSqFt: f.areaSqFt,
                      areaSqMeter: f.areaSqMeter,
                      usageType: f.usageType,
                      usageFactor: f.usageFactor,
                      buildingType: f.buildingType,
                      sortOrder: f.sortOrder,
                      rawSegment: f.rawSegment,
                    })),
                  },
                },
              })
            })
            const afterAudit = surveyToAuditSnapshot(
              updatedSurvey as unknown as Record<string, unknown>
            )
            const auditDiff = diffSurveyChanges(beforeAudit, afterAudit)
            if (auditDiff.changes.length > 0) {
              await this.audit.log({
                action: "SURVEY_UPDATED",
                entity: "Survey",
                entityId: existing.id,
                actorId: job.createdById ?? undefined,
                newValue: {
                  changes: auditDiff.changes,
                  source: "import",
                  revived: isSoftDeleted,
                } as Prisma.InputJsonValue,
              })
            }
            updated++
            success++
            touchedSurveyIds.add(existing.id)
            wardIdsSeen.add(ward.id)
            continue
          }
        }

        try {
          const created = await this.prisma.survey.create({
            data: {
              ...payload,
              floors: {
                create: floors.map((f) => ({
                  floorLabel: f.floorLabel,
                  areaSqFt: f.areaSqFt,
                  areaSqMeter: f.areaSqMeter,
                  usageType: f.usageType,
                  usageFactor: f.usageFactor,
                  buildingType: f.buildingType,
                  sortOrder: f.sortOrder,
                  rawSegment: f.rawSegment,
                })),
              },
            },
          })
          inserted++
          success++
          touchedSurveyIds.add(created.id)
          wardIdsSeen.add(ward.id)
        } catch (createErr) {
          // Race / leftover soft-delete: unique surveyId — revive that row instead.
          if (
            createErr instanceof Prisma.PrismaClientKnownRequestError &&
            createErr.code === "P2002"
          ) {
            const conflict = await this.prisma.survey.findUnique({
              where: { surveyId },
            })
            if (conflict) {
              await this.prisma.$transaction(async (tx) => {
                await tx.surveyFloor.deleteMany({
                  where: { surveyId: conflict.id },
                })
                await tx.survey.update({
                  where: { id: conflict.id },
                  data: {
                    ...payload,
                    deletedAt: null,
                    status: "ACTIVE",
                    floors: {
                      create: floors.map((f) => ({
                        floorLabel: f.floorLabel,
                        areaSqFt: f.areaSqFt,
                        areaSqMeter: f.areaSqMeter,
                        usageType: f.usageType,
                        usageFactor: f.usageFactor,
                        buildingType: f.buildingType,
                        sortOrder: f.sortOrder,
                        rawSegment: f.rawSegment,
                      })),
                    },
                  },
                })
              })
              updated++
              success++
              touchedSurveyIds.add(conflict.id)
              wardIdsSeen.add(ward.id)
              continue
            }
          }
          throw createErr
        }
      } catch (err) {
        failed++
        await this.prisma.importError.create({
          data: {
            importJobId: job.id,
            rowNumber,
            surveyId: rawSurveyId || null,
            message: formatImportErrorMessage(err),
            severity: "error",
          },
        })
      }
    }

    const reconcileWardId = shouldReconcileWardAfterImport({
      duplicateStrategy: job.duplicateStrategy,
      failedRows: failed,
      wardIdsSeen,
      touchedSurveyIds,
    })
    if (reconcileWardId) {
      pruned = await this.reconcileWardOrphans({
        wardId: reconcileWardId,
        keepSurveyIds: touchedSurveyIds,
        importJobId: job.id,
        actorId: job.createdById,
      })
      if (pruned > 0) {
        this.logger.log(
          `Import ${job.id}: soft-deleted ${pruned} orphan survey(s) in ward ${reconcileWardId} not present in file`
        )
      }
    }

    const status = importResultStatus(success, failed)

    return this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status,
        processedRows: processed,
        successRows: success,
        failedRows: failed,
        skippedRows: skipped,
        insertedRows: inserted,
        updatedRows: updated,
        warningRows: pruned,
        completedAt: new Date(),
      },
    })
  }

  /**
   * Soft-delete surveys in a ward that were not touched by a successful
   * single-ward UPDATE import (file is source of truth for that ward).
   */
  private async reconcileWardOrphans(input: {
    wardId: string
    keepSurveyIds: ReadonlySet<string>
    importJobId: string
    actorId: string | null
  }): Promise<number> {
    const orphans = await this.prisma.survey.findMany({
      where: orphanSurveyWhere(input.wardId, input.keepSurveyIds),
      select: { id: true, surveyId: true },
    })
    if (orphans.length === 0) return 0

    if (!shouldPruneOrphanCount(orphans.length, input.keepSurveyIds.size)) {
      this.logger.warn(
        `Import ${input.importJobId}: skipped reconcile for ward ${input.wardId} — ${orphans.length} orphan(s) exceeds safe prune cap (kept ${input.keepSurveyIds.size}). Re-upload the full ward file or prune manually.`
      )
      return 0
    }

    const now = new Date()
    await this.prisma.survey.updateMany({
      where: { id: { in: orphans.map((o) => o.id) } },
      data: { status: "DELETED", deletedAt: now },
    })

    for (const orphan of orphans) {
      await this.audit.log({
        action: "SURVEY_DELETED",
        entity: "Survey",
        entityId: orphan.id,
        actorId: input.actorId ?? undefined,
        oldValue: {
          surveyId: orphan.surveyId,
          source: "import-reconcile",
          importJobId: input.importJobId,
        } as Prisma.InputJsonValue,
      })
    }

    return orphans.length
  }

  private async processDhanauraJob(
    job: {
      id: string
      duplicateStrategy: DuplicateStrategy
      createdById: string | null
    },
    layout: WorkbookLayout
  ) {
    const map = layout.dhanauraMap
    if (!map) {
      return this.failJob(job.id, "Dhanaura column map is missing")
    }

    const wards = await this.prisma.ward.findMany()
    const wardByNumber = new Map(wards.map((ward) => [ward.number, ward]))
    const ulbCode = getUlbCode()

    let success = 0
    let failed = 0
    let skipped = 0
    let inserted = 0
    let updated = 0
    let processed = 0
    let emptyRows = 0
    let duplicateRows = 0
    let identityWarnings = 0
    let pruned = 0
    const touchedSurveyIds = new Set<string>()
    const wardIdsSeen = new Set<string>()
    const seenIdentity = new Set<string>()

    for (
      let rowNumber = layout.headerRowNumber + 1;
      rowNumber <= layout.sheet.rowCount;
      rowNumber++
    ) {
      const values = readRowStrings(
        layout.sheet.getRow(rowNumber),
        layout.columnCount
      )
      const parsed = parseDhanauraRow(values, map)
      if (parsed.empty) {
        emptyRows++
        continue
      }
      processed++

      if (parsed.errors.length > 0 || parsed.wardNumber == null) {
        failed++
        const rowErrors =
          parsed.errors.length > 0
            ? parsed.errors
            : [{ field: "wardNumber", message: "Ward number is required" }]
        for (const rowError of rowErrors) {
          await this.prisma.importError.create({
            data: {
              importJobId: job.id,
              rowNumber,
              field: rowError.field,
              surveyId: parsed.houseKey || null,
              message: rowError.message,
              severity: "error",
            },
          })
        }
        continue
      }

      const ward = wardByNumber.get(parsed.wardNumber)
      if (!ward) {
        failed++
        await this.prisma.importError.create({
          data: {
            importJobId: job.id,
            rowNumber,
            field: "wardNumber",
            surveyId: parsed.houseKey || null,
            message: `Ward not found for ${parsed.wardNumber}`,
            severity: "error",
          },
        })
        continue
      }

      const identity = surveyIdForHouse({
        ulbCode,
        wardNumber: ward.number,
        houseKey: parsed.houseKey,
        propertyType: parsed.propertyType,
      })
      const identityKey = `${ward.id}:${identity.parcelNo}:${identity.propertyNo}`
      if (seenIdentity.has(identityKey)) {
        failed++
        await this.prisma.importError.create({
          data: {
            importJobId: job.id,
            rowNumber,
            field: "houseNo",
            surveyId: identity.surveyId,
            message: "Duplicate house number in this file",
            severity: "error",
          },
        })
        continue
      }
      seenIdentity.add(identityKey)
      if (!identity.gisUseRecognized) {
        identityWarnings++
        await this.prisma.importError.create({
          data: {
            importJobId: job.id,
            rowNumber,
            field: "propertyType",
            surveyId: identity.surveyId,
            message: parsed.propertyType
              ? `GIS use code defaulted to R because property type "${parsed.propertyType}" is not recognized`
              : "GIS use code defaulted to R because property type is blank",
            severity: "warning",
          },
        })
      }
      const matchSelect = {
        id: true,
        presentHouseNo: true,
        houseNo: true,
        surveyId: true,
        parcelNo: true,
        taxRateZone: true,
        sourceExtras: true,
      } as const
      const toHouseMatch = (row: {
        id: string
        presentHouseNo: string | null
        houseNo: string | null
        surveyId: string
        parcelNo: string | null
        taxRateZone: string | null
        sourceExtras: Prisma.JsonValue
      }): HouseMatch => ({
        id: row.id,
        presentHouseNo: row.presentHouseNo,
        houseNo: row.houseNo,
        surveyId: row.surveyId,
        parcelNo: row.parcelNo,
        importLayout: readImportLayout(row.sourceExtras),
      })
      const matchedRows = await this.prisma.survey.findMany({
        where: { wardId: ward.id, presentHouseNo: parsed.newHouseNo },
        select: matchSelect,
      })
      const matches = matchedRows.map(toHouseMatch)
      const surveyIdRow = await this.prisma.survey.findUnique({
        where: { surveyId: identity.surveyId },
        select: matchSelect,
      })
      const savedZoneById = new Map(
        matchedRows.map((row) => [row.id, row.taxRateZone])
      )
      if (surveyIdRow)
        savedZoneById.set(surveyIdRow.id, surveyIdRow.taxRateZone)
      const decision = decideDhanauraMatch({
        matches,
        surveyIdHit: surveyIdRow ? toHouseMatch(surveyIdRow) : null,
        houseKey: parsed.houseKey,
        usesNewHouse: true,
        parcelNo: identity.parcelNo,
      })
      if (decision.kind === "error") {
        failed++
        await this.prisma.importError.create({
          data: {
            importJobId: job.id,
            rowNumber,
            field: "houseNo",
            surveyId: identity.surveyId,
            message: decision.message,
            severity: "error",
          },
        })
        continue
      }

      const zoneDecision = decideImportedTaxRateZone({
        roadWidth: parsed.roadWidthMeters,
        existingTaxRateZone:
          decision.kind === "existing" ? savedZoneById.get(decision.id) : null,
      })
      if (zoneDecision.kind === "error") {
        failed++
        await this.prisma.importError.create({
          data: {
            importJobId: job.id,
            rowNumber,
            field: zoneDecision.field,
            surveyId: identity.surveyId,
            message: zoneDecision.message,
            severity: "error",
          },
        })
        continue
      }
      if (zoneDecision.kind === "keep" && zoneDecision.warning) {
        identityWarnings++
        await this.prisma.importError.create({
          data: {
            importJobId: job.id,
            rowNumber,
            field: "roadWidthMeters",
            surveyId: identity.surveyId,
            message: zoneDecision.warning,
            severity: "warning",
          },
        })
      }

      const floorsRaw =
        parsed.floors.length > 0
          ? parsed.floors
              .map((floor) => `${floor.floorLabel} - ${floor.areaSqFt} SqFt`)
              .join(", ")
          : null
      const payload = {
        surveyId: identity.surveyId,
        wardId: ward.id,
        ownerName: parsed.ownerName || null,
        ownerFatherName: parsed.ownerFatherName || null,
        mobile: parsed.mobile || null,
        houseNo: parsed.oldHouseNo || null,
        presentHouseNo: parsed.newHouseNo || null,
        locality: parsed.locality || null,
        propertyType: parsed.propertyType || null,
        yearOfConstruction: parsed.yearOfConstruction || null,
        roadType: parsed.roadType || null,
        ...(zoneDecision.kind === "set"
          ? { taxRateZone: zoneDecision.taxRateZone }
          : {}),
        parcelNo: identity.parcelNo,
        propertyNo: identity.propertyNo,
        plotAreaSqFt: parsed.plotAreaSqFt,
        totalBuiltUpAreaSqFt: parsed.totalBuiltUpAreaSqFt,
        hasMunicipalWaterSupply: parsed.hasMunicipalWaterSupply,
        waterSourceType: parsed.waterSourceType,
        floorsRaw,
        sourceExtras: parsed.sourceExtras as Prisma.InputJsonValue,
        dataQualityStatus: computeDataQuality({
          mobile: parsed.mobile,
          propertyNo: identity.propertyNo,
          parcelNo: identity.parcelNo,
          plotAreaSqFt: parsed.plotAreaSqFt,
          totalBuiltUpAreaSqFt: parsed.totalBuiltUpAreaSqFt,
        }),
        importJobId: job.id,
        status: "ACTIVE" as const,
      }
      const floorCreate = parsed.floors.map((floor) => ({
        floorLabel: floor.floorLabel,
        areaSqFt: floor.areaSqFt,
        buildingType: floor.buildingType,
        sortOrder: floor.sortOrder,
        rawSegment: floor.rawSegment,
      }))

      try {
        if (decision.kind === "existing") {
          duplicateRows++
          const existing = await this.prisma.survey.findUnique({
            where: { id: decision.id },
          })
          if (!existing) {
            throw new Error("Matched survey disappeared before save")
          }
          const isSoftDeleted = existing.deletedAt != null
          if (job.duplicateStrategy === "SKIP" && !isSoftDeleted) {
            skipped++
            success++
            touchedSurveyIds.add(existing.id)
            wardIdsSeen.add(ward.id)
            continue
          }
          await this.prisma.$transaction(async (tx) => {
            await tx.surveyFloor.deleteMany({
              where: { surveyId: existing.id },
            })
            await tx.survey.update({
              where: { id: existing.id },
              data: {
                ...dhanauraUpdateWriteData(
                  payload,
                  existing.sourceExtras,
                  decision.replaceSurveyId,
                  parsed
                ),
                deletedAt: null,
                status: "ACTIVE",
                floors: { create: floorCreate },
              },
            })
          })
          updated++
          success++
          touchedSurveyIds.add(existing.id)
          wardIdsSeen.add(ward.id)
          continue
        }

        try {
          const created = await this.prisma.$transaction(async (tx) =>
            tx.survey.create({
              data: { ...payload, floors: { create: floorCreate } },
            })
          )
          inserted++
          success++
          touchedSurveyIds.add(created.id)
          wardIdsSeen.add(ward.id)
        } catch (createErr) {
          if (
            createErr instanceof Prisma.PrismaClientKnownRequestError &&
            createErr.code === "P2002"
          ) {
            const conflict = await this.prisma.survey.findUnique({
              where: { surveyId: identity.surveyId },
            })
            if (conflict && conflict.presentHouseNo === parsed.newHouseNo) {
              const replaceSurveyId =
                readImportLayout(conflict.sourceExtras) === "dhanaura-gis"
              const keepSavedZone = Boolean(conflict.taxRateZone?.trim())
              await this.prisma.$transaction(async (tx) => {
                await tx.surveyFloor.deleteMany({
                  where: { surveyId: conflict.id },
                })
                await tx.survey.update({
                  where: { id: conflict.id },
                  data: {
                    ...dhanauraUpdateWriteData(
                      keepSavedZone ? omitTaxRateZone(payload) : payload,
                      conflict.sourceExtras,
                      replaceSurveyId,
                      parsed
                    ),
                    deletedAt: null,
                    status: "ACTIVE",
                    floors: { create: floorCreate },
                  },
                })
              })
              updated++
              success++
              touchedSurveyIds.add(conflict.id)
              wardIdsSeen.add(ward.id)
              continue
            }
            throw new Error(
              "Survey Id already belongs to a different house number",
              { cause: createErr }
            )
          }
          throw createErr
        }
      } catch (err) {
        failed++
        await this.prisma.importError.create({
          data: {
            importJobId: job.id,
            rowNumber,
            surveyId: identity.surveyId,
            message: formatImportErrorMessage(err),
            severity: "error",
          },
        })
      }
    }

    const reconcileWardId = shouldReconcileWardAfterImport({
      duplicateStrategy: job.duplicateStrategy,
      failedRows: failed,
      wardIdsSeen,
      touchedSurveyIds,
    })
    if (reconcileWardId) {
      pruned = await this.reconcileWardOrphans({
        wardId: reconcileWardId,
        keepSurveyIds: touchedSurveyIds,
        importJobId: job.id,
        actorId: job.createdById,
      })
    }

    return this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: importResultStatus(success, failed),
        mappingPreset: "dhanaura-gis",
        columnMapping: layoutSummary(layout, {
          emptyRows,
          duplicateRows,
          identityWarnings,
        }),
        processedRows: processed,
        successRows: success,
        failedRows: failed,
        skippedRows: skipped,
        insertedRows: inserted,
        updatedRows: updated,
        warningRows: pruned,
        completedAt: new Date(),
      },
    })
  }

  private async failJob(jobId: string, message: string) {
    await this.prisma.importError.create({
      data: {
        importJobId: jobId,
        rowNumber: 1,
        message,
        severity: "error",
      },
    })
    return this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.FAILED,
        failedRows: 1,
        completedAt: new Date(),
      },
    })
  }

  /** Match existing survey by canonical id, legacy Excel id, or ward+parcel+property. */
  private async findImportDuplicate(input: {
    surveyId: string
    rawSurveyId: string
    wardId: string
    parcelNo: string | null
    propertyNo: string | null
  }) {
    const byCanonical = await this.prisma.survey.findUnique({
      where: { surveyId: input.surveyId },
    })
    // Include soft-deleted: surveyId is globally unique and create would P2002.
    if (byCanonical) return byCanonical

    if (input.rawSurveyId !== input.surveyId) {
      const byRaw = await this.prisma.survey.findUnique({
        where: { surveyId: input.rawSurveyId },
      })
      if (byRaw) return byRaw
    }

    if (input.parcelNo && input.propertyNo) {
      return this.prisma.survey.findFirst({
        where: {
          wardId: input.wardId,
          parcelNo: input.parcelNo,
          propertyNo: input.propertyNo,
          deletedAt: null,
        },
      })
    }

    return null
  }

  async exportSurveys(
    filters: { wardId?: string; status?: string },
    user: AuthUser
  ) {
    const ward = filters.wardId
      ? await this.prisma.ward.findUnique({ where: { id: filters.wardId } })
      : null

    const surveys = await this.prisma.survey.findMany({
      where: {
        deletedAt: null,
        status: filters.status ? (filters.status as never) : { not: "DELETED" },
        ...(filters.wardId ? { wardId: filters.wardId } : {}),
      },
      include: { ward: true },
      orderBy: [
        { ward: { number: "asc" } },
        { parcelNo: "asc" },
        { surveyId: "asc" },
      ],
      take: 50000,
    })

    const preset = detectExportPreset(ward?.number)
    const workbook = buildSurveyExportWorkbook(
      surveys as SurveyExportRecord[],
      preset
    )
    const fileName = buildSurveyExportFilename({ wardNumber: ward?.number })

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
    const objectKey = `exports/${fileName}`
    await this.storage.putObject(
      objectKey,
      buffer,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    const job = await this.prisma.exportJob.create({
      data: {
        filters,
        status: "COMPLETED",
        fileKey: objectKey,
        fileName,
        rowCount: surveys.length,
        createdById: user.id,
        completedAt: new Date(),
      },
    })

    const url = await this.storage.getSignedUrl(objectKey, 600)
    return { job, url }
  }
}

/** Short, actionable import error text (avoid dumping full Prisma invoke stacks). */
function formatImportErrorMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.target)
        ? (err.meta.target as string[]).join(", ")
        : String(err.meta?.target ?? "unique field")
      return `Duplicate value for ${target}. Another survey already uses this Survey Id / identity.`
    }
    if (err.code === "P2003") {
      return "Related record missing (foreign key). Check ward / reference data."
    }
    return `Database error ${err.code}: ${err.message.split("\n")[0] ?? err.message}`
  }
  if (err instanceof Error) {
    const first = err.message.split("\n")[0]?.trim()
    return first && first.length > 0 ? first : "Import row failed"
  }
  return "Import row failed"
}

function throwImportHeaderFailure(
  logger: Logger,
  failure: WorkbookHeaderFailure
): never {
  logger.warn(
    `Import header invalid sheet=${failure.selectedSheet} headerRow=${failure.headerRowNumber} missing=${failure.missingRequired.join("|")} unrecognized=${failure.unrecognizedHeaders.slice(0, 20).join("|")}`
  )
  throw new BadRequestException({
    code: failure.code,
    message: failure.message,
    details: {
      selectedSheet: failure.selectedSheet,
      headerRowNumber: failure.headerRowNumber,
      missingRequired: failure.missingRequired,
      unrecognizedHeaders: failure.unrecognizedHeaders,
      suggestedCorrection: failure.suggestedCorrection,
      normalizedHeaders: failure.normalizedHeaders,
    },
  })
}

function assertImportFile(file: Express.Multer.File) {
  if (!file?.buffer?.length) {
    throw new BadRequestException("Excel file is required")
  }
  const name = file.originalname.toLowerCase()
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    throw new BadRequestException("Only .xlsx or .xls files can be imported")
  }
  const maxMb = Number(process.env.IMPORT_MAX_FILE_SIZE_MB ?? 50)
  if (file.size > maxMb * 1024 * 1024) {
    throw new BadRequestException(`File must be under ${maxMb}MB`)
  }
}

async function readWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)
  } catch {
    throw new BadRequestException(
      "Workbook could not be read. Use a valid .xlsx file."
    )
  }
  if (workbook.worksheets.length === 0) {
    throw new BadRequestException("Workbook has no usable survey data")
  }
  return workbook
}

function omitTaxRateZone<T extends { taxRateZone?: string }>(payload: T) {
  const { taxRateZone, ...rest } = payload
  void taxRateZone
  return rest
}

function dhanauraWriteData<
  T extends {
    surveyId: string
    parcelNo: string
    propertyNo: string
    sourceExtras: Prisma.InputJsonValue
  },
>(payload: T, replaceSurveyId: boolean) {
  if (replaceSurveyId) return payload
  const { surveyId, parcelNo, propertyNo, sourceExtras, ...rest } = payload
  void surveyId
  void parcelNo
  void propertyNo
  void sourceExtras
  return rest
}

/**
 * UPDATE path for Dhanaura GIS: preserve blank owner cells and always merge
 * sourceExtras (previous owners + other GIS extras). Non-GIS matches still
 * strip surveyId / parcelNo / propertyNo via dhanauraWriteData.
 */
export function dhanauraUpdateWriteData<
  T extends {
    surveyId: string
    parcelNo: string
    propertyNo: string
    ownerName: string | null
    ownerFatherName: string | null
    sourceExtras: Prisma.InputJsonValue
  },
>(
  payload: T,
  existingSourceExtras: Prisma.JsonValue | null,
  replaceSurveyId: boolean,
  parsed: {
    ownerName: string
    ownerFatherName: string
    sourceExtras: Record<string, string>
  }
) {
  const base = dhanauraWriteData(payload, replaceSurveyId)
  const {
    ownerName: _ownerName,
    ownerFatherName: _ownerFatherName,
    ...rest
  } = base as T & Record<string, unknown>
  void _ownerName
  void _ownerFatherName
  const ownerFields = dhanauraOwnerFieldsForUpdate(parsed)
  return {
    ...rest,
    ...ownerFields,
    sourceExtras: mergeDhanauraSourceExtras(
      existingSourceExtras,
      parsed.sourceExtras
    ) as Prisma.InputJsonValue,
  }
}

function layoutSummary(
  layout: WorkbookLayout,
  counts?: {
    emptyRows: number
    duplicateRows: number
    identityWarnings?: number
  }
): Prisma.InputJsonValue {
  return {
    headerRowNumber: layout.headerRowNumber,
    unmappedColumns: layout.unmappedColumns,
    storedExtraFields: layout.storedExtraFields,
    emptyRows: counts?.emptyRows ?? 0,
    duplicateRows: counts?.duplicateRows ?? 0,
    identityWarnings: counts?.identityWarnings ?? 0,
  }
}

export function importResultStatus(
  success: number,
  failed: number
): ImportJobStatus {
  if (failed === 0 && success > 0) return ImportJobStatus.COMPLETED
  if (success > 0) return ImportJobStatus.PARTIAL
  return ImportJobStatus.FAILED
}
