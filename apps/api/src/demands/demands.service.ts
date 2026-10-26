import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  AssessmentDemandSource,
  DemandAdjustmentKind,
  PaymentAllocationStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client"

import { AuditService } from "../audit/audit.service"
import { PrismaService } from "../prisma/prisma.service"
import { computePublicDuesPayload } from "../public-property-tax/dues.util"
import { TaxConfigsService } from "../tax-configs/tax-configs.service"
import type {
  AllocatePaymentDto,
  CreateAdjustmentDto,
  OpeningBalanceDto,
  PublishDemandDto,
  ReversePaymentDto,
} from "./dto/demands.dto"
import type { HistoricalImportRowDto } from "./dto/policies.dto"
import {
  rowsFromWorkbook,
  historicalRowError,
  historicalTemplateBuffer,
  normalizeHistoricalRow,
  workbookHeaders,
} from "./historical-import"
import {
  exceedsMoney,
  isPositiveMoney,
  isZeroMoney,
  minMoney,
  money,
  moneyString,
  sumMoney,
} from "./money"
import {
  calculateOutstanding,
  componentsFromParts,
  countedPayments,
  isPublishBlocked,
  ownOutstanding,
  type LedgerDemand,
  type OutstandingBreakdown,
  type SuccessPaymentFact,
  type UnreconciledYear,
} from "./outstanding"
import {
  type CategoryCharges,
  type CategoryPenaltyRule,
  type CategoryRebateRule,
  type ChargeBreakdown,
  PolicyConflictError,
  rebateRuleFromPolicy,
  resolveCategoryCharges,
} from "./category-charges"
import { penaltyRuleFromPolicy } from "./penalty-policy"
import { insertPublishedDemand } from "./persist"
import { policyIsCurrent } from "./rebate"

const SUCCESS_PAYMENT_WHERE = {
  status: PaymentStatus.SUCCESS,
  OR: [{ gateway: null }, { gateway: { not: "sandbox" } }],
}

type DemandWithLedger = Prisma.AssessmentDemandGetPayload<{
  include: {
    assessmentYear: { select: { id: true; code: true; name: true } }
    adjustments: true
    allocations: {
      include: {
        payment: {
          select: {
            id: true
            status: true
            amount: true
            assessmentYearId: true
            paymentReference: true
            receiptNumber: true
            gatewayReference: true
            remarks: true
          }
        }
      }
    }
  }
}>

