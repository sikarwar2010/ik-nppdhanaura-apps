import { dec, money, moneyString, type MoneyInput } from "./money"

/**
 * Separate tax accounting. Every assessment year's balance is held in
 * independent buckets, so a payment on one tax can never reduce another and
 * unpaid water tax carries forward as water tax.
 *
 * - `charges` is interest, approved debits and any penalty that was published
 *   without a per-tax breakdown.
 * - `historical` is a verified closing balance imported without a tax split.
 *   It is never guessed into property or water tax.
 *
 * The buckets of a year always add up to `ownOutstanding` for that year.
 */
export const TAX_BUCKETS = [
  "propertyTax",
  "waterTax",
  "drainageTax",
  "charges",
  "historical",
] as const

export type TaxBucket = (typeof TAX_BUCKETS)[number]
export type BucketAmounts = Record<TaxBucket, string>
export type PartialBuckets = Partial<Record<TaxBucket, MoneyInput>>

/** Rebates, credits and payments with no tax attached settle in this order (the existing rule). */
const UNATTRIBUTED_ORDER: TaxBucket[] = [
  "charges",
  "drainageTax",
  "waterTax",
  "propertyTax",
  "historical",
]

const CATEGORY_TO_BUCKET: Record<string, TaxBucket> = {
  PROPERTY_TAX: "propertyTax",
  WATER_TAX: "waterTax",
  DRAINAGE_TAX: "drainageTax",
}

export function zeroBuckets(): BucketAmounts {
  return {
    propertyTax: "0.00",
    waterTax: "0.00",
    drainageTax: "0.00",
    charges: "0.00",
    historical: "0.00",
  }
}

export function bucketsOf(input: PartialBuckets | null | undefined): BucketAmounts {
  const out = zeroBuckets()
  for (const key of TAX_BUCKETS) out[key] = moneyString(input?.[key] ?? 0)
  return out
}

export function addBuckets(a: PartialBuckets, b: PartialBuckets): BucketAmounts {
  const out = zeroBuckets()
  for (const key of TAX_BUCKETS) {
    out[key] = moneyString(dec(a[key] ?? 0).plus(b[key] ?? 0))
  }
  return out
}

export function subBuckets(a: PartialBuckets, b: PartialBuckets): BucketAmounts {
  const out = zeroBuckets()
  for (const key of TAX_BUCKETS) {
    out[key] = moneyString(dec(a[key] ?? 0).minus(b[key] ?? 0))
  }
  return out
}

export function bucketTotal(input: PartialBuckets): string {
  return moneyString(
    TAX_BUCKETS.reduce((sum, key) => sum.plus(input[key] ?? 0), dec(0))
  )
}

export type YearTaxInput = {
  propertyTax: MoneyInput
  waterTax: MoneyInput
  drainageTax: MoneyInput
  penalty: MoneyInput
  interest: MoneyInput
  currentYearDemand: MoneyInput
  rebate: MoneyInput
  credits: MoneyInput
  debits: MoneyInput
  /** All counted payments for the year, including historical receipts. */
  payments: MoneyInput
  balanceKind: "COMPONENTS" | "CLOSING_ONLY"
  chargeBreakdown?: unknown
  /** The part of credits, debits and payments that named a tax. */
  taggedCredits?: PartialBuckets
  taggedDebits?: PartialBuckets
  taggedPayments?: PartialBuckets
}

export type YearTaxLedger = {
  /** Tax, per-tax penalty and charges as published, before any reduction. */
  demand: BucketAmounts
  rebate: BucketAmounts
  credits: BucketAmounts
  debits: BucketAmounts
  paid: BucketAmounts
  balance: BucketAmounts
  /** Unpaid penalty inside each bucket; penalty is settled before the tax itself. */
  unpaidPenalty: BucketAmounts
  /** Same figure as ownOutstanding for the year. */
  total: string
}

type CategoryCharge = { category: string; penalty?: string; rebate?: string }

