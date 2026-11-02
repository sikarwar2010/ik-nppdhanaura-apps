import {
  exceedsMoney,
  isPositiveMoney,
  minMoney,
  money,
  moneyString,
  subMoney,
  sumMoney,
} from "../demands/money"
import { ownOutstanding, type ComponentAmounts } from "../demands/outstanding"
import {
  bucketsOf,
  bucketTotal,
  TAX_BUCKETS,
  taxPaymentStatus,
  zeroBuckets,
  BUCKET_LABELS,
  type BucketAmounts,
  type PartialBuckets,
  type TaxBucket,
  type TaxPaymentKind,
  type TaxPlan,
} from "../demands/tax-ledger"

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
  balances: BucketAmounts
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
  buckets: BucketAmounts
}

/** One tax on a payment: what was owed, what this payment paid, what is left. */
export type TaxSummaryLine = {
  bucket: TaxBucket
  label: string
  labelHi: string
  before: string
  paid: string
  after: string
  status: "PAID" | "PARTIALLY_PAID" | "UNPAID"
}

export type TaxAllocation = {
  kind: TaxPaymentKind
  lines: AllocationLine[]
  taxSummary: TaxSummaryLine[]
  outstandingBefore: string
  outstandingAfter: string
  /** Money that fitted nowhere. Only ever non-zero for a gateway payment, and flagged. */
  unallocated: string
}

function totalsByBucket(years: CollectableYear[]): BucketAmounts {
  const out = zeroBuckets()
  for (const year of years) {
    for (const key of TAX_BUCKETS) {
      const value = money(year.balances[key])
      if (value.gt(0)) out[key] = moneyString(money(out[key]).plus(value))
    }
  }
  return out
}

const KIND_BUCKET: Partial<Record<TaxPaymentKind, TaxBucket>> = {
  PROPERTY_TAX: "propertyTax",
  WATER_TAX: "waterTax",
}

/**
 * Turns what the clerk or citizen asked for into a checked plan. A partial
 * payment must say which tax it is for. Only a payment of the entire balance
 * may leave the split out, because then there is nothing to decide.
 */
export function resolveTaxPlan(
  input: {
    amount: string
    kind?: TaxPaymentKind | null
    parts?: PartialBuckets | null
  },
  years: CollectableYear[]
): TaxPlan {
  if (!isPositiveMoney(input.amount)) {
    throw new CollectionRuleError(
      "INVALID_ALLOCATION",
      "Amount must be greater than zero"
    )
  }
  const owed = totalsByBucket(years)
  if (!input.kind) {
    if (money(input.amount).eq(money(bucketTotal(owed)))) {
      return { kind: "COMBINED", parts: owed }
    }
    if (exceedsMoney(input.amount, bucketTotal(owed))) {
      throw new CollectionRuleError(
        "OVERPAYMENT",
        "Allocated amount cannot be above the outstanding balance"
      )
    }
    throw new CollectionRuleError(
      "TAX_SPLIT_REQUIRED",
      "Choose Property Tax, Water Tax or Combined, and say how much goes to each tax."
    )
  }
  const single = KIND_BUCKET[input.kind]
  const parts = single && !input.parts
    ? bucketsOf({ [single]: input.amount })
    : bucketsOf(input.parts)
  for (const key of TAX_BUCKETS) {
    if (money(parts[key]).lt(0)) {
      throw new CollectionRuleError("INVALID_ALLOCATION", "Tax amounts cannot be negative")
    }
    if (single && key !== single && money(parts[key]).gt(0)) {
      throw new CollectionRuleError(
        "TAX_KIND_MISMATCH",
        `A ${BUCKET_LABELS[single].en.toLowerCase()} payment cannot include ${BUCKET_LABELS[key].en.toLowerCase()}. Use a combined payment.`
      )
    }
  }
  if (!money(bucketTotal(parts)).eq(money(input.amount))) {
    throw new CollectionRuleError(
      "TAX_SPLIT_MISMATCH",
      "The tax amounts must add up exactly to the amount received."
    )
  }
  return { kind: input.kind, parts }
}

/**
 * For a payment accepted before tax-wise accounting (a pending cheque, or an
 * online payment in flight): it carries no choice of tax, so the rule in force
 * when it was accepted applies. Oldest year first, then charges, drainage, water,
 * property, earlier balance. Filling year by year gives each tax's oldest years
 * first, so allocateTaxPlan reproduces the same year-wise result.
 */
