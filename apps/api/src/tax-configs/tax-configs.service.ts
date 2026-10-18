import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type { Prisma } from "@prisma/client"

import { AuditService } from "../audit/audit.service"
import { PrismaService } from "../prisma/prisma.service"
import type {
  CopyTaxToWardsDto,
  CreateTaxConfigDto,
  PublishTaxConfigDto,
  TaxPreviewDto,
  UpdateTaxConfigParamsDto,
  UpsertTaxCellDto,
} from "./dto/tax-config.dto"
import {
  buildTaxPreview,
  decimalToString,
  missingTaxConfig,
  serializeTaxConfig,
} from "./tax-config-read"

function toNumber(value: { toString(): string } | number | string): number {
  return typeof value === "number" ? value : Number(value)
}

@Injectable()
export class TaxConfigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  private readonly include = {
    cells: {
      include: {
        roadWidthEntry: true,
        constructionEntry: true,
      },
    },
    assessmentYear: true,
    ward: true,
  } as const

  async get(wardId: string, assessmentYearId: string) {
    this.assertIds(wardId, assessmentYearId)
    const existing = await this.findConfig(wardId, assessmentYearId)
    if (!existing) return missingTaxConfig(wardId, assessmentYearId)
    return serializeTaxConfig(existing)
  }

  async createDraft(dto: CreateTaxConfigDto, actorId?: string) {
    const wardId = dto.wardId.trim()
    const assessmentYearId = dto.assessmentYearId.trim()
    this.assertIds(wardId, assessmentYearId)
    const existing = await this.findConfig(wardId, assessmentYearId)
    if (existing) return serializeTaxConfig(existing)

    const ward = await this.prisma.ward.findUnique({ where: { id: wardId } })
    if (!ward) throw new NotFoundException("Ward not found")

    const ay = await this.prisma.referenceEntry.findUnique({
      where: { id: assessmentYearId },
    })
    if (!ay) throw new NotFoundException("Assessment year not found")

    const created = await this.prisma.taxConfig.create({
      data: {
        wardId,
        assessmentYearId,
        status: "DRAFT",
      },
      include: this.include,
    })

    await this.audit.log({
      action: "CREATE",
      entity: "TaxConfig",
      entityId: created.id,
      newValue: { wardId, assessmentYearId },
      actorId,
    })

    return serializeTaxConfig(created)
  }

  async getPublishedForWard(wardId: string, assessmentYearId: string) {
    const config = await this.prisma.taxConfig.findUnique({
      where: { wardId_assessmentYearId: { wardId, assessmentYearId } },
      include: this.include,
    })
    if (!config || config.status !== "PUBLISHED") {
      throw new ConflictException(
        "No published tax configuration for this ward and assessment year. Configure and publish rates on Reports first."
      )
    }
    return config
  }

  async updateParams(
    id: string,
    dto: UpdateTaxConfigParamsDto,
    actorId?: string
  ) {
    const existing = await this.prisma.taxConfig.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException("Tax config not found")
    if (existing.status === "ARCHIVED") {
      throw new BadRequestException("Cannot edit archived tax config")
    }
    await this.assertAssessmentYearOpen(existing.assessmentYearId)

    const updated = await this.prisma.taxConfig.update({
      where: { id },
      data: {
        propertyTaxPct: dto.propertyTaxPct,
        waterTaxPct: dto.waterTaxPct,
        drainageTaxPct: dto.drainageTaxPct,
        penaltyPct: dto.penaltyPct,
        assessablePct: dto.assessablePct,
        commercialAssessablePct: dto.commercialAssessablePct,
        status: "DRAFT",
      },
      include: this.include,
    })

    await this.audit.log({
      action: "UPDATE_PARAMS",
      entity: "TaxConfig",
      entityId: id,
      oldValue: existing,
      newValue: updated,
      metadata: dto.reason ? { reason: dto.reason } : undefined,
      actorId,
    })

    return serializeTaxConfig(updated)
  }

  async upsertCells(id: string, cells: UpsertTaxCellDto[], actorId?: string) {
    const existing = await this.prisma.taxConfig.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException("Tax config not found")
    await this.assertAssessmentYearOpen(existing.assessmentYearId)

    for (const cell of cells) {
      await this.prisma.taxRateCell.upsert({
        where: {
          taxConfigId_roadWidthEntryId_constructionEntryId: {
            taxConfigId: id,
            roadWidthEntryId: cell.roadWidthEntryId,
            constructionEntryId: cell.constructionEntryId,
          },
        },
        create: {
          taxConfigId: id,
          roadWidthEntryId: cell.roadWidthEntryId,
          constructionEntryId: cell.constructionEntryId,
          annualRatePerSqFt: cell.annualRatePerSqFt,
        },
        update: {
          annualRatePerSqFt: cell.annualRatePerSqFt,
        },
      })
    }

    await this.prisma.taxConfig.update({
      where: { id },
      data: { status: "DRAFT" },
    })

    await this.audit.log({
      action: "UPSERT_CELLS",
      entity: "TaxConfig",
      entityId: id,
      newValue: { cells } as unknown as Prisma.InputJsonValue,
      actorId,
    })

    const saved = await this.prisma.taxConfig.findUniqueOrThrow({
      where: { id },
      include: this.include,
    })
    return serializeTaxConfig(saved)
  }

  async copyToAllWards(dto: CopyTaxToWardsDto, actorId?: string) {
    const source = await this.findConfig(
      dto.sourceWardId,
      dto.assessmentYearId
    )
    if (!source) {
      throw new NotFoundException(
        "No tax configuration exists for the source ward and assessment year"
      )
    }
    const cells: UpsertTaxCellDto[] = source.cells.flatMap((cell) => {
      const rate = decimalToString(cell.annualRatePerSqFt)
      if (rate == null) return []
      return [
        {
          roadWidthEntryId: cell.roadWidthEntryId,
          constructionEntryId: cell.constructionEntryId,
          annualRatePerSqFt: Number(rate),
        },
      ]
    })

    const wards = await this.prisma.ward.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    let updated = 0
    for (const ward of wards) {
      if (ward.id === dto.sourceWardId) continue
      const config = await this.createDraft(
        { wardId: ward.id, assessmentYearId: dto.assessmentYearId },
        actorId
      )
      await this.upsertCells(config.id, cells, actorId)
      await this.updateParams(
        config.id,
        {
          propertyTaxPct: toNumber(source.propertyTaxPct),
          waterTaxPct: toNumber(source.waterTaxPct),
          drainageTaxPct: toNumber(source.drainageTaxPct),
          penaltyPct: toNumber(source.penaltyPct),
          assessablePct: toNumber(source.assessablePct),
          commercialAssessablePct: toNumber(source.commercialAssessablePct),
        },
        actorId
      )
      updated += 1
    }

    return { updated }
  }

  async preview(dto: TaxPreviewDto) {
    this.assertIds(dto.wardId, dto.assessmentYearId)
    const config = await this.findConfig(dto.wardId, dto.assessmentYearId)
    return buildTaxPreview(config, dto)
  }

  async listVersions(taxConfigId: string) {
    return this.prisma.taxConfigVersion.findMany({
      where: { taxConfigId },
      orderBy: { version: "desc" },
    })
  }

  async publish(id: string, dto: PublishTaxConfigDto, actorId?: string) {
    const config = await this.prisma.taxConfig.findUnique({
      where: { id },
      include: this.include,
    })
    if (!config) throw new NotFoundException("Tax config not found")
    await this.assertAssessmentYearOpen(config.assessmentYearId)

    const nextVersion = config.version + (config.status === "PUBLISHED" ? 1 : 0)
    const snapshot = {
      params: {
        propertyTaxPct: toNumber(config.propertyTaxPct),
        waterTaxPct: toNumber(config.waterTaxPct),
        drainageTaxPct: toNumber(config.drainageTaxPct),
        penaltyPct: toNumber(config.penaltyPct),
        assessablePct: toNumber(config.assessablePct),
        commercialAssessablePct: toNumber(config.commercialAssessablePct),
      },
      cells: config.cells.map((c) => ({
        roadWidthEntryId: c.roadWidthEntryId,
        constructionEntryId: c.constructionEntryId,
        annualRatePerSqFt: toNumber(c.annualRatePerSqFt),
      })),
    }

    const versionRow = await this.prisma.taxConfigVersion.create({
      data: {
        taxConfigId: id,
        version: nextVersion || config.version,
        snapshot,
        reason: dto.reason,
        createdById: actorId,
      },
    })

    const published = await this.prisma.taxConfig.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        version: versionRow.version,
        publishedAt: new Date(),
        publishedById: actorId,
        changeReason: dto.reason,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : undefined,
      },
      include: this.include,
    })

    await this.audit.log({
      action: "PUBLISH",
      entity: "TaxConfig",
      entityId: id,
      newValue: { version: versionRow.version },
      metadata: dto.reason ? { reason: dto.reason } : undefined,
      actorId,
    })

    return serializeTaxConfig(published)
  }

  private assertIds(wardId: string, assessmentYearId: string) {
    if (!wardId?.trim() || !assessmentYearId?.trim()) {
      throw new BadRequestException(
        "Ward and assessment year are required"
      )
    }
  }

  private findConfig(wardId: string, assessmentYearId: string) {
    return this.prisma.taxConfig.findUnique({
      where: { wardId_assessmentYearId: { wardId, assessmentYearId } },
      include: this.include,
    })
  }

  private async assertAssessmentYearOpen(assessmentYearId: string) {
    const profile = await this.prisma.assessmentYearProfile.findUnique({
      where: { referenceEntryId: assessmentYearId },
    })
    if (!profile) return
    if (profile.status === "CLOSED" || profile.status === "ARCHIVED") {
      throw new ConflictException({
        code: "ASSESSMENT_YEAR_LOCKED",
        message:
          "This assessment year is closed or archived. Tax rates cannot be changed.",
      })
    }
  }
}
