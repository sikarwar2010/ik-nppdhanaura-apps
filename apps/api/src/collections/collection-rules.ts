import {
  exceedsMoney,
  isPositiveMoney,
  minMoney,
  money,
  moneyString,
  subMoney,
  sumMoney,
} from "../demands/money"
import {
  ownOutstanding,
  splitPaymentByComponent,
  type ComponentAmounts,
  type YearComponentsInput,
} from "../demands/outstanding"

export type YearUnpaid = {
  assessmentDemandId: string
  assessmentYearCode: string
  unpaid: string
}

export class CollectionRuleError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message)
  }
}

/** Oldest verified year first. Rejects amounts above the locked unpaid total. */
export function allocateOldestFirst(
  amount: string,
  years: YearUnpaid[]
): Array<{ assessmentDemandId: string; assessmentYearCode: string; amount: string }> {
  if (!isPositiveMoney(amount)) {
    throw new CollectionRuleError(
      "AMOUNT_REQUIRED",
      "Collection amount must be greater than zero"
    )
  }
  const ordered = [...years].sort((a, b) =>
    a.assessmentYearCode.localeCompare(b.assessmentYearCode)
  )
  const available = sumMoney(ordered.map((year) => year.unpaid))
  if (exceedsMoney(amount, available)) {
    throw new CollectionRuleError(
      "OVERPAYMENT",
      "Amount is above the outstanding balance. No advance credit is configured."
    )
  }
  let remaining = money(amount)
  const lines: Array<{
    assessmentDemandId: string
    assessmentYearCode: string
    amount: string
  }> = []
  for (const year of ordered) {
    if (!remaining.gt(0)) break
    if (!isPositiveMoney(year.unpaid)) continue
    const slice = minMoney(remaining, year.unpaid)
    lines.push({
      assessmentDemandId: year.assessmentDemandId,
      assessmentYearCode: year.assessmentYearCode,
      amount: moneyString(slice),
    })
    remaining = money(remaining.minus(slice))
  }
  if (remaining.gt(0)) {
    throw new CollectionRuleError(
      "OVERPAYMENT",
      "Amount is above the outstanding balance. No advance credit is configured."
    )
  }
  return lines
}

export type CollectableYear = YearUnpaid & {
  assessmentYearName?: string
  demandReference?: string
  components: YearComponentsInput
  appliedBefore: string
  balanceKind?: "COMPONENTS" | "CLOSING_ONLY"
}

export type AllocationLine = {
  assessmentDemandId: string
  assessmentYearCode: string
  assessmentYearName: string
  demandReference: string | null
  /** True for a verified historical closing balance (no tax-wise detail). */
  closingBalanceOnly: boolean
  outstandingBefore: string
  amount: string
  outstandingAfter: string
  parts: ComponentAmounts
}

/**
 * Oldest year first, then within each year in COMPONENT_ORDER. This is the
 * single allocation used for the preview, the posted payment, the receipt and
 * the ledger, so the split shown before saving is the split that is saved.
 */
export function allocateWithComponents(
  amount: string,
  years: CollectableYear[]
): { lines: AllocationLine[]; outstandingBefore: string; outstandingAfter: string } {
  const base = allocateOldestFirst(amount, years)
  const byId = new Map(years.map((year) => [year.assessmentDemandId, year]))
  const lines: AllocationLine[] = base.map((line) => {
    const year = byId.get(line.assessmentDemandId)!
    const split = splitPaymentByComponent(year.components, year.appliedBefore, line.amount)
    if (money(split.unapplied).gt(0)) {
      throw new CollectionRuleError(
        "ALLOCATION_MISMATCH",
        `The tax-wise balance for ${year.assessmentYearCode} does not match its outstanding amount. Reconcile this year before collecting.`
      )
    }
    return {
      assessmentDemandId: line.assessmentDemandId,
      assessmentYearCode: line.assessmentYearCode,
      assessmentYearName: year.assessmentYearName ?? line.assessmentYearCode,
      demandReference: year.demandReference ?? null,
      closingBalanceOnly: year.balanceKind === "CLOSING_ONLY",
      outstandingBefore: moneyString(year.unpaid),
      amount: line.amount,
      outstandingAfter: moneyString(subMoney(year.unpaid, line.amount)),
      parts: split.parts,
    }
  })
  const outstandingBefore = sumMoney(years.map((year) => year.unpaid))
  return {
    lines,
    outstandingBefore: moneyString(outstandingBefore),
    outstandingAfter: moneyString(subMoney(outstandingBefore, amount)),
  }
}

