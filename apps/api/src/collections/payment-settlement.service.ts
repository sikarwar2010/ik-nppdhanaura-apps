import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common"
import { PaymentStatus, Prisma } from "@prisma/client"

import { MUNICIPALITY } from "../common/municipality"
import { DemandsService } from "../demands/demands.service"
import { money, moneyString, sumMoney } from "../demands/money"
import { bucketTotal, type TaxPlan } from "../demands/tax-ledger"
import { maskMobile } from "../public-property-tax/masking.util"
import { enqueuePublicSync } from "../public-ward-stats/public-sync-outbox"
import {
  allocateTaxPlan,
  allocationSummary,
  CollectionRuleError,
  formatReceiptNumber,
  legacyTaxPlan,
  type AllocationLine,
  type CollectableYear,
} from "./collection-rules"
import type { ReceiptAllocation, ReceiptSnapshot } from "./receipt-html"
import { rupeesInWords } from "./rupees-in-words"

export function propertyAddress(survey: {
  houseNo: string | null
  streetName: string | null
  locality: string | null
  colony: string | null
  city: string | null
  pincode: string | null
}): string {
  const parts = [
    survey.houseNo,
    survey.streetName,
    survey.locality,
    survey.colony,
    survey.city,
    survey.pincode,
  ].filter((part) => part && part.trim())
  return parts.join(", ") || "—"
}

export function toReceiptAllocation(line: AllocationLine): ReceiptAllocation {
  return {
    assessmentYearCode: line.assessmentYearCode,
    assessmentYearName: line.assessmentYearName,
    closingBalanceOnly: line.closingBalanceOnly,
    amount: line.amount,
    outstandingAfter: line.outstandingAfter,
    parts: {
      propertyTax: line.parts.propertyTax,
      waterTax: line.parts.waterTax,
      drainageTax: line.parts.drainageTax,
      penalty: line.parts.penalty,
      interest: line.parts.interest,
    },
  }
}

/** Reads a stored plan; anything unexpected is treated as no plan. */
export function asTaxPlan(value: Prisma.JsonValue | null | undefined): TaxPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const row = value as { kind?: unknown; parts?: unknown }
  if (typeof row.kind !== "string" || !row.parts || typeof row.parts !== "object") return null
  return row as unknown as TaxPlan
}

/**
 * Posting a payment to the ledger. The one place that writes allocations and
 * receipts, used by counter collection, cheque confirmation and the online
 * gateway, always inside the caller's transaction.
 */
@Injectable()
export class PaymentSettlementService {
  constructor(private readonly demands: DemandsService) {}