function categoryLines(breakdown: unknown): CategoryCharge[] {
  if (!breakdown || typeof breakdown !== "object") return []
  const value = breakdown as { mode?: unknown; lines?: unknown }
  if (value.mode !== "CATEGORY" || !Array.isArray(value.lines)) return []
  return value.lines as CategoryCharge[]
}

/** Takes up to `room` from `pool` and returns what was taken. */
function takeInto(pool: { left: ReturnType<typeof money> }, room: MoneyInput) {
  const available = money(room)
  if (!available.gt(0) || !pool.left.gt(0)) return money(0)
  const taken = pool.left.lte(available) ? pool.left : available
  pool.left = money(pool.left.minus(taken))
  return taken
}

export function yearTaxLedger(input: YearTaxInput): YearTaxLedger {
  const demand = zeroBuckets()
  const rebate = zeroBuckets()
  const penaltyDue = zeroBuckets()
  const lines = categoryLines(input.chargeBreakdown)
  let unattributedRebate = money(input.rebate)

  if (input.balanceKind === "CLOSING_ONLY") {
    demand.historical = moneyString(input.currentYearDemand)
    demand.charges = moneyString(input.interest)
  } else {
    demand.propertyTax = moneyString(input.propertyTax)
    demand.waterTax = moneyString(input.waterTax)
    demand.drainageTax = moneyString(input.drainageTax)
    let attributedPenalty = money(0)
    for (const line of lines) {
      const bucket = CATEGORY_TO_BUCKET[line.category]
      if (!bucket) continue
      const penalty = money(line.penalty ?? 0)
      const lineRebate = money(line.rebate ?? 0)
      demand[bucket] = moneyString(dec(demand[bucket]).plus(penalty))
      penaltyDue[bucket] = moneyString(dec(penaltyDue[bucket]).plus(penalty))
      attributedPenalty = money(attributedPenalty.plus(penalty))
      rebate[bucket] = moneyString(dec(rebate[bucket]).plus(lineRebate))
      unattributedRebate = money(unattributedRebate.minus(lineRebate))
    }
    // Whatever the components do not explain stays visible as a charge, so the
    // buckets still add up to the published demand.
    const explained = dec(input.propertyTax)
      .plus(input.waterTax)
      .plus(input.drainageTax)
      .plus(attributedPenalty)
    demand.charges = moneyString(
      dec(input.currentYearDemand).minus(explained).plus(input.interest)
    )
    penaltyDue.charges = demand.charges
  }

  const taggedCredits = bucketsOf(input.taggedCredits)
  const taggedDebits = bucketsOf(input.taggedDebits)
  const taggedPayments = bucketsOf(input.taggedPayments)
  const credits = { ...taggedCredits }
  const debits = { ...taggedDebits }
  const paid = { ...taggedPayments }

  // Untagged debits are charges.
  debits.charges = moneyString(
    dec(debits.charges).plus(dec(input.debits).minus(bucketTotal(taggedDebits)))
  )

  // Attributed rebates beyond the bucket cannot occur on published data, but a
  // negative pool would hide money, so it is kept as a charge reduction of zero.
  if (unattributedRebate.lt(0)) unattributedRebate = money(0)
  const untaggedCredits = money(dec(input.credits).minus(bucketTotal(taggedCredits)))
  const untaggedPayments = money(dec(input.payments).minus(bucketTotal(taggedPayments)))

  // Room is worked out before tagged credits and payments, so a later tagged
  // payment cannot move what an earlier untagged amount already settled.
  const room = zeroBuckets()
  for (const key of TAX_BUCKETS) {
    room[key] = moneyString(
      dec(demand[key]).plus(debits[key]).minus(rebate[key])
    )
  }
  const settle = (amount: ReturnType<typeof money>, into: BucketAmounts) => {
    const pool = { left: amount.gt(0) ? amount : money(0) }
    for (const key of UNATTRIBUTED_ORDER) {
      const taken = takeInto(pool, room[key])
      room[key] = moneyString(dec(room[key]).minus(taken))
      into[key] = moneyString(dec(into[key]).plus(taken))
    }
    return pool.left
  }
  const leftovers = [
    { left: settle(unattributedRebate, rebate), into: rebate },
    { left: settle(untaggedCredits, credits), into: credits },
    { left: settle(untaggedPayments, paid), into: paid },
  ]
  // More was settled than was ever due: keep it visible as a negative balance.
  const overflowBucket: TaxBucket =
    input.balanceKind === "CLOSING_ONLY" ? "historical" : "propertyTax"
  for (const { left, into } of leftovers) {
    into[overflowBucket] = moneyString(dec(into[overflowBucket]).plus(left))
  }

  const balance = zeroBuckets()
  const unpaidPenalty = zeroBuckets()
  for (const key of TAX_BUCKETS) {
    balance[key] = moneyString(
      dec(demand[key])
        .plus(debits[key])
        .minus(rebate[key])
        .minus(credits[key])
        .minus(paid[key])
    )
    const owed = money(balance[key])
    const penalty = money(dec(penaltyDue[key]).plus(key === "charges" ? debits[key] : 0))
    unpaidPenalty[key] = moneyString(owed.lte(0) ? 0 : owed.lte(penalty) ? owed : penalty)
  }

  return {
    demand,
    rebate,
    credits,
    debits,
    paid,
    balance,
    unpaidPenalty,
    total: bucketTotal(balance),
  }
}

