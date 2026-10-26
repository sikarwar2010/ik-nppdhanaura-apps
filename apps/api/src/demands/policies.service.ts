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
  CreateAssessmentYearDto,
  PenaltyPolicyDto,
  RebatePolicyDto,
  UpdateAssessmentYearDto,
  UpsertAssessmentYearDto,
} from "./dto/policies.dto"
import { policyAmountProblems } from "./charge-preview"
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
    const ids = entries.map((entry) => entry.id)
    const profileIds = entries.flatMap((entry) => (entry.yearProfile ? [entry.yearProfile.id] : []))
    const [demands, payments, configs, rebates, penalties, audits] = await Promise.all([
      this.prisma.assessmentDemand.groupBy({
        by: ["assessmentYearId"],
        where: { assessmentYearId: { in: ids }, status: "PUBLISHED" },
        _count: { _all: true },
      }),
      this.prisma.payment.groupBy({
        by: ["assessmentYearId"],
        where: { assessmentYearId: { in: ids }, status: "SUCCESS" },
        _count: { _all: true },
      }),
      this.prisma.taxConfig.groupBy({
        by: ["assessmentYearId", "status"],
        where: { assessmentYearId: { in: ids } },
        _count: { _all: true },
      }),
      this.prisma.rebatePolicy.groupBy({
        by: ["assessmentYearId", "taxCategory"],
        where: { assessmentYearId: { in: ids }, status: "ACTIVE" },
        _count: { _all: true },
      }),
      this.prisma.penaltyPolicy.groupBy({
        by: ["assessmentYearId", "taxCategory"],
        where: { assessmentYearId: { in: ids }, status: "ACTIVE" },
        _count: { _all: true },
      }),
      profileIds.length
        ? this.prisma.auditLog.findMany({
            where: { entity: "AssessmentYearProfile", entityId: { in: profileIds } },
            orderBy: { createdAt: "desc" },
            include: { actor: { select: { name: true } } },
          })
        : Promise.resolve([]),
    ])
    const count = <T extends { assessmentYearId: string | null; _count: { _all: number } }>(
      rows: T[],
      id: string,
      filter: (row: T) => boolean = () => true
    ) => rows.filter((row) => row.assessmentYearId === id && filter(row)).reduce((n, row) => n + row._count._all, 0)
    return entries.map((entry) => {
      const lastAudit = entry.yearProfile
        ? audits.find((row) => row.entityId === entry.yearProfile!.id)
        : undefined
      const publishedDemands = count(demands, entry.id)
      const successfulPayments = count(payments, entry.id)
      return {
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
              createdAt: entry.yearProfile.createdAt.toISOString(),
              updatedAt: entry.yearProfile.updatedAt.toISOString(),
            }
          : null,
        usage: {
          publishedDemands,
          successfulPayments,
          taxConfigsPublished: count(configs, entry.id, (row) => row.status === "PUBLISHED"),
          taxConfigsDraft: count(configs, entry.id, (row) => row.status === "DRAFT"),
          activeRebateRules: rebates
            .filter((row) => row.assessmentYearId === entry.id)
            .map((row) => row.taxCategory),
          activePenaltyRules: penalties
            .filter((row) => row.assessmentYearId === entry.id)
            .map((row) => row.taxCategory),
          /** Dates and DRAFT status are locked once financial records exist. */
          locked: publishedDemands > 0 || successfulPayments > 0,
        },
        lastChange: lastAudit
          ? {
              action: lastAudit.action,
              at: lastAudit.createdAt.toISOString(),
              by: lastAudit.actor?.name ?? null,
            }
          : null,
      }
    })
  }

  /** Create the catalog entry and its dates in one transaction. */
  async createYear(dto: CreateAssessmentYearDto, actorId: string) {
    const label = dto.label.trim()
    const [first, second] = label.split("-").map(Number) as [number, number]
    if (second !== first + 1) {
      throw new BadRequestException({
        code: "ASSESSMENT_YEAR_LABEL_INVALID",
        message: "The second year must follow the first, for example 2027-2028.",
      })
    }
    const code = `AY_${first}_${second}`
    const category = await this.prisma.referenceCategory.findUnique({
      where: { code: "ASSESSMENT_YEAR" },
    })
    if (!category) {
      throw new NotFoundException({
        code: "ASSESSMENT_YEAR_CATALOG_MISSING",
        message: "The assessment-year catalog is not set up. Run the database seed.",
      })
    }
    const duplicate = await this.prisma.referenceEntry.findFirst({
      where: { categoryId: category.id, OR: [{ code }, { name: label }] },
    })
    if (duplicate) {
      throw new ConflictException({
        code: "ASSESSMENT_YEAR_DUPLICATE",
        message: `Assessment year ${label} already exists.`,
      })
    }
    await this.assertRange("", dto.startsOn, dto.endsOn, dto.status)
    const last = await this.prisma.referenceEntry.aggregate({
      where: { categoryId: category.id },
      _max: { sortOrder: true },
    })
    const created = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.referenceEntry.create({
        data: {
          categoryId: category.id,
          code,
          name: label,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
          status: "ACTIVE",
        },
      })
      const profile = await tx.assessmentYearProfile.create({
        data: {
          referenceEntryId: entry.id,
          startsOn: day(dto.startsOn),
          endsOn: day(dto.endsOn),
          status: dto.status,
        },
      })
      return { entry, profile }
    })
    await this.audit.log({
      action: "ASSESSMENT_YEAR_CREATED",
      entity: "AssessmentYearProfile",
      entityId: created.profile.id,
      actorId,
      newValue: { code, label, startsOn: dto.startsOn, endsOn: dto.endsOn, status: dto.status },
    })
    return {
      id: created.entry.id,
      code,
      name: label,
      profile: {
        id: created.profile.id,
        startsOn: dto.startsOn,
        endsOn: dto.endsOn,
        status: created.profile.status,
      },
    }
  }

  /** Financial records that make a year's dates and DRAFT status unchangeable. */
  private async yearInUse(referenceEntryId: string) {
    const [demands, payments] = await Promise.all([
      this.prisma.assessmentDemand.count({
        where: { assessmentYearId: referenceEntryId, status: "PUBLISHED" },
      }),
      this.prisma.payment.count({
        where: { assessmentYearId: referenceEntryId, status: "SUCCESS" },
      }),
    ])
    return { demands, payments, inUse: demands > 0 || payments > 0 }
  }

  async upsertYear(dto: UpsertAssessmentYearDto, actorId: string) {
    await this.requireAssessmentYear(dto.referenceEntryId)
    const current = await this.prisma.assessmentYearProfile.findUnique({
      where: { referenceEntryId: dto.referenceEntryId },
    })
    if (current) {
      // Existing dates are changed through updateYear, which enforces the locks.
      return this.updateYear(dto.referenceEntryId, dto, actorId)
    }
    if (dto.status === "DRAFT" && (await this.yearInUse(dto.referenceEntryId)).inUse) {
      throw new ConflictException({
        code: "ASSESSMENT_YEAR_IN_USE",
        message:
          "This year already has demands or payments, so it cannot be a draft. Choose Active or Closed.",
      })
    }
    await this.assertRange(
      "",
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
    if (
      (status === "CLOSED" || status === "ARCHIVED") &&
      status !== existing.status &&
      (dto.reason?.trim().length ?? 0) < 5
    ) {
      throw new BadRequestException({
        code: "ASSESSMENT_YEAR_REASON_REQUIRED",
        message: "Give a reason for closing or archiving this assessment year.",
      })
    }
    const usage = await this.yearInUse(referenceEntryId)
    if (usage.inUse) {
      const datesChanged =
        startsOn !== dayString(existing.startsOn) || endsOn !== dayString(existing.endsOn)
      if (datesChanged) {
        throw new ConflictException({
          code: "ASSESSMENT_YEAR_IN_USE",
          message: `This year already has ${usage.demands} published demand(s) and ${usage.payments} payment(s), so its dates cannot change. Close or archive it instead.`,
        })
      }
      if (status === "DRAFT" && existing.status !== "DRAFT") {
        throw new ConflictException({
          code: "ASSESSMENT_YEAR_IN_USE",
          message: "A year with demands or payments cannot go back to draft.",
        })
      }
    }
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
      oldValue: {
        status: existing.status,
        startsOn: dayString(existing.startsOn),
        endsOn: dayString(existing.endsOn),
      },
      newValue: auditValue({ startsOn, endsOn, status }),
      metadata: dto.reason?.trim() ? { reason: dto.reason.trim() } : undefined,
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
    await this.assertYearConfigured(dto.assessmentYearId)
    const row = await this.prisma.rebatePolicy.create({
      data: { ...this.rebateData(dto), createdById: actorId },
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
      // A draft keeps the tax it was created for.
      data: this.rebateData({ ...dto, taxCategory: existing.taxCategory }),
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

  async activateRebate(id: string, actorId: string, reason?: string) {
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
    await this.assertYearConfigured(existing.assessmentYearId)
    await this.prisma.$transaction(async (tx) => {
      // Replace only the active rule for the same tax. A combined rule and
      // tax-specific rules never stay active together (no double counting).
      await tx.rebatePolicy.updateMany({
        where: {
          assessmentYearId: existing.assessmentYearId,
          status: "ACTIVE",
          id: { not: id },
          ...supersededCategories(existing.taxCategory),
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
      oldValue: { status: existing.status },
      newValue: { status: "ACTIVE" },
      metadata: reason?.trim() ? { reason: reason.trim() } : undefined,
    })
    return { id, status: "ACTIVE" as const }
  }

  /** Withdraw a rule. Published demands keep the rebate or penalty they were issued with. */
  async archivePolicy(
    kind: "rebate" | "penalty",
    id: string,
    actorId: string,
    reason?: string
  ) {
    const existing =
      kind === "rebate"
        ? await this.prisma.rebatePolicy.findUnique({ where: { id } })
        : await this.prisma.penaltyPolicy.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({
        code: kind === "rebate" ? "REBATE_POLICY_NOT_FOUND" : "PENALTY_POLICY_NOT_FOUND",
        message: `${kind === "rebate" ? "Rebate" : "Penalty"} policy was not found`,
      })
    }
    if (existing.status === "ARCHIVED") return { id, status: "ARCHIVED" as const }
    if (kind === "rebate") {
      await this.prisma.rebatePolicy.update({ where: { id }, data: { status: "ARCHIVED" } })
    } else {
      await this.prisma.penaltyPolicy.update({ where: { id }, data: { status: "ARCHIVED" } })
    }
    await this.audit.log({
      action: kind === "rebate" ? "REBATE_POLICY_ARCHIVED" : "PENALTY_POLICY_ARCHIVED",
      entity: kind === "rebate" ? "RebatePolicy" : "PenaltyPolicy",
      entityId: id,
      actorId,
      oldValue: { status: existing.status },
      newValue: { status: "ARCHIVED" },
      metadata: reason?.trim() ? { reason: reason.trim() } : undefined,
    })
    return { id, status: "ARCHIVED" as const }
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
    await this.assertYearConfigured(dto.assessmentYearId)
    const row = await this.prisma.penaltyPolicy.create({
      data: { ...this.penaltyData(dto), createdById: actorId },
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
      data: this.penaltyData({ ...dto, taxCategory: existing.taxCategory }),
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

  async activatePenalty(id: string, actorId: string, reason?: string) {
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
    await this.assertYearConfigured(existing.assessmentYearId)
    await this.prisma.$transaction(async (tx) => {
      // Replace only the active rule for the same tax. A combined rule and
      // tax-specific rules never stay active together (no double counting).
      await tx.penaltyPolicy.updateMany({
        where: {
          assessmentYearId: existing.assessmentYearId,
          status: "ACTIVE",
          id: { not: id },
          ...supersededCategories(existing.taxCategory),
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
      oldValue: { status: existing.status },
      newValue: { status: "ACTIVE" },
      metadata: reason?.trim() ? { reason: reason.trim() } : undefined,
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
    this.assertAmountProblems({
      type: dto.rebateType,
      rate: dto.rate,
      fixedAmount: dto.fixedAmount,
      maxAmount: dto.maxAmount,
      startsOn: dto.startsOn,
      endsOn: dto.endsOn,
    })
  }

  private assertAmountProblems(input: Parameters<typeof policyAmountProblems>[0]) {
    const problems = policyAmountProblems(input)
    if (problems.length) {
      throw new BadRequestException({
        code: "POLICY_AMOUNT_INVALID",
        message: problems.map((p) => p.message).join(" "),
        details: { fields: problems },
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
    this.assertAmountProblems({
      type: dto.penaltyType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE",
      rate: dto.rate,
      fixedAmount: dto.fixedAmount,
      maxAmount: dto.maxAmount,
      startsOn: dto.startsOn,
      endsOn: dto.endsOn,
    })
  }

  /**
   * Rules can only be created or activated for an assessment year whose dates
   * are configured and which is not closed or archived.
   */
  private async assertYearConfigured(assessmentYearId: string) {
    const profile = await this.prisma.assessmentYearProfile.findUnique({
      where: { referenceEntryId: assessmentYearId },
    })
    if (!profile) {
      throw new ConflictException({
        code: "ASSESSMENT_YEAR_NOT_CONFIGURED",
        message:
          "Set this assessment year's start and end dates on the Assessment Years page before adding rules to it.",
      })
    }
    if (profile.status === "CLOSED" || profile.status === "ARCHIVED") {
      throw new ConflictException({
        code: "ASSESSMENT_YEAR_LOCKED",
        message: "This assessment year is closed or archived. Its rules cannot be changed.",
      })
    }
  }

  private rebateData(dto: RebatePolicyDto): Prisma.RebatePolicyCreateInput {
    const taxCategory = dto.taxCategory ?? "COMBINED"
    return {
      name: dto.name.trim(),
      assessmentYear: { connect: { id: dto.assessmentYearId } },
      taxCategory,
      rebateType: dto.rebateType,
      rate: dto.rate ?? null,
      fixedAmount: dto.fixedAmount ?? null,
      ...componentFlags(taxCategory, dto),
      includeArrears: dto.includeArrears,
      includePenalty: dto.includePenalty,
      // Interest is not split by tax, so only a combined rule can include it.
      includeInterest: taxCategory === "COMBINED" ? dto.includeInterest : false,
      maxAmount: dto.maxAmount ?? null,
      startsOn: dto.startsOn ? day(dto.startsOn) : null,
      endsOn: dto.endsOn ? day(dto.endsOn) : null,
      paymentDeadline: dto.paymentDeadline ? day(dto.paymentDeadline) : null,
    }
  }

  private penaltyData(dto: PenaltyPolicyDto): Prisma.PenaltyPolicyCreateInput {
    const taxCategory = dto.taxCategory ?? "COMBINED"
    return {
      name: dto.name.trim(),
      assessmentYear: { connect: { id: dto.assessmentYearId } },
      taxCategory,
      penaltyType: dto.penaltyType,
      rate: dto.rate ?? null,
      fixedAmount: dto.fixedAmount ?? null,
      trigger: dto.trigger,
      graceDays: dto.graceDays ?? 0,
      dueDate: dto.dueDate ? day(dto.dueDate) : null,
      ...componentFlags(taxCategory, dto),
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
    taxCategory: string
    approvedAt: Date | null
    assessmentYear?: { code: string; name: string }
  }) {
    return {
      id: row.id,
      name: row.name,
      taxCategory: row.taxCategory,
      approvedAt: row.approvedAt?.toISOString() ?? null,
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
    taxCategory: string
    approvedAt: Date | null
    assessmentYear?: { code: string; name: string }
  }) {
    return {
      id: row.id,
      name: row.name,
      taxCategory: row.taxCategory,
      approvedAt: row.approvedAt?.toISOString() ?? null,
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

type PolicyCategory = "COMBINED" | "PROPERTY_TAX" | "WATER_TAX" | "DRAINAGE_TAX"

/** A tax-specific rule covers exactly its own component. */
export function componentFlags(
  category: PolicyCategory,
  dto: { includePropertyTax: boolean; includeWaterTax: boolean; includeDrainageTax: boolean }
) {
  if (category === "COMBINED") {
    return {
      includePropertyTax: dto.includePropertyTax,
      includeWaterTax: dto.includeWaterTax,
      includeDrainageTax: dto.includeDrainageTax,
    }
  }
  return {
    includePropertyTax: category === "PROPERTY_TAX",
    includeWaterTax: category === "WATER_TAX",
    includeDrainageTax: category === "DRAINAGE_TAX",
  }
}

/** Active rules that a newly activated rule of this category replaces. */
export function supersededCategories(category: PolicyCategory): {
  taxCategory?: { in: PolicyCategory[] }
} {
  // A combined rule replaces every active rule of the year.
  if (category === "COMBINED") return {}
  // A tax-specific rule replaces the same tax and any combined rule.
  return { taxCategory: { in: [category, "COMBINED"] } }
}