export function legacyTaxPlan(amount: string, years: CollectableYear[]): TaxPlan {
  const ordered = [...years].sort((a, b) =>
    a.assessmentYearCode.localeCompare(b.assessmentYearCode)
  )
  const parts = zeroBuckets()
  let left = money(amount)
  for (const year of ordered) {
    for (const key of ["charges", "drainageTax", "waterTax", "propertyTax", "historical"] as const) {
      const room = money(year.balances[key])
      if (!left.gt(0) || !room.gt(0)) continue
      const take = minMoney(left, room)
      parts[key] = moneyString(money(parts[key]).plus(take))
      left = money(left.minus(take))
    }
  }
  return { kind: "COMBINED", parts }
}

/**
 * Each tax is applied on its own, oldest year first. Nothing moves between
 * taxes: an amount above one tax's balance is refused (`strict`), or, for money
 * a gateway has already taken, left unallocated and flagged for reconciliation.
 */
export function allocateTaxPlan(
  plan: TaxPlan,
  years: CollectableYear[],
  options: { strict: boolean } = { strict: true }
): TaxAllocation {
  const ordered = [...years].sort((a, b) =>
    a.assessmentYearCode.localeCompare(b.assessmentYearCode)
  )
  const owed = totalsByBucket(ordered)
  const applied = new Map<string, BucketAmounts>()
  let unallocated = money(0)
  for (const key of TAX_BUCKETS) {
    let left = money(plan.parts[key])
    if (!left.gt(0)) continue
    for (const year of ordered) {
      const room = money(year.balances[key])
      if (!left.gt(0)) break
      if (!room.gt(0)) continue
      const take = minMoney(left, room)
      const row = applied.get(year.assessmentDemandId) ?? zeroBuckets()
      row[key] = moneyString(money(row[key]).plus(take))
      applied.set(year.assessmentDemandId, row)
      left = money(left.minus(take))
    }
    if (left.gt(0)) {
      if (options.strict) {
        throw new CollectionRuleError(
          "TAX_OVERPAYMENT",
          `${BUCKET_LABELS[key].en} of ₹${moneyString(plan.parts[key])} is above the outstanding ₹${owed[key]} for that tax. Amounts are not moved between taxes.`
        )
      }
      unallocated = money(unallocated.plus(left))
    }
  }
  const lines: AllocationLine[] = []
  for (const year of ordered) {
    const buckets = applied.get(year.assessmentDemandId)
    if (!buckets) continue
    const amount = bucketTotal(buckets)
    lines.push({
      assessmentDemandId: year.assessmentDemandId,
      assessmentYearCode: year.assessmentYearCode,
      assessmentYearName: year.assessmentYearName ?? year.assessmentYearCode,
      demandReference: year.demandReference ?? null,
      closingBalanceOnly: year.balanceKind === "CLOSING_ONLY",
      outstandingBefore: moneyString(year.unpaid),
      amount,
      outstandingAfter: moneyString(subMoney(year.unpaid, amount)),
      buckets,
      parts: {
        interest: buckets.charges,
        penalty: "0.00",
        drainageTax: buckets.drainageTax,
        waterTax: buckets.waterTax,
        propertyTax: moneyString(money(buckets.propertyTax).plus(buckets.historical)),
      },
    })
  }
  const paid = zeroBuckets()
  for (const line of lines) {
    for (const key of TAX_BUCKETS) {
      paid[key] = moneyString(money(paid[key]).plus(line.buckets[key]))
    }
  }
  const taxSummary: TaxSummaryLine[] = TAX_BUCKETS.filter(
    (key) => money(owed[key]).gt(0) || money(paid[key]).gt(0)
  ).map((key) => {
    const after = moneyString(subMoney(owed[key], paid[key]))
    return {
      bucket: key,
      label: BUCKET_LABELS[key].en,
      labelHi: BUCKET_LABELS[key].hi,
      before: owed[key],
      paid: paid[key],
      after,
      status: money(paid[key]).gt(0) || !money(owed[key]).gt(0)
        ? taxPaymentStatus(after)
        : "UNPAID",
    }
  })
  const outstandingBefore = sumMoney(ordered.map((year) => year.unpaid))
  return {
    kind: plan.kind,
    lines,
    taxSummary,
    outstandingBefore: moneyString(outstandingBefore),
    outstandingAfter: moneyString(subMoney(outstandingBefore, bucketTotal(paid))),
    unallocated: moneyString(unallocated),
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