  async settle(
    tx: Prisma.TransactionClient,
    paymentId: string,
    input: {
      actor: { id: string; name: string } | null
      yearCode: string
      /** Offline refuses an amount that does not fit. A gateway has already taken the money. */
      strict: boolean
    }
  ) {
    // Serialises concurrent callbacks for the same payment.
    await tx.$queryRaw`SELECT id FROM payment WHERE id = ${paymentId} FOR UPDATE`
    const payment = await tx.payment.findUnique({ where: { id: paymentId } })
    if (!payment?.surveyId || !payment.assessmentYearId) {
      throw new ConflictException({
        code: "PAYMENT_PROPERTY_REQUIRED",
        message: "Payment is not linked to a property and assessment year",
      })
    }
    // A stored receipt means this payment was already posted. Repeat calls add nothing.
    if (payment.receiptSnapshot) return payment

    const collector =
      payment.collectedById && payment.collectedById !== input.actor?.id
        ? await tx.user.findUnique({
            where: { id: payment.collectedById },
            select: { id: true, name: true },
          })
        : input.actor
    const survey = await tx.survey.findUnique({
      where: { id: payment.surveyId },
      include: { ward: true },
    })
    const demand = await tx.assessmentDemand.findFirst({
      where: {
        surveyId: payment.surveyId,
        assessmentYearId: payment.assessmentYearId,
        status: "PUBLISHED",
      },
    })
    if (!survey || !demand) {
      throw new ConflictException({
        code: "DEMAND_NOT_READY",
        message: "Published demand was not found",
      })
    }
    const years = await this.demands.lockedCollectableYears(
      tx,
      payment.surveyId,
      input.yearCode
    )
    const allocation = this.allocate(payment, years, input.strict)
    const lines = allocation.lines
    for (const line of lines) {
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          assessmentDemandId: line.assessmentDemandId,
          amount: line.amount,
          propertyTaxAmount: line.buckets.propertyTax,
          waterTaxAmount: line.buckets.waterTax,
          drainageTaxAmount: line.buckets.drainageTax,
          chargesAmount: line.buckets.charges,
          historicalAmount: line.buckets.historical,
          createdById: input.actor?.id ?? null,
        },
      })
    }
    const previousDues = sumMoney(
      years
        .filter((year) => year.assessmentYearCode.localeCompare(input.yearCode) < 0)
        .map((year) => year.unpaid)
    )
    const online = payment.paymentMode === "ONLINE"
    const receiptNumber =
      payment.receiptNumber ?? (await this.nextReceiptNumber(tx, input.yearCode))
    const snapshot: ReceiptSnapshot = {
      municipality: MUNICIPALITY.nameEn,
      receiptNumber,
      receiptAt: new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(payment.collectionDate ?? new Date()),
      propertyId: survey.surveyId,
      ownerName: survey.ownerName ?? "—",
      address: propertyAddress(survey),
      ward: survey.ward.name,
      assessmentYear: input.yearCode,
      demandReference: demand.demandReference,
      propertyTax: moneyString(demand.propertyTax),
      waterTax: moneyString(demand.waterTax),
      drainageTax: moneyString(demand.drainageTax),
      previousDues: moneyString(previousDues),
      rebate: moneyString(demand.rebateAmount),
      penalty: moneyString(demand.penalty),
      interest: moneyString(demand.interest),
      totalPayable: allocation.outstandingBefore,
      amountReceived: moneyString(payment.amount),
      paymentMode: payment.paymentMode,
      remaining: allocation.outstandingAfter,
      amountInWords: rupeesInWords(moneyString(payment.amount)),
      cashierName: online ? "Online payment" : (collector?.name ?? "—"),
      counterCode: payment.counterCode ?? "",
      allocationText: allocationSummary(lines),
      fatherName: survey.ownerFatherName ?? undefined,
      wardNumber: String(survey.ward.number),
      houseNo: survey.houseNo ?? undefined,
      locality: survey.locality ?? survey.colony ?? undefined,
      mobileMasked: survey.mobile ? maskMobile(survey.mobile) : undefined,
      paymentReference:
        payment.chequeDdReference ?? payment.gatewayReference ?? undefined,
      paymentId: payment.id,
      collectorId: online ? undefined : (collector?.id ?? undefined),
      confirmedBy:
        collector && input.actor && collector.id !== input.actor.id
          ? input.actor.name
          : undefined,
      allocations: lines.map(toReceiptAllocation),
      taxKind: allocation.kind,
      taxSummary: allocation.taxSummary,
      unallocated: allocation.unallocated === "0.00" ? undefined : allocation.unallocated,
    }
    await enqueuePublicSync(tx, {
      eventType: "PAYMENT_POSTED",
      paymentId: payment.id,
      wardId: payment.wardId,
    })
    return tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        receiptNumber,
        receiptSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        refundableAmount: payment.amount,
      },
    })
  }

  private allocate(
    payment: { amount: Prisma.Decimal; taxPlan: Prisma.JsonValue | null },
    years: CollectableYear[],
    strict: boolean
  ) {
    const amount = moneyString(payment.amount)
    try {
      const stored = asTaxPlan(payment.taxPlan)
      if (stored && bucketTotal(stored.parts) !== amount) {
        throw new CollectionRuleError(
          "TAX_SPLIT_MISMATCH",
          "The stored tax amounts do not add up to the payment."
        )
      }
      const plan = stored ?? legacyTaxPlan(amount, years)
      const allocation = allocateTaxPlan(plan, years, { strict })
      if (stored) return allocation
      // A legacy plan stops at what is owed; anything above that is not allocated.
      const excess = money(amount).minus(bucketTotal(plan.parts))
      if (!excess.gt(0)) return allocation
      if (strict) {
        throw new CollectionRuleError(
          "OVERPAYMENT",
          "Allocated amount cannot be above the outstanding balance"
        )
      }
      return { ...allocation, unallocated: moneyString(money(allocation.unallocated).plus(excess)) }
    } catch (error) {
      if (error instanceof CollectionRuleError) {
        if (!strict) {
          // Gateway money with no usable plan stays unallocated and is flagged.
          return {
            kind: "COMBINED" as const,
            lines: [],
            taxSummary: [],
            outstandingBefore: moneyString(sumMoney(years.map((year) => year.unpaid))),
            outstandingAfter: moneyString(sumMoney(years.map((year) => year.unpaid))),
            unallocated: amount,
          }
        }
        throw new BadRequestException({ code: error.code, message: error.message })
      }
      throw error
    }
  }

  private async nextReceiptNumber(
    tx: Prisma.TransactionClient,
    yearCode: string
  ): Promise<string> {
    const rows = await tx.$queryRaw<Array<{ lastValue: number }>>`
      INSERT INTO receipt_sequence ("yearCode", "lastValue")
      VALUES (${yearCode}, 1)
      ON CONFLICT ("yearCode")
      DO UPDATE SET "lastValue" = receipt_sequence."lastValue" + 1
      RETURNING "lastValue"
    `
    const value = Number(rows[0]?.lastValue ?? 0)
    if (!value) {
      throw new ConflictException({
        code: "RECEIPT_NUMBER_FAILED",
        message: "Receipt number could not be issued",
      })
    }
    return formatReceiptNumber(yearCode, value)
  }
}