@Injectable()
export class DemandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly taxConfigs: TaxConfigsService
  ) {}

  async outstanding(
    surveyId: string,
    assessmentYearId: string
  ): Promise<OutstandingBreakdown> {
    const loaded = await this.loadBreakdown(surveyId, assessmentYearId)
    return loaded.breakdown
  }

  async publish(dto: PublishDemandDto, actorId: string) {
    const surveyId = dto.surveyId.trim()
    const assessmentYearId = dto.assessmentYearId.trim()
    const existing = await this.findPublished(surveyId, assessmentYearId)
    if (existing) {
      const breakdown = await this.outstanding(surveyId, assessmentYearId)
      return { demand: this.toDemandDto(existing), breakdown, created: false }
    }

    const loaded = await this.loadBreakdown(surveyId, assessmentYearId)
    await this.assertYearWritable(assessmentYearId)
    if (loaded.breakdown.missingHistoryYears.length > 0) {
      throw new ConflictException({
        code: "HISTORY_INCOMPLETE",
        message:
          "Earlier assessment years do not have a verified published balance. Enter and verify those years, including an explicit zero when there is no dues. Missing years are not treated as zero.",
        details: { missingHistoryYears: loaded.breakdown.missingHistoryYears },
      })
    }
    if (isPublishBlocked(loaded.breakdown)) {
      throw new ConflictException({
        code: "UNRECONCILED_BALANCE",
        message:
          "Historical balances are not reconciled. Record an opening balance for each year that has a successful payment and no published demand, and allocate payments that have no assessment year, before publishing this demand.",
        details: {
          unreconciledYears: loaded.breakdown.unreconciledYears,
          unassignedPaymentIds: loaded.breakdown.unassignedPaymentIds,
        },
      })
    }
    if (!loaded.calculated) {
      throw new ConflictException({
        code: "TAX_CONFIG_NOT_PUBLISHED",
        message:
          "No published tax configuration for this ward and assessment year.",
      })
    }

    const idempotencyKey =
      dto.idempotencyKey?.trim() ||
      `demand:CALCULATED:${surveyId}:${assessmentYearId}`
    const created = await this.persistPublished({
      surveyId,
      wardId: loaded.survey.wardId,
      assessmentYearId,
      yearCode: loaded.year.code,
      source: AssessmentDemandSource.CALCULATED,
      taxConfigId: loaded.calculated.taxConfigId,
      taxConfigVersion: loaded.calculated.taxConfigVersion,
      components: loaded.calculated.components,
      openingArrears: loaded.breakdown.openingArrears,
      rebateAmount: loaded.breakdown.rebateAmount,
      rebatePolicyId: loaded.rebatePolicyId,
      penaltyPolicyId: loaded.penaltyPolicyId,
      chargeBreakdown: loaded.chargeBreakdown,
      idempotencyKey,
      actorId,
    })
    if (created.created) {
      await this.audit.log({
        action: "DEMAND_PUBLISHED",
        entity: "AssessmentDemand",
        entityId: created.row.id,
        actorId,
        newValue: {
          surveyId,
          assessmentYearId,
          currentYearDemand: moneyString(created.row.currentYearDemand),
          openingArrears: moneyString(created.row.openingArrears),
          source: created.row.source,
        },
      })
    }
    const breakdown = await this.outstanding(surveyId, assessmentYearId)
    return {
      demand: this.toDemandDto(created.row),
      breakdown,
      created: created.created,
    }
  }

  async openingBalance(dto: OpeningBalanceDto, actorId: string) {
    const surveyId = dto.surveyId.trim()
    const assessmentYearId = dto.assessmentYearId.trim()
    const existing = await this.findPublished(surveyId, assessmentYearId)
    if (existing) {
      throw new ConflictException({
        code: "DUPLICATE_DEMAND",
        message:
          "A published financial record already exists for this property and assessment year. It was not overwritten.",
        details: { demandId: existing.id },
      })
    }

    await this.assertYearWritable(assessmentYearId)
    const loaded = await this.loadBreakdown(surveyId, assessmentYearId, {
      skipCalculated: true,
    })
    const balanceKind = dto.balanceKind ?? "COMPONENTS"
    const historicalPayments = dto.historicalPayments ?? "0"
    if (balanceKind === "CLOSING_ONLY") {
      if (
        (dto.credits?.length ?? 0) > 0 ||
        (dto.allocations?.length ?? 0) > 0 ||
        money(historicalPayments).gt(0) ||
        money(dto.waterTax).gt(0) ||
        money(dto.drainageTax).gt(0) ||
        money(dto.penalty).gt(0) ||
        money(dto.interest ?? 0).gt(0)
      ) {
        throw new BadRequestException({
          code: "CLOSING_BALANCE_MIXED",
          message:
            "A verified closing balance cannot be combined with component charges, payments, or credits. That would count the same balance twice.",
        })
      }
    }
    const components = componentsFromParts({
      propertyTax:
        balanceKind === "CLOSING_ONLY"
          ? (dto.verifiedClosing ?? dto.propertyTax)
          : dto.propertyTax,
      waterTax: balanceKind === "CLOSING_ONLY" ? "0" : dto.waterTax,
      drainageTax: balanceKind === "CLOSING_ONLY" ? "0" : dto.drainageTax,
      penalty: balanceKind === "CLOSING_ONLY" ? "0" : dto.penalty,
      interest: balanceKind === "CLOSING_ONLY" ? "0" : (dto.interest ?? "0"),
    })
    if (balanceKind === "COMPONENTS" && dto.verifiedClosing) {
      const closing = ownOutstanding({
        currentYearDemand: components.currentYearDemand,
        interest: components.interest,
        credits: moneyString(
          sumMoney((dto.credits ?? []).map((credit) => credit.amount))
        ),
        debits: "0.00",
        payments: historicalPayments,
        rebate: "0.00",
      })
      if (!money(closing).eq(money(dto.verifiedClosing))) {
        throw new BadRequestException({
          code: "CLOSING_BALANCE_MISMATCH",
          message:
            "The verified closing balance does not match demand, payments, and credits. The row was not saved.",
        })
      }
    }
    const idempotencyKey =
      dto.idempotencyKey?.trim() ||
      `demand:OPENING_BALANCE:${surveyId}:${assessmentYearId}`

    const created = await this.prisma.$transaction(async (tx) => {
      const inserted = await insertPublishedDemand({
        findPublished: () =>
          tx.assessmentDemand.findFirst({
            where: {
              surveyId,
              assessmentYearId,
              status: "PUBLISHED",
            },
          }),
        create: () =>
          tx.assessmentDemand.create({
            data: {
              surveyId,
              wardId: loaded.survey.wardId,
              assessmentYearId,
              taxConfigId: null,
              taxConfigVersion: null,
              demandReference: this.demandReference(
                loaded.survey.surveyId,
                loaded.year.code
              ),
              status: "PUBLISHED",
              source: AssessmentDemandSource.OPENING_BALANCE,
              propertyTax: components.propertyTax,
              waterTax: components.waterTax,
              drainageTax: components.drainageTax,
              penalty: components.penalty,
              interest: components.interest,
              currentYearDemand: components.currentYearDemand,
              openingArrears: loaded.breakdown.openingArrears,
              historicalPayments,
              verificationStatus: "UNVERIFIED",
              balanceKind,
              sourceReference: dto.sourceReference?.trim() || null,
              remarks: dto.remarks?.trim() || dto.reason.trim(),
              idempotencyKey,
              publishedAt: new Date(),
              publishedById: actorId,
            },
          }),
      })
      if (!inserted.created) return inserted

      for (const credit of dto.credits ?? []) {
        await tx.demandAdjustment.create({
          data: {
            assessmentDemandId: inserted.row.id,
            kind: DemandAdjustmentKind.CREDIT,
            amount: credit.amount,
            reason: credit.reason.trim(),
            createdById: actorId,
          },
        })
      }

      const credits = sumMoney((dto.credits ?? []).map((credit) => credit.amount))
      let paid = money(0)
      for (const line of dto.allocations ?? []) {
        await this.assertAllocationFits(tx, {
          paymentId: line.paymentId,
          demandId: inserted.row.id,
          surveyId,
          assessmentYearId,
          amount: line.amount,
          demandUnpaid: moneyString(
            money(components.currentYearDemand)
              .plus(components.interest)
              .minus(credits)
              .minus(historicalPayments)
              .minus(paid)
          ),
          actorId,
        })
        paid = money(paid.plus(line.amount))
      }
      return inserted
    })

    if (created.created) {
      await this.audit.log({
        action: "DEMAND_OPENING_BALANCE",
        entity: "AssessmentDemand",
        entityId: created.row.id,
        actorId,
        newValue: {
          surveyId,
          assessmentYearId,
          reason: dto.reason.trim(),
          currentYearDemand: components.currentYearDemand,
          interest: components.interest,
        },
      })
    }
    const breakdown = await this.outstanding(surveyId, assessmentYearId)
    return {
      demand: this.toDemandDto(created.row),
      breakdown,
      created: created.created,
    }
  }

  async allocate(paymentId: string, dto: AllocatePaymentDto, actorId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } })
      if (!payment) {
        throw new NotFoundException({
          code: "PAYMENT_NOT_FOUND",
          message: "Payment was not found",
        })
      }
      this.assertPaymentAllocatable(payment.status)
      if (!payment.surveyId) {
        throw new BadRequestException({
          code: "PAYMENT_PROPERTY_REQUIRED",
          message: "Payment is not linked to a property",
        })
      }
      const existing = await tx.paymentAllocation.findMany({
        where: { paymentId, status: PaymentAllocationStatus.ACTIVE },
      })
      const incoming = sumMoney(dto.lines.map((line) => line.amount))
      const already = sumMoney(existing.map((row) => row.amount.toString()))
      const covered = money(already.plus(incoming))
      if (!covered.eq(money(payment.amount))) {
        throw new BadRequestException({
          code: "ALLOCATION_SUM_MISMATCH",
          message:
            "Active allocations must equal the payment amount. Amounts above a demand's unpaid balance cannot be allocated.",
        })
      }
      const seen = new Set(existing.map((row) => row.assessmentDemandId))
      for (const line of dto.lines) {
        if (seen.has(line.assessmentDemandId)) {
          throw new BadRequestException({
            code: "DUPLICATE_ALLOCATION",
            message: "This payment is already allocated to that demand",
          })
        }
        seen.add(line.assessmentDemandId)
        if (!isPositiveMoney(line.amount)) {
          throw new BadRequestException({
            code: "ALLOCATION_AMOUNT_REQUIRED",
            message: "Allocation amount must be greater than zero",
          })
        }
        const unpaid = await this.demandUnpaid(tx, line.assessmentDemandId)
        if (exceedsMoney(line.amount, unpaid.outstanding)) {
          throw new BadRequestException({
            code: "ALLOCATION_EXCEEDS_UNPAID",
            message:
              "Allocated amount exceeds the unpaid balance of the demand",
          })
        }
        if (unpaid.surveyId !== payment.surveyId) {
          throw new BadRequestException({
            code: "ALLOCATION_PROPERTY_MISMATCH",
            message: "Payment and demand belong to different properties",
          })
        }
        if (
          payment.assessmentYearId &&
          payment.assessmentYearId !== unpaid.assessmentYearId
        ) {
          throw new BadRequestException({
            code: "ALLOCATION_YEAR_MISMATCH",
            message:
              "This payment is tagged to a different assessment year and cannot be allocated here",
          })
        }
        await tx.paymentAllocation.create({
          data: {
            paymentId,
            assessmentDemandId: line.assessmentDemandId,
            amount: line.amount,
            status: PaymentAllocationStatus.ACTIVE,
            createdById: actorId,
          },
        })
      }
      return payment
    })

    await this.audit.log({
      action: "PAYMENT_ALLOCATED",
      entity: "Payment",
      entityId: paymentId,
      actorId,
      newValue: {
        lines: dto.lines.map((line) => ({
          assessmentDemandId: line.assessmentDemandId,
          amount: line.amount,
        })),
      },
    })
    return { paymentId: result.id }
  }

  async tryAllocateTaggedPayment(paymentId: string) {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } })
      if (!payment) return
      if (payment.gateway === "sandbox") return
      if (payment.status !== PaymentStatus.SUCCESS) return
      if (!payment.surveyId || !payment.assessmentYearId) return
      const demand = await tx.assessmentDemand.findFirst({
        where: {
          surveyId: payment.surveyId,
          assessmentYearId: payment.assessmentYearId,
          status: "PUBLISHED",
        },
      })
      if (!demand) return
      const existing = await tx.paymentAllocation.findMany({
        where: { paymentId, status: PaymentAllocationStatus.ACTIVE },
      })
      if (existing.some((row) => row.assessmentDemandId === demand.id)) return
      const already = sumMoney(existing.map((row) => row.amount.toString()))
      const room = money(payment.amount).minus(already)
      if (!room.gt(0)) return
      const unpaid = await this.demandUnpaid(tx, demand.id)
      const amount = minMoney(room, unpaid.outstanding)
      if (!amount.gt(0)) return
      await tx.paymentAllocation.create({
        data: {
          paymentId,
          assessmentDemandId: demand.id,
          amount: moneyString(amount),
          status: PaymentAllocationStatus.ACTIVE,
        },
      })
    })
  }

  async adjust(demandId: string, dto: CreateAdjustmentDto, actorId: string) {
    if (!isPositiveMoney(dto.amount)) {
      throw new BadRequestException({
        code: "ADJUSTMENT_AMOUNT_REQUIRED",
        message: "Adjustment amount must be greater than zero",
      })
    }
    const row = await this.prisma.$transaction(async (tx) => {
      const demand = await tx.assessmentDemand.findFirst({
        where: { id: demandId, status: "PUBLISHED" },
      })
      if (!demand) {
        throw new NotFoundException({
          code: "DEMAND_NOT_FOUND",
          message: "Published demand was not found",
        })
      }
      if (dto.kind === "CREDIT") {
        const unpaid = await this.demandUnpaid(tx, demand.id)
        if (exceedsMoney(dto.amount, unpaid.outstanding)) {
          throw new BadRequestException({
            code: "CREDIT_EXCEEDS_UNPAID",
            message: "Credit exceeds the unpaid balance of the demand",
          })
        }
      }
      if (dto.reversesAdjustmentId) {
        const original = await tx.demandAdjustment.findFirst({
          where: { id: dto.reversesAdjustmentId, assessmentDemandId: demandId },
        })
        if (!original) {
          throw new NotFoundException({
            code: "ADJUSTMENT_NOT_FOUND",
            message: "Adjustment to reverse was not found",
          })
        }
        const already = await tx.demandAdjustment.findFirst({
          where: { reversesAdjustmentId: original.id },
        })
        if (already) {
          throw new ConflictException({
            code: "ADJUSTMENT_ALREADY_REVERSED",
            message: "This adjustment has already been reversed",
          })
        }
      }
      return tx.demandAdjustment.create({
        data: {
          assessmentDemandId: demandId,
          kind: dto.kind,
          amount: dto.amount,
          reason: dto.reason.trim(),
          createdById: actorId,
          reversesAdjustmentId: dto.reversesAdjustmentId,
        },
      })
    })
    await this.audit.log({
      action: "DEMAND_ADJUSTED",
      entity: "AssessmentDemand",
      entityId: demandId,
      actorId,
      newValue: {
        adjustmentId: row.id,
        kind: row.kind,
        amount: moneyString(row.amount),
        reason: row.reason,
      },
    })
    return {
      id: row.id,
      kind: row.kind,
      amount: moneyString(row.amount),
      reason: row.reason,
    }
  }

  async reversePayment(
    paymentId: string,
    dto: ReversePaymentDto,
    actorId: string
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } })
      if (!payment) {
        throw new NotFoundException({
          code: "PAYMENT_NOT_FOUND",
          message: "Payment was not found",
        })
      }
      if (payment.status !== PaymentStatus.SUCCESS) {
        throw new ConflictException({
          code: "PAYMENT_NOT_REVERSIBLE",
          message:
            "Only a successful payment can be reversed. Pending, failed, and already reversed payments do not change outstanding balances.",
        })
      }
      // Lock the demands this payment settled so a concurrent collection
      // cannot allocate against a balance that is about to change.
      const settled = await tx.paymentAllocation.findMany({
        where: { paymentId, status: PaymentAllocationStatus.ACTIVE },
        select: { assessmentDemandId: true },
      })
      if (settled.length > 0) {
        await tx.$queryRaw`SELECT id FROM assessment_demand WHERE id IN (${Prisma.join(
          settled.map((row) => row.assessmentDemandId)
        )}) FOR UPDATE`
      }
      const paymentRow = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          reversedAt: new Date(),
          reversedById: actorId,
          reversalReason: dto.reason.trim(),
        },
      })
      await tx.paymentAllocation.updateMany({
        where: { paymentId, status: PaymentAllocationStatus.ACTIVE },
        data: {
          status: PaymentAllocationStatus.REVERSED,
          reversedAt: new Date(),
        },
      })
      return paymentRow
    })
    await this.audit.log({
      action: "PAYMENT_REVERSED",
      entity: "Payment",
      entityId: paymentId,
      actorId,
      oldValue: { status: PaymentStatus.SUCCESS },
      newValue: { status: updated.status, reason: dto.reason.trim() },
    })
    return { id: updated.id, status: updated.status }
  }

  async history(demandId: string, page = 1, pageSize = 20) {
    const demand = await this.prisma.assessmentDemand.findUnique({
      where: { id: demandId },
    })
    if (!demand) {
      throw new NotFoundException({
        code: "DEMAND_NOT_FOUND",
        message: "Demand was not found",
      })
    }
    const [adjustments, allocations, notices, audits] = await Promise.all([
      this.prisma.demandAdjustment.findMany({
        where: { assessmentDemandId: demandId },
      }),
      this.prisma.paymentAllocation.findMany({
        where: { assessmentDemandId: demandId },
      }),
      this.prisma.demandNoticeIssue.findMany({
        where: { assessmentDemandId: demandId },
      }),
      this.prisma.auditLog.findMany({
        where: { entity: "AssessmentDemand", entityId: demandId },
      }),
    ])
    const items = [
      ...adjustments.map((row) => ({
        type: "ADJUSTMENT" as const,
        at: row.createdAt.toISOString(),
        id: row.id,
        amount: moneyString(row.amount),
        kind: row.kind,
        reason: row.reason,
        actorId: row.createdById,
      })),
      ...allocations.map((row) => ({
        type: "ALLOCATION" as const,
        at: row.createdAt.toISOString(),
        id: row.id,
        amount: moneyString(row.amount),
        status: row.status,
        paymentId: row.paymentId,
        actorId: row.createdById,
      })),
      ...notices.map((row) => ({
        type: "NOTICE" as const,
        at: row.generatedAt.toISOString(),
        id: row.id,
        version: row.version,
        fileKey: row.fileKey,
        actorId: row.generatedById,
      })),
      ...audits.map((row) => ({
        type: "AUDIT" as const,
        at: row.createdAt.toISOString(),
        id: row.id,
        action: row.action,
        actorId: row.actorId,
      })),
    ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    const start = (page - 1) * pageSize
    return {
      items: items.slice(start, start + pageSize),
      meta: {
        page,
        pageSize,
        total: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
      },
    }
  }

  async recordNoticeIssue(input: {
    assessmentDemandId: string
    fileKey?: string | null
    generatedById?: string | null
  }) {
    const latest = await this.prisma.demandNoticeIssue.findFirst({
      where: { assessmentDemandId: input.assessmentDemandId },
      orderBy: { version: "desc" },
    })
    return this.prisma.demandNoticeIssue.create({
      data: {
        assessmentDemandId: input.assessmentDemandId,
        version: (latest?.version ?? 0) + 1,
        fileKey: input.fileKey ?? null,
        generatedById: input.generatedById ?? null,
      },
    })
  }

  async dueStatusForPublishedDemands(
    pairs: Array<{ surveyId: string; assessmentYearId: string }>
  ): Promise<
    Map<string, { netOutstanding: string; authoritative: boolean }>
  > {
    const result = new Map<
      string,
      { netOutstanding: string; authoritative: boolean }
    >()
    for (const pair of pairs) {
      const breakdown = await this.outstanding(
        pair.surveyId,
        pair.assessmentYearId
      )
      if (!breakdown.publishedDemandId) continue
      result.set(`${pair.surveyId}:${pair.assessmentYearId}`, {
        netOutstanding: breakdown.netOutstanding,
        authoritative: breakdown.authoritative,
      })
    }
    return result
  }

  private async persistPublished(input: {
    surveyId: string
    wardId: string
    assessmentYearId: string
    yearCode: string
    source: AssessmentDemandSource
    taxConfigId: string | null
    taxConfigVersion: number | null
    components: ReturnType<typeof componentsFromParts>
    openingArrears: string
    rebateAmount?: string
    rebatePolicyId?: string | null
    penaltyPolicyId?: string | null
    chargeBreakdown?: ChargeBreakdown | null
    idempotencyKey: string
    actorId: string
  }) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: input.surveyId },
      select: { surveyId: true },
    })
    return this.prisma.$transaction((tx) =>
      insertPublishedDemand({
        findPublished: () =>
          tx.assessmentDemand.findFirst({
            where: {
              surveyId: input.surveyId,
              assessmentYearId: input.assessmentYearId,
              status: "PUBLISHED",
            },
          }),
        create: () =>
          tx.assessmentDemand.create({
            data: {
              surveyId: input.surveyId,
              wardId: input.wardId,
              assessmentYearId: input.assessmentYearId,
              taxConfigId: input.taxConfigId,
              taxConfigVersion: input.taxConfigVersion,
              demandReference: this.demandReference(
                survey?.surveyId ?? input.surveyId,
                input.yearCode
              ),
              status: "PUBLISHED",
              source: input.source,
              propertyTax: input.components.propertyTax,
              waterTax: input.components.waterTax,
              drainageTax: input.components.drainageTax,
              penalty: input.components.penalty,
              interest: input.components.interest,
              currentYearDemand: input.components.currentYearDemand,
              openingArrears: input.openingArrears,
              rebateAmount: input.rebateAmount ?? "0.00",
              rebatePolicyId: input.rebatePolicyId ?? null,
              penaltyPolicyId: input.penaltyPolicyId ?? null,
              chargeBreakdown: input.chargeBreakdown
                ? (input.chargeBreakdown as unknown as Prisma.InputJsonValue)
                : Prisma.JsonNull,
              verificationStatus: "VERIFIED",
              idempotencyKey: input.idempotencyKey,
              publishedAt: new Date(),
              publishedById: input.actorId,
            },
          }),
      })
    )
  }

  private async loadBreakdown(
    surveyId: string,
    assessmentYearId: string,
    options?: { skipCalculated?: boolean }
  ) {
    const survey = await this.prisma.survey.findFirst({
      where: { id: surveyId, deletedAt: null, status: "ACTIVE" },
      select: {
        id: true,
        surveyId: true,
        wardId: true,
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
        propertyType: true,
        taxRateZone: true,
        roadType: true,
        hasMunicipalWaterSupply: true,
        plotAreaSqFt: true,
        plinthAreaSqFt: true,
        totalBuiltUpAreaSqFt: true,
        ward: { select: { id: true, number: true, name: true } },
        floors: {
          orderBy: { sortOrder: "asc" },
          select: {
            floorLabel: true,
            usageType: true,
            usageFactor: true,
            buildingType: true,
            areaSqFt: true,
          },
        },
      },
    })
    if (!survey) {
      throw new NotFoundException({
        code: "SURVEY_NOT_FOUND",
        message: "Property record was not found",
      })
    }
    const year = await this.prisma.referenceEntry.findUnique({
      where: { id: assessmentYearId },
      select: { id: true, code: true, name: true },
    })
    if (!year) {
      throw new NotFoundException({
        code: "ASSESSMENT_YEAR_NOT_FOUND",
        message: "Assessment year was not found",
      })
    }

    const [demandRows, paymentRows] = await Promise.all([
      this.prisma.assessmentDemand.findMany({
        where: { surveyId, status: "PUBLISHED" },
        include: {
          assessmentYear: { select: { id: true, code: true, name: true } },
          adjustments: true,
          allocations: {
            include: {
              payment: {
                select: {
                  id: true,
                  status: true,
                  amount: true,
                  assessmentYearId: true,
                  paymentReference: true,
                  receiptNumber: true,
                  gatewayReference: true,
                  remarks: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.findMany({
        where: { surveyId, ...SUCCESS_PAYMENT_WHERE },
        include: {
          assessmentYear: { select: { id: true, code: true, name: true } },
          allocations: {
            where: { status: PaymentAllocationStatus.ACTIVE },
            select: { amount: true },
          },
        },
      }),
    ])

    const demands = demandRows.map((row) => this.toLedgerDemand(row))
    const payments: SuccessPaymentFact[] = paymentRows.map((payment) => ({
      id: payment.id,
      amount: moneyString(payment.amount),
      allocatedAmount: moneyString(
        sumMoney(payment.allocations.map((row) => row.amount.toString()))
      ),
      assessmentYearId: payment.assessmentYearId,
      assessmentYearCode: payment.assessmentYear?.code ?? null,
      assessmentYearName: payment.assessmentYear?.name ?? null,
    }))

    const selected = demands.find(
      (demand) => demand.assessmentYearId === year.id
    )
    let calculated: {
      taxConfigId: string
      taxConfigVersion: number
      components: ReturnType<typeof componentsFromParts>
    } | null = null
    if (!selected && !options?.skipCalculated) {
      calculated = await this.calculateCurrent(survey, year.id)
    }

    const missingHistoryYears = await this.missingHistory(year.code, demands)
    const [rebatePolicies, penaltyPolicies] = await Promise.all([
      this.prisma.rebatePolicy.findMany({
        where: { assessmentYearId: year.id, status: "ACTIVE" },
        orderBy: { approvedAt: "desc" },
      }),
      this.prisma.penaltyPolicy.findMany({
        where: { assessmentYearId: year.id, status: "ACTIVE" },
        orderBy: { approvedAt: "desc" },
      }),
    ])
    const asOf = new Date()
    let penaltyPolicyId: string | null = null
    let rebatePolicyId: string | null = null
    let lockedRebate: { amount: string; scope: string } | null = null
    let chargeBreakdown: ChargeBreakdown | null = null

    // Published demands keep their stored rebate and penalty; rules apply only
    // to a demand that has not been published yet.
    const rebateRules: CategoryRebateRule[] = selected
      ? []
      : rebatePolicies.flatMap((policy) =>
          policyIsCurrent({
            status: policy.status,
            startsOn: policy.startsOn,
            endsOn: policy.endsOn,
            paymentDeadline: policy.paymentDeadline,
            asOf,
          })
            ? [rebateRuleFromPolicy(policy)]
            : []
        )
    const penaltyRules: CategoryPenaltyRule[] =
      selected || !calculated
        ? []
        : penaltyPolicies.flatMap((policy) => {
            const rule = penaltyRuleFromPolicy({ ...policy, asOf })
            return rule
              ? [{ ...rule, category: policy.taxCategory, policyId: policy.id }]
              : []
          })

    if (!selected && (rebateRules.length > 0 || penaltyRules.length > 0)) {
      const draft = calculateOutstanding({
        selectedYear: year,
        demands,
        payments,
        calculatedCurrent: calculated?.components ?? null,
        missingHistoryYears,
      })
      let charges: CategoryCharges
      try {
        charges = resolveCategoryCharges({
          asOf,
          propertyTax: calculated?.components.propertyTax ?? "0.00",
          waterTax: calculated?.components.waterTax ?? "0.00",
          drainageTax: calculated?.components.drainageTax ?? "0.00",
          interest: calculated?.components.interest ?? "0.00",
          taxConfigPenalty: calculated?.components.penalty ?? "0.00",
          previousArrears: draft.openingArrears,
          previousByCategory: {
            PROPERTY_TAX: draft.previousPropertyTaxOutstanding,
            WATER_TAX: draft.previousWaterTaxOutstanding,
            DRAINAGE_TAX: draft.previousDrainageTaxOutstanding,
          },
          rebateRules,
          penaltyRules,
        })
      } catch (error) {
        if (error instanceof PolicyConflictError) {
          throw new ConflictException({ code: error.code, message: error.message })
        }
        throw error
      }
      if (calculated && charges.penaltyPolicyApplied) {
        penaltyPolicyId = charges.penaltyPolicyIds[0] ?? null
        calculated = {
          ...calculated,
          components: componentsFromParts({
            propertyTax: calculated.components.propertyTax,
            waterTax: calculated.components.waterTax,
            drainageTax: calculated.components.drainageTax,
            penalty: charges.penalty,
            interest: calculated.components.interest,
          }),
        }
      }
      rebatePolicyId = charges.rebatePolicyIds[0] ?? null
      chargeBreakdown = charges.breakdown
      lockedRebate = {
        amount: charges.rebateAmount,
        scope: charges.rebateScope,
      }
    }

    const breakdown = calculateOutstanding({
      selectedYear: year,
      demands,
      payments,
      calculatedCurrent: calculated?.components ?? null,
      lockedRebate,
      missingHistoryYears,
    })
    return {
      survey,
      year,
      breakdown,
      calculated,
      rebatePolicyId,
      penaltyPolicyId,
      chargeBreakdown,
    }
  }

  private async calculateCurrent(
    survey: {
      id: string
      surveyId: string
      wardId: string
      ownerName: string | null
      ownerFatherName: string | null
      mobile: string | null
      propertyNo: string | null
      parcelNo: string | null
      houseNo: string | null
      streetName: string | null
      locality: string | null
      colony: string | null
      city: string | null
      pincode: string | null
      propertyUse: string | null
      propertyType: string | null
      taxRateZone: string | null
      roadType: string | null
      hasMunicipalWaterSupply: boolean | null
      plotAreaSqFt: Prisma.Decimal | null
      plinthAreaSqFt: Prisma.Decimal | null
      totalBuiltUpAreaSqFt: Prisma.Decimal | null
      ward: { id: string; number: number; name: string }
      floors: Array<{
        floorLabel: string
        usageType: string | null
        usageFactor: string | null
        buildingType: string | null
        areaSqFt: Prisma.Decimal | null
      }>
    },
    assessmentYearId: string
  ) {
    let config: Awaited<ReturnType<TaxConfigsService["getPublishedForWard"]>>
    try {
      config = await this.taxConfigs.getPublishedForWard(
        survey.wardId,
        assessmentYearId
      )
    } catch {
      throw new ConflictException({
        code: "TAX_CONFIG_NOT_PUBLISHED",
        message:
          "No published tax configuration for this ward and assessment year.",
      })
    }
    const dues = computePublicDuesPayload(
      {
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
        propertyType: survey.propertyType,
        taxRateZone: survey.taxRateZone,
        roadType: survey.roadType,
        hasMunicipalWaterSupply: survey.hasMunicipalWaterSupply,
        plotAreaSqFt: survey.plotAreaSqFt,
        plinthAreaSqFt: survey.plinthAreaSqFt,
        totalBuiltUpAreaSqFt: survey.totalBuiltUpAreaSqFt,
        ward: { number: survey.ward.number, name: survey.ward.name },
        floors: survey.floors,
      },
      {
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
        cells: config.cells.map((cell) => ({
          roadWidthEntry: { code: cell.roadWidthEntry.code },
          constructionEntry: { code: cell.constructionEntry.code },
          annualRatePerSqFt: cell.annualRatePerSqFt,
        })),
        updatedAt: config.updatedAt,
      }
    )
    return {
      taxConfigId: config.id,
      taxConfigVersion: config.version,
      components: componentsFromParts({
        propertyTax: moneyString(dues.tax.propertyTax),
        waterTax: moneyString(dues.tax.waterTax),
        drainageTax: moneyString(dues.tax.drainageTax),
        penalty: moneyString(dues.tax.penalty),
        interest: "0.00",
      }),
    }
  }

  private toLedgerDemand(row: DemandWithLedger): LedgerDemand {
    const credits = sumMoney(
      row.adjustments
        .filter((item) => item.kind === DemandAdjustmentKind.CREDIT)
        .map((item) => item.amount.toString())
    )
    const debits = sumMoney(
      row.adjustments
        .filter((item) => item.kind === DemandAdjustmentKind.DEBIT)
        .map((item) => item.amount.toString())
    )
    const payments = countedPayments({
      historicalPayments: row.historicalPayments.toString(),
      sourceReference: row.sourceReference,
      allocations: row.allocations.map((allocation) => ({
        amount: allocation.amount.toString(),
        status: allocation.status,
        paymentStatus: allocation.payment.status,
        paymentReference: allocation.payment.paymentReference,
        receiptNumber: allocation.payment.receiptNumber,
        gatewayReference: allocation.payment.gatewayReference,
        remarks: allocation.payment.remarks,
      })),
    })
    return {
      id: row.id,
      assessmentYearId: row.assessmentYearId,
      assessmentYearCode: row.assessmentYear.code,
      assessmentYearName: row.assessmentYear.name,
      propertyTax: moneyString(row.propertyTax),
      waterTax: moneyString(row.waterTax),
      drainageTax: moneyString(row.drainageTax),
      penalty: moneyString(row.penalty),
      interest: moneyString(row.interest),
      currentYearDemand: moneyString(row.currentYearDemand),
      credits: moneyString(credits),
      debits: moneyString(debits),
      payments,
      rebate: moneyString(row.rebateAmount),
      verificationStatus: row.verificationStatus,
      balanceKind: row.balanceKind,
    }
  }

  async lockedCollectableYears(
    tx: Prisma.TransactionClient,
    surveyId: string,
    selectedYearCode: string
  ): Promise<
    Array<{
      assessmentDemandId: string
      assessmentYearId: string
      assessmentYearCode: string
      unpaid: string
    }>
  > {
    const rows = await tx.assessmentDemand.findMany({
      where: {
        surveyId,
        status: "PUBLISHED",
        verificationStatus: "VERIFIED",
      },
      select: {
        id: true,
        assessmentYear: { select: { id: true, code: true } },
      },
    })
    const eligible = rows.filter(
      (row) => row.assessmentYear.code.localeCompare(selectedYearCode) <= 0
    )
    if (eligible.length > 0) {
      const ids = eligible.map((row) => row.id)
      await tx.$queryRaw`SELECT id FROM assessment_demand WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`
    }
    const unpaid = []
    for (const row of eligible) {
      const balance = await this.demandUnpaid(tx, row.id)
      unpaid.push({
        assessmentDemandId: row.id,
        assessmentYearId: row.assessmentYear.id,
        assessmentYearCode: row.assessmentYear.code,
        unpaid: balance.outstanding,
      })
    }
    unpaid.sort((a, b) =>
      a.assessmentYearCode.localeCompare(b.assessmentYearCode)
    )
    return unpaid
  }

  private async demandUnpaid(
    tx: Prisma.TransactionClient,
    demandId: string
  ): Promise<{
    outstanding: string
    surveyId: string
    assessmentYearId: string
  }> {
    const demand = await tx.assessmentDemand.findFirst({
      where: { id: demandId, status: "PUBLISHED" },
      include: {
        adjustments: true,
        allocations: {
          include: {
            payment: {
              select: {
                status: true,
                paymentReference: true,
                receiptNumber: true,
                gatewayReference: true,
                remarks: true,
              },
            },
          },
        },
      },
    })
    if (!demand) {
      throw new NotFoundException({
        code: "DEMAND_NOT_FOUND",
        message: "Published demand was not found",
      })
    }
    const credits = sumMoney(
      demand.adjustments
        .filter((item) => item.kind === "CREDIT")
        .map((item) => item.amount.toString())
    )
    const debits = sumMoney(
      demand.adjustments
        .filter((item) => item.kind === "DEBIT")
        .map((item) => item.amount.toString())
    )
    const payments = countedPayments({
      historicalPayments: demand.historicalPayments.toString(),
      sourceReference: demand.sourceReference,
      allocations: demand.allocations.map((allocation) => ({
        amount: allocation.amount.toString(),
        status: allocation.status,
        paymentStatus: allocation.payment.status,
        paymentReference: allocation.payment.paymentReference,
        receiptNumber: allocation.payment.receiptNumber,
        gatewayReference: allocation.payment.gatewayReference,
        remarks: allocation.payment.remarks,
      })),
    })
    return {
      outstanding: ownOutstanding({
        currentYearDemand: moneyString(demand.currentYearDemand),
        interest: moneyString(demand.interest),
        credits: moneyString(credits),
        debits: moneyString(debits),
        payments: moneyString(payments),
        rebate: moneyString(demand.rebateAmount),
      }),
      surveyId: demand.surveyId,
      assessmentYearId: demand.assessmentYearId,
    }
  }

  private async assertAllocationFits(
    tx: Prisma.TransactionClient,
    input: {
      paymentId: string
      demandId: string
      surveyId: string
      assessmentYearId: string
      amount: string
      demandUnpaid: string
      actorId: string
    }
  ) {
    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
    })
    if (!payment || payment.surveyId !== input.surveyId) {
      throw new BadRequestException({
        code: "PAYMENT_NOT_FOUND",
        message: "Payment was not found for this property",
      })
    }
    this.assertPaymentAllocatable(payment.status)
    if (
      payment.assessmentYearId &&
      payment.assessmentYearId !== input.assessmentYearId
    ) {
      throw new BadRequestException({
        code: "ALLOCATION_YEAR_MISMATCH",
        message:
          "This payment is tagged to a different assessment year and cannot be allocated here",
      })
    }
    const existing = await tx.paymentAllocation.findMany({
      where: {
        paymentId: input.paymentId,
        status: PaymentAllocationStatus.ACTIVE,
      },
    })
    const already = sumMoney(existing.map((row) => row.amount.toString()))
    if (exceedsMoney(money(already).plus(input.amount), payment.amount)) {
      throw new BadRequestException({
        code: "ALLOCATION_EXCEEDS_PAYMENT",
        message: "Allocations exceed the payment amount",
      })
    }
    if (exceedsMoney(input.amount, input.demandUnpaid)) {
      throw new BadRequestException({
        code: "ALLOCATION_EXCEEDS_UNPAID",
        message: "Allocated amount exceeds the unpaid balance of the demand",
      })
    }
    if (!isPositiveMoney(input.amount) && !isZeroMoney(input.amount)) {
      throw new BadRequestException({
        code: "ALLOCATION_AMOUNT_REQUIRED",
        message: "Allocation amount must be greater than zero",
      })
    }
    if (isZeroMoney(input.amount)) return
    await tx.paymentAllocation.create({
      data: {
        paymentId: input.paymentId,
        assessmentDemandId: input.demandId,
        amount: input.amount,
        status: PaymentAllocationStatus.ACTIVE,
        createdById: input.actorId,
      },
    })
  }

  private assertPaymentAllocatable(status: PaymentStatus) {
    if (status !== PaymentStatus.SUCCESS) {
      throw new ConflictException({
        code: "PAYMENT_NOT_ALLOCATABLE",
        message:
          "Only a successful payment can be allocated. Pending, failed, cancelled, and reversed payments do not reduce outstanding balances.",
      })
    }
  }

  private findPublished(surveyId: string, assessmentYearId: string) {
    return this.prisma.assessmentDemand.findFirst({
      where: { surveyId, assessmentYearId, status: "PUBLISHED" },
    })
  }

  private toDemandDto(row: {
    id: string
    demandReference: string
    status: string
    source: string
    propertyTax: Prisma.Decimal
    waterTax: Prisma.Decimal
    drainageTax: Prisma.Decimal
    penalty: Prisma.Decimal
    interest: Prisma.Decimal
    currentYearDemand: Prisma.Decimal
    openingArrears: Prisma.Decimal
    rebateAmount: Prisma.Decimal
    taxConfigId: string | null
    taxConfigVersion: number | null
    publishedAt: Date | null
  }) {
    return {
      id: row.id,
      demandReference: row.demandReference,
      status: row.status,
      source: row.source,
      propertyTax: moneyString(row.propertyTax),
      waterTax: moneyString(row.waterTax),
      drainageTax: moneyString(row.drainageTax),
      penalty: moneyString(row.penalty),
      interest: moneyString(row.interest),
      currentYearDemand: moneyString(row.currentYearDemand),
      openingArrears: moneyString(row.openingArrears),
      rebateAmount: moneyString(row.rebateAmount),
      taxConfigId: row.taxConfigId,
      taxConfigVersion: row.taxConfigVersion,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    }
  }

  async verifyOpening(demandId: string, actorId: string) {
    const demand = await this.prisma.assessmentDemand.findFirst({
      where: { id: demandId, status: "PUBLISHED" },
    })
    if (!demand) {
      throw new NotFoundException({
        code: "DEMAND_NOT_FOUND",
        message: "Published demand was not found",
      })
    }
    if (demand.verificationStatus === "VERIFIED") {
      return this.toDemandDto(demand)
    }
    const updated = await this.prisma.assessmentDemand.update({
      where: { id: demand.id },
      data: {
        verificationStatus: "VERIFIED",
        verifiedById: actorId,
        verifiedAt: new Date(),
      },
    })
    await this.audit.log({
      action: "DEMAND_VERIFIED",
      entity: "AssessmentDemand",
      entityId: demand.id,
      actorId,
      oldValue: { verificationStatus: demand.verificationStatus },
      newValue: { verificationStatus: "VERIFIED" },
    })
    return this.toDemandDto(updated)
  }

  async openingBalanceTemplate() {
    return historicalTemplateBuffer()
  }

  async importOpeningBalances(
    input: {
      dryRun: boolean
      rows: HistoricalImportRowDto[]
      file?: Buffer
      sourceFile?: string
    },
    actorId: string
  ) {
    const headers = input.file ? await workbookHeaders(input.file) : []
    const parsed = input.file
      ? await rowsFromWorkbook(input.file)
      : (input.rows ?? []).map((row) => normalizeHistoricalRow(row))
    const errors: Array<{ row: number; message: string }> = []
    const seen = new Set<string>()
    const ready: Array<{
      row: ReturnType<typeof normalizeHistoricalRow>
      surveyId: string
      wardId: string
      businessId: string
      assessmentYearId: string
      yearCode: string
    }> = []

    for (const [index, raw] of parsed.entries()) {
      const row = normalizeHistoricalRow(raw)
      const problem = historicalRowError(row)
      if (problem) {
        errors.push({ row: index + 1, message: problem })
        continue
      }
      const key = `${row.propertyId}|${row.assessmentYear}`
      if (seen.has(key)) {
        errors.push({
          row: index + 1,
          message: "Duplicate property and assessment year in this import",
        })
        continue
      }
      seen.add(key)
      const survey = await this.prisma.survey.findFirst({
        where: { surveyId: row.propertyId, deletedAt: null, status: "ACTIVE" },
        select: { id: true, surveyId: true, wardId: true },
      })
      if (!survey) {
        errors.push({ row: index + 1, message: "Property was not found" })
        continue
      }
      const year = await this.prisma.referenceEntry.findFirst({
        where: {
          category: { code: "ASSESSMENT_YEAR" },
          OR: [{ code: row.assessmentYear }, { name: row.assessmentYear }],
        },
        select: { id: true, code: true },
      })
      if (!year) {
        errors.push({ row: index + 1, message: "Assessment year was not found" })
        continue
      }
      const profile = await this.prisma.assessmentYearProfile.findUnique({
        where: { referenceEntryId: year.id },
      })
      if (profile && (profile.status === "CLOSED" || profile.status === "ARCHIVED")) {
        errors.push({
          row: index + 1,
          message: "Assessment year is closed or archived",
        })
        continue
      }
      const existing = await this.findPublished(survey.id, year.id)
      if (existing) {
        errors.push({
          row: index + 1,
          message: "A published record already exists and was not overwritten",
        })
        continue
      }
      ready.push({
        row,
        surveyId: survey.id,
        wardId: survey.wardId,
        businessId: survey.surveyId,
        assessmentYearId: year.id,
        yearCode: year.code,
      })
    }

    const preview = ready.slice(0, 100).map((item) => ({
      propertyId: item.row.propertyId,
      assessmentYear: item.row.assessmentYear,
      balanceKind: item.row.balanceKind,
      propertyTax: item.row.propertyTax,
      verifiedClosing: item.row.verifiedClosing,
      paymentsReceived: item.row.paymentsReceived,
      sourceReference: item.row.sourceReference || input.sourceFile || "",
      remarks: item.row.remarks,
    }))
    if (input.dryRun || errors.length > 0) {
      return {
        dryRun: input.dryRun,
        total: parsed.length,
        valid: ready.length,
        failed: errors.length,
        inserted: 0,
        headers,
        preview,
        errors,
      }
    }

    const inserted = await this.prisma.$transaction(async (tx) => {
      let count = 0
      for (const item of ready) {
        const closingOnly = item.row.balanceKind === "CLOSING_ONLY"
        const propertyTax = closingOnly
          ? item.row.verifiedClosing || item.row.propertyTax
          : item.row.propertyTax
        const components = componentsFromParts({
          propertyTax,
          waterTax: closingOnly ? "0" : item.row.waterTax,
          drainageTax: closingOnly ? "0" : item.row.drainageTax,
          penalty: closingOnly ? "0" : item.row.penalty,
          interest: closingOnly ? "0" : item.row.interest,
        })
        const created = await insertPublishedDemand({
          findPublished: () =>
            tx.assessmentDemand.findFirst({
              where: {
                surveyId: item.surveyId,
                assessmentYearId: item.assessmentYearId,
                status: "PUBLISHED",
              },
            }),
          create: () =>
            tx.assessmentDemand.create({
              data: {
                surveyId: item.surveyId,
                wardId: item.wardId,
                assessmentYearId: item.assessmentYearId,
                demandReference: this.demandReference(item.businessId, item.yearCode),
                status: "PUBLISHED",
                source: AssessmentDemandSource.OPENING_BALANCE,
                propertyTax: components.propertyTax,
                waterTax: components.waterTax,
                drainageTax: components.drainageTax,
                penalty: components.penalty,
                interest: components.interest,
                currentYearDemand: components.currentYearDemand,
                openingArrears: "0.00",
                historicalPayments: closingOnly ? "0.00" : item.row.paymentsReceived,
                verificationStatus: "UNVERIFIED",
                balanceKind: item.row.balanceKind,
                sourceReference: item.row.sourceReference || input.sourceFile || null,
                remarks:
                  item.row.remarks ||
                  (closingOnly ? "Historical opening balance" : null),
                idempotencyKey: `demand:IMPORT:${item.surveyId}:${item.assessmentYearId}`,
                publishedAt: new Date(),
                publishedById: actorId,
              },
            }),
        })
        if (!created.created) {
          throw new ConflictException({
            code: "DUPLICATE_DEMAND",
            message: "A published record already exists and was not overwritten",
          })
        }
        if (!closingOnly && money(item.row.creditAmount).gt(0)) {
          await tx.demandAdjustment.create({
            data: {
              assessmentDemandId: created.row.id,
              kind: DemandAdjustmentKind.CREDIT,
              amount: item.row.creditAmount,
              reason: item.row.creditReason,
              createdById: actorId,
            },
          })
        }
        count += 1
      }
      return count
    })

    await this.audit.log({
      action: "DEMAND_HISTORY_IMPORTED",
      entity: "AssessmentDemand",
      actorId,
      newValue: { inserted, total: parsed.length },
    })
    return {
      dryRun: false,
      total: parsed.length,
      valid: ready.length,
      failed: 0,
      inserted,
      headers,
      preview,
      errors: [],
    }
  }

  private async missingHistory(
    selectedCode: string,
    demands: LedgerDemand[]
  ): Promise<UnreconciledYear[]> {
    const entries = await this.prisma.referenceEntry.findMany({
      where: {
        status: "ACTIVE",
        category: { code: "ASSESSMENT_YEAR" },
      },
      include: { yearProfile: true },
    })
    const missing: UnreconciledYear[] = []
    for (const entry of entries) {
      if (entry.code.localeCompare(selectedCode) >= 0) continue
      if (!entry.yearProfile || entry.yearProfile.status === "ARCHIVED") continue
      const verified = demands.some(
        (demand) =>
          demand.assessmentYearId === entry.id &&
          (demand.verificationStatus ?? "VERIFIED") === "VERIFIED"
      )
      if (verified) continue
      missing.push({
        assessmentYearId: entry.id,
        code: entry.code,
        name: entry.name,
        reason: "No verified published balance for this earlier assessment year",
      })
    }
    return missing
  }

  private async assertYearWritable(assessmentYearId: string) {
    const profile = await this.prisma.assessmentYearProfile.findUnique({
      where: { referenceEntryId: assessmentYearId },
    })
    if (!profile) return
    if (profile.status === "CLOSED" || profile.status === "ARCHIVED") {
      throw new ConflictException({
        code: "ASSESSMENT_YEAR_LOCKED",
        message:
          "This assessment year is closed or archived. New demands and historical entries are not accepted.",
      })
    }
  }

  private demandReference(surveyId: string, yearCode: string) {
    const stamp = Date.now().toString(36)
    const nonce = Math.random().toString(36).slice(2, 8)
    return `DM-${yearCode}-${surveyId}-${stamp}${nonce}`.slice(0, 180)
  }
}
