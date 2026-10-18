import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { Prisma } from "@prisma/client"

import { AuditService } from "../audit/audit.service"
import { PrismaService } from "../prisma/prisma.service"
import type {
  PenaltyPolicyDto,
  RebatePolicyDto,
  UpdateAssessmentYearDto,
  UpsertAssessmentYearDto,
} from "./dto/policies.dto"
import { findOverlappingYear } from "./year-overlap"

function day(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function dayString(value: Date | null): string | null {
  if (!value) return null
  return value.toISOString().slice(0, 10)
}

function auditValue(value: object): Prisma.InputJsonValue {
  const encoded: unknown = JSON.parse(JSON.stringify(value))
  if (!encoded || typeof encoded !== "object" || Array.isArray(encoded)) return {}
  return encoded as Prisma.InputJsonObject
}

@Injectable()
export class PoliciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async listYears() {
    const entries = await this.prisma.referenceEntry.findMany({
      where: { category: { code: "ASSESSMENT_YEAR" } },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      include: { yearProfile: true },
    })
    return entries.map((entry) => ({
      id: entry.id,
      code: entry.code,
      name: entry.name,
      catalogStatus: entry.status,
      profile: entry.yearProfile
        ? {
            id: entry.yearProfile.id,
            startsOn: dayString(entry.yearProfile.startsOn),
            endsOn: dayString(entry.yearProfile.endsOn),
            status: entry.yearProfile.status,
          }
        : null,
    }))
  }

  async upsertYear(dto: UpsertAssessmentYearDto, actorId: string) {
    await this.requireAssessmentYear(dto.referenceEntryId)
    const current = await this.prisma.assessmentYearProfile.findUnique({
      where: { referenceEntryId: dto.referenceEntryId },
    })
    await this.assertRange(
      current?.id ?? "",
      dto.startsOn,
      dto.endsOn,
      dto.status
    )
    const profile = await this.prisma.assessmentYearProfile.upsert({
      where: { referenceEntryId: dto.referenceEntryId },
      create: {
        referenceEntryId: dto.referenceEntryId,
        startsOn: day(dto.startsOn),
        endsOn: day(dto.endsOn),
        status: dto.status,
      },
      update: {
        startsOn: day(dto.startsOn),
        endsOn: day(dto.endsOn),
        status: dto.status,
      },
    })
    await this.audit.log({
      action: "ASSESSMENT_YEAR_SAVED",
      entity: "AssessmentYearProfile",
      entityId: profile.id,
      actorId,
      newValue: auditValue(dto),
    })
    return {
      id: profile.id,
      referenceEntryId: profile.referenceEntryId,
      startsOn: dayString(profile.startsOn),
      endsOn: dayString(profile.endsOn),
      status: profile.status,
    }
  }

  async updateYear(
    referenceEntryId: string,
    dto: UpdateAssessmentYearDto,
    actorId: string
  ) {
    const existing = await this.prisma.assessmentYearProfile.findUnique({
      where: { referenceEntryId },
    })
    if (!existing) {
      throw new NotFoundException({
        code: "ASSESSMENT_YEAR_PROFILE_NOT_FOUND",
        message: "Assessment year dates have not been configured",
      })
    }
    const startsOn = dto.startsOn ?? dayString(existing.startsOn) ?? ""
    const endsOn = dto.endsOn ?? dayString(existing.endsOn) ?? ""
    const status = dto.status ?? existing.status
    await this.assertRange(existing.id, startsOn, endsOn, status)
    const profile = await this.prisma.assessmentYearProfile.update({
      where: { id: existing.id },
      data: {
        startsOn: day(startsOn),
        endsOn: day(endsOn),
        status,
      },
    })
    await this.audit.log({
      action: "ASSESSMENT_YEAR_UPDATED",
      entity: "AssessmentYearProfile",
      entityId: profile.id,
      actorId,
      oldValue: { status: existing.status },
      newValue: auditValue(dto),
    })
    return {
      id: profile.id,
      referenceEntryId: profile.referenceEntryId,
      startsOn: dayString(profile.startsOn),
      endsOn: dayString(profile.endsOn),
      status: profile.status,
    }
  }

  async listRebates(assessmentYearId?: string) {
    const rows = await this.prisma.rebatePolicy.findMany({
      where: assessmentYearId ? { assessmentYearId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { assessmentYear: { select: { code: true, name: true } } },
    })
    return rows.map((row) => this.rebateDto(row))
  }

  async createRebate(dto: RebatePolicyDto, actorId: string) {
    this.assertRebateAmounts(dto)
    await this.requireAssessmentYear(dto.assessmentYearId)
    const row = await this.prisma.rebatePolicy.create({
      data: this.rebateData(dto),
      include: { assessmentYear: { select: { code: true, name: true } } },
    })
    await this.audit.log({
      action: "REBATE_POLICY_CREATED",
      entity: "RebatePolicy",
      entityId: row.id,
      actorId,
      newValue: auditValue(dto),
    })
    return this.rebateDto(row)
  }

  async updateRebate(id: string, dto: RebatePolicyDto, actorId: string) {
    const existing = await this.prisma.rebatePolicy.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({
        code: "REBATE_POLICY_NOT_FOUND",
        message: "Rebate policy was not found",
      })
    }
    if (existing.status !== "DRAFT") {
      throw new ConflictException({
        code: "POLICY_NOT_EDITABLE",
        message:
          "An approved rebate policy cannot be edited. Create a new draft. Published demands keep their snapshotted rebate.",
      })
    }
    this.assertRebateAmounts(dto)
    const row = await this.prisma.rebatePolicy.update({
      where: { id },
      data: this.rebateData(dto),
      include: { assessmentYear: { select: { code: true, name: true } } },
    })
    await this.audit.log({
      action: "REBATE_POLICY_UPDATED",
      entity: "RebatePolicy",
      entityId: id,
      actorId,
      newValue: auditValue(dto),
    })
    return this.rebateDto(row)
  }

  async activateRebate(id: string, actorId: string) {
    const existing = await this.prisma.rebatePolicy.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({
        code: "REBATE_POLICY_NOT_FOUND",
        message: "Rebate policy was not found",
      })
    }
    if (existing.status === "ARCHIVED") {
      throw new ConflictException({
        code: "POLICY_ARCHIVED",
        message: "An archived rebate policy cannot be activated",
      })
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.rebatePolicy.updateMany({
        where: {
          assessmentYearId: existing.assessmentYearId,
          status: "ACTIVE",
          id: { not: id },
        },
        data: { status: "ARCHIVED" },
      })
      await tx.rebatePolicy.update({
        where: { id },
        data: {
          status: "ACTIVE",
          approvedAt: new Date(),
          approvedById: actorId,
        },
      })
    })
    await this.audit.log({
      action: "REBATE_POLICY_ACTIVATED",
      entity: "RebatePolicy",
      entityId: id,
      actorId,
    })
    return { id, status: "ACTIVE" as const }
  }

  async listPenalties(assessmentYearId?: string) {
    const rows = await this.prisma.penaltyPolicy.findMany({
      where: assessmentYearId ? { assessmentYearId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { assessmentYear: { select: { code: true, name: true } } },
    })
    return rows.map((row) => this.penaltyDto(row))
  }

  async createPenalty(dto: PenaltyPolicyDto, actorId: string) {
    this.assertPenaltyAmounts(dto)
    await this.requireAssessmentYear(dto.assessmentYearId)
    const row = await this.prisma.penaltyPolicy.create({
      data: this.penaltyData(dto),
      include: { assessmentYear: { select: { code: true, name: true } } },
    })
    await this.audit.log({
      action: "PENALTY_POLICY_CREATED",
      entity: "PenaltyPolicy",
      entityId: row.id,
      actorId,
      newValue: auditValue(dto),
    })
    return this.penaltyDto(row)
  }

  async updatePenalty(id: string, dto: PenaltyPolicyDto, actorId: string) {
    const existing = await this.prisma.penaltyPolicy.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({
        code: "PENALTY_POLICY_NOT_FOUND",
        message: "Penalty policy was not found",
      })
    }
    if (existing.status !== "DRAFT") {
      throw new ConflictException({
        code: "POLICY_NOT_EDITABLE",
        message:
          "An approved penalty policy cannot be edited. Create a new draft. Published demands keep their snapshotted penalty.",
      })
    }
    this.assertPenaltyAmounts(dto)
    const row = await this.prisma.penaltyPolicy.update({
      where: { id },
      data: this.penaltyData(dto),
      include: { assessmentYear: { select: { code: true, name: true } } },
    })
    await this.audit.log({
      action: "PENALTY_POLICY_UPDATED",
      entity: "PenaltyPolicy",
      entityId: id,
      actorId,
      newValue: auditValue(dto),
    })
    return this.penaltyDto(row)
  }

  async activatePenalty(id: string, actorId: string) {
    const existing = await this.prisma.penaltyPolicy.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({
        code: "PENALTY_POLICY_NOT_FOUND",
        message: "Penalty policy was not found",
      })
    }
    if (existing.status === "ARCHIVED") {
      throw new ConflictException({
        code: "POLICY_ARCHIVED",
        message: "An archived penalty policy cannot be activated",
      })
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.penaltyPolicy.updateMany({
        where: {
          assessmentYearId: existing.assessmentYearId,
          status: "ACTIVE",
          id: { not: id },
        },
        data: { status: "ARCHIVED" },
      })
      await tx.penaltyPolicy.update({
        where: { id },
        data: {
          status: "ACTIVE",
          approvedAt: new Date(),
          approvedById: actorId,
        },
      })
    })
    await this.audit.log({
      action: "PENALTY_POLICY_ACTIVATED",
      entity: "PenaltyPolicy",
      entityId: id,
      actorId,
    })
    return { id, status: "ACTIVE" as const }
  }

  private async requireAssessmentYear(id: string) {
    const entry = await this.prisma.referenceEntry.findFirst({
      where: { id, category: { code: "ASSESSMENT_YEAR" } },
    })
    if (!entry) {
      throw new NotFoundException({
        code: "ASSESSMENT_YEAR_NOT_FOUND",
        message: "Assessment year was not found",
      })
    }
    return entry
  }

  private async assertRange(
    ignoreId: string,
    startsOn: string,
    endsOn: string,
    status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
  ) {
    if (endsOn < startsOn) {
      throw new BadRequestException({
        code: "ASSESSMENT_YEAR_RANGE_INVALID",
        message: "Assessment year end date must be on or after the start date",
      })
    }
    const rows = await this.prisma.assessmentYearProfile.findMany()
    const overlap = findOverlappingYear(
      { id: ignoreId, startsOn, endsOn, status },
      rows.map((row) => ({
        id: row.id,
        startsOn: dayString(row.startsOn) ?? "",
        endsOn: dayString(row.endsOn) ?? "",
        status: row.status,
      }))
    )
    if (overlap && overlap.id !== ignoreId) {
      throw new ConflictException({
        code: "ASSESSMENT_YEAR_OVERLAP",
        message: "Assessment year dates overlap another year for this municipality",
      })
    }
  }

  private assertRebateAmounts(dto: RebatePolicyDto) {
    if (dto.rebateType === "PERCENTAGE" && !dto.rate) {
      throw new BadRequestException({
        code: "REBATE_RATE_REQUIRED",
        message: "A percentage rebate needs a rate",
      })
    }
    if (dto.rebateType === "FIXED_AMOUNT" && !dto.fixedAmount) {
      throw new BadRequestException({
        code: "REBATE_AMOUNT_REQUIRED",
        message: "A fixed rebate needs an amount",
      })
    }
    if (dto.rate && Number(dto.rate) > 100) {
      throw new BadRequestException({
        code: "REBATE_RATE_INVALID",
        message: "Rebate rate cannot exceed 100 percent",
      })
    }
  }

  private assertPenaltyAmounts(dto: PenaltyPolicyDto) {
    if (dto.recurring) {
      throw new BadRequestException({
        code: "RECURRING_PENALTY_UNSUPPORTED",
        message:
          "Recurring or compounding penalties are not an approved calculation rule",
      })
    }
    if (dto.penaltyType !== "FIXED_AMOUNT" && !dto.rate) {
      throw new BadRequestException({
        code: "PENALTY_RATE_REQUIRED",
        message: "This penalty rule needs a rate",
      })
    }
    if (dto.penaltyType === "FIXED_AMOUNT" && !dto.fixedAmount) {
      throw new BadRequestException({
        code: "PENALTY_AMOUNT_REQUIRED",
        message: "A fixed penalty needs an amount",
      })
    }
    if (dto.trigger === "DUE_DATE_PASSED" && !dto.dueDate) {
      throw new BadRequestException({
        code: "PENALTY_DUE_DATE_REQUIRED",
        message: "A due-date penalty needs a due date. No date is assumed.",
      })
    }
  }

  private rebateData(dto: RebatePolicyDto): Prisma.RebatePolicyCreateInput {
    return {
      name: dto.name.trim(),
      assessmentYear: { connect: { id: dto.assessmentYearId } },
      rebateType: dto.rebateType,
      rate: dto.rate ?? null,
      fixedAmount: dto.fixedAmount ?? null,
      includePropertyTax: dto.includePropertyTax,
      includeWaterTax: dto.includeWaterTax,
      includeDrainageTax: dto.includeDrainageTax,
      includeArrears: dto.includeArrears,
      includePenalty: dto.includePenalty,
      includeInterest: dto.includeInterest,
      maxAmount: dto.maxAmount ?? null,
      startsOn: dto.startsOn ? day(dto.startsOn) : null,
      endsOn: dto.endsOn ? day(dto.endsOn) : null,
      paymentDeadline: dto.paymentDeadline ? day(dto.paymentDeadline) : null,
    }
  }

  private penaltyData(dto: PenaltyPolicyDto): Prisma.PenaltyPolicyCreateInput {
    return {
      name: dto.name.trim(),
      assessmentYear: { connect: { id: dto.assessmentYearId } },
      penaltyType: dto.penaltyType,
      rate: dto.rate ?? null,
      fixedAmount: dto.fixedAmount ?? null,
      trigger: dto.trigger,
      graceDays: dto.graceDays ?? 0,
      dueDate: dto.dueDate ? day(dto.dueDate) : null,
      includePropertyTax: dto.includePropertyTax,
      includeWaterTax: dto.includeWaterTax,
      includeDrainageTax: dto.includeDrainageTax,
      includeArrears: dto.includeArrears,
      applyAfterRebate: dto.applyAfterRebate === true,
      maxAmount: dto.maxAmount ?? null,
      startsOn: dto.startsOn ? day(dto.startsOn) : null,
      endsOn: dto.endsOn ? day(dto.endsOn) : null,
    }
  }

  private rebateDto(row: {
    id: string
    name: string
    assessmentYearId: string
    rebateType: string
    rate: Prisma.Decimal | null
    fixedAmount: Prisma.Decimal | null
    includePropertyTax: boolean
    includeWaterTax: boolean
    includeDrainageTax: boolean
    includeArrears: boolean
    includePenalty: boolean
    includeInterest: boolean
    maxAmount: Prisma.Decimal | null
    startsOn: Date | null
    endsOn: Date | null
    paymentDeadline: Date | null
    status: string
    assessmentYear?: { code: string; name: string }
  }) {
    return {
      id: row.id,
      name: row.name,
      assessmentYearId: row.assessmentYearId,
      assessmentYearName: row.assessmentYear?.name ?? null,
      rebateType: row.rebateType,
      rate: row.rate?.toString() ?? null,
      fixedAmount: row.fixedAmount?.toString() ?? null,
      includePropertyTax: row.includePropertyTax,
      includeWaterTax: row.includeWaterTax,
      includeDrainageTax: row.includeDrainageTax,
      includeArrears: row.includeArrears,
      includePenalty: row.includePenalty,
      includeInterest: row.includeInterest,
      maxAmount: row.maxAmount?.toString() ?? null,
      startsOn: dayString(row.startsOn),
      endsOn: dayString(row.endsOn),
      paymentDeadline: dayString(row.paymentDeadline),
      status: row.status,
    }
  }

  private penaltyDto(row: {
    id: string
    name: string
    assessmentYearId: string
    penaltyType: string
    rate: Prisma.Decimal | null
    fixedAmount: Prisma.Decimal | null
    trigger: string
    graceDays: number
    dueDate: Date | null
    includePropertyTax: boolean
    includeWaterTax: boolean
    includeDrainageTax: boolean
    includeArrears: boolean
    applyAfterRebate: boolean
    maxAmount: Prisma.Decimal | null
    startsOn: Date | null
    endsOn: Date | null
    status: string
    assessmentYear?: { code: string; name: string }
  }) {
    return {
      id: row.id,
      name: row.name,
      assessmentYearId: row.assessmentYearId,
      assessmentYearName: row.assessmentYear?.name ?? null,
      penaltyType: row.penaltyType,
      rate: row.rate?.toString() ?? null,
      fixedAmount: row.fixedAmount?.toString() ?? null,
      trigger: row.trigger,
      graceDays: row.graceDays,
      dueDate: dayString(row.dueDate),
      includePropertyTax: row.includePropertyTax,
      includeWaterTax: row.includeWaterTax,
      includeDrainageTax: row.includeDrainageTax,
      includeArrears: row.includeArrears,
      applyAfterRebate: row.applyAfterRebate,
      maxAmount: row.maxAmount?.toString() ?? null,
      startsOn: dayString(row.startsOn),
      endsOn: dayString(row.endsOn),
      status: row.status,
    }
  }
}
