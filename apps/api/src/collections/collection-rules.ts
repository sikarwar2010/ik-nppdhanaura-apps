import {
  exceedsMoney,
  isPositiveMoney,
  minMoney,
  money,
  moneyString,
  subMoney,
  sumMoney,
} from "../demands/money"
import { ownOutstanding } from "../demands/outstanding"

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