export type TaxPositionYear = {
  assessmentYearId: string
  assessmentYearCode: string
  assessmentYearName: string
  verified: boolean
  assessmentDemandId: string | null
  ledger: YearTaxLedger
}

export type TaxPosition = {
  /** Oldest first. Each liability stays under its own assessment year. */
  years: TaxPositionYear[]
  /** Verified earlier years, per tax. */
  arrears: BucketAmounts
  /** The selected year only, per tax. */
  current: BucketAmounts
  /** Arrears plus current: what can be collected now, per tax. */
  outstanding: BucketAmounts
  /** Paid so far per tax, across the verified years shown. */
  paid: BucketAmounts
  total: string
}

export function buildTaxPosition(
  years: TaxPositionYear[],
  selectedYearCode: string
): TaxPosition {
  const ordered = [...years]
    .filter((year) => year.assessmentYearCode <= selectedYearCode)
    .sort((a, b) => a.assessmentYearCode.localeCompare(b.assessmentYearCode))
  let arrears = zeroBuckets()
  let current = zeroBuckets()
  let paid = zeroBuckets()
  for (const year of ordered) {
    if (!year.verified) continue
    paid = addBuckets(paid, year.ledger.paid)
    if (year.assessmentYearCode === selectedYearCode) {
      current = addBuckets(current, year.ledger.balance)
    } else {
      arrears = addBuckets(arrears, year.ledger.balance)
    }
  }
  const outstanding = addBuckets(arrears, current)
  return {
    years: ordered,
    arrears,
    current,
    outstanding,
    paid,
    total: bucketTotal(outstanding),
  }
}

/** What the clerk or citizen chose to pay. */
export type TaxPaymentKind = "PROPERTY_TAX" | "WATER_TAX" | "COMBINED"

export type TaxPlan = {
  kind: TaxPaymentKind
  parts: BucketAmounts
}

export function taxPaymentStatus(
  balanceAfter: MoneyInput
): "PAID" | "PARTIALLY_PAID" {
  return money(balanceAfter).gt(0) ? "PARTIALLY_PAID" : "PAID"
}

export const BUCKET_LABELS: Record<TaxBucket, { en: string; hi: string }> = {
  propertyTax: { en: "Property tax", hi: "संपत्ति कर" },
  waterTax: { en: "Water tax", hi: "जल कर" },
  drainageTax: { en: "Drainage tax", hi: "नाली कर" },
  charges: { en: "Interest & other charges", hi: "ब्याज व अन्य प्रभार" },
  historical: { en: "Earlier balance (no tax split)", hi: "पूर्व शेष (कर विभाजन रहित)" },
}