/** Short text kept on older receipts; new receipts also carry the full lines. */
export function allocationSummary(lines: AllocationLine[]): string {
  return lines.map((line) => `${line.assessmentYearCode} ₹ ${line.amount}`).join("; ")
}

export function settlesImmediately(mode: string): boolean {
  return mode === "CASH" || mode === "UPI_MANUAL"
}

export function idempotencyDecision(
  existing: { amount: string; surveyId: string | null } | null,
  next: { amount: string; surveyId: string }
): "create" | "replay" | "conflict" {
  if (!existing) return "create"
  if (
    existing.surveyId === next.surveyId &&
    money(existing.amount).eq(money(next.amount))
  ) {
    return "replay"
  }
  return "conflict"
}

/** Reprint returns the stored receipt. It does not open a new payment. */
export function replayedReceipt(existing: { receiptNumber: string | null }): {
  created: false
  receiptNumber: string | null
} {
  return { created: false, receiptNumber: existing.receiptNumber }
}

export function formatReceiptNumber(yearCode: string, value: number): string {
  const safe = yearCode.replace(/[^A-Za-z0-9]+/g, "") || "YEAR"
  return `RCP-${safe}-${String(value).padStart(6, "0")}`
}

export type YearPositionInput = {
  yearCode: string
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
  currentYearDemand: string
  rebate: string
  credits: string
  debits: string
  payments: string
}

export function propertyPosition(
  selectedYearCode: string,
  years: YearPositionInput[]
): {
  currentYearDemand: string
  previousArrears: string
  rebate: string
  penalty: string
  interest: string
  payable: string
  collected: string
  outstanding: string
  status: "UNPAID" | "PARTIAL" | "PAID"
} {
  const own = (year: YearPositionInput) =>
    ownOutstanding({
      currentYearDemand: year.currentYearDemand,
      interest: year.interest,
      credits: year.credits,
      debits: year.debits,
      payments: year.payments,
      rebate: year.rebate,
    })
  const selected = years.find((year) => year.yearCode === selectedYearCode)
  const previousArrears = moneyString(
    sumMoney(
      years
        .filter((year) => year.yearCode.localeCompare(selectedYearCode) < 0)
        .map((year) => own(year))
    )
  )
  const currentYearDemand = selected?.currentYearDemand ?? "0.00"
  const rebate = selected?.rebate ?? "0.00"
  const penalty = selected?.penalty ?? "0.00"
  const interest = selected?.interest ?? "0.00"
  const collected = selected?.payments ?? "0.00"
  const currentBeforePayments = selected
    ? moneyString(
        subMoney(
          subMoney(
            sumMoney([
              selected.currentYearDemand,
              selected.interest,
              selected.debits,
            ]),
            selected.rebate
          ),
          selected.credits
        )
      )
    : "0.00"
  const payable = moneyString(sumMoney([previousArrears, currentBeforePayments]))
  const outstanding = moneyString(subMoney(payable, collected))
  return {
    currentYearDemand,
    previousArrears,
    rebate,
    penalty,
    interest,
    payable,
    collected,
    outstanding,
    status: money(outstanding).lte(0) ? "PAID" : isPositiveMoney(collected) ? "PARTIAL" : "UNPAID",
  }
}

function istDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date)
}

/**
 * When the money was received. A time typed at the counter is taken as IST;
 * without one, today records the current time and an earlier day noon IST.
 * Neither the day nor the time may be in the future.
 */
export function collectionInstant(
  day: string | undefined,
  time: string | undefined,
  now = new Date()
): Date {
  const today = istDay(now)
  const date = day || today
  if (date > today) {
    throw new CollectionRuleError("COLLECTION_DATE_IN_FUTURE", "Collection date cannot be in the future")
  }
  if (!time) return date === today ? now : new Date(`${date}T12:00:00+05:30`)
  const instant = new Date(`${date}T${time}:00+05:30`)
  // One minute of grace for clock drift between the counter PC and the server.
  if (instant.getTime() > now.getTime() + 60_000) {
    throw new CollectionRuleError("COLLECTION_TIME_IN_FUTURE", "Collection time cannot be in the future")
  }
  return instant
}
