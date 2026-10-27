import {
  addMoney,
  dec,
  exceedsMoney,
  isZeroMoney,
  money,
  moneyString,
  subMoney,
  sumMoney,
  type MoneyInput,
} from "./money"
import { calculateRebate, type RebateRule } from "./rebate"

export type LedgerDemand = {
  id: string
  assessmentYearId: string
  assessmentYearCode: string
  assessmentYearName: string
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
  currentYearDemand: string
  credits: string
  debits: string
  payments: string
  rebate?: string
  verificationStatus?: "UNVERIFIED" | "VERIFIED"
  balanceKind?: "COMPONENTS" | "CLOSING_ONLY"
}

export type SuccessPaymentFact = {
  id: string
  amount: string
  allocatedAmount: string
  assessmentYearId: string | null
  assessmentYearCode: string | null
  assessmentYearName: string | null
}

export type YearBreakdown = {
  assessmentYearId: string
  assessmentYearCode: string
  assessmentYearName: string
  originalDemand: string
  propertyTax: string
  waterTax: string
  drainageTax: string
  openingArrears: string
  penalty: string
  interest: string
  payments: string
  credits: string
  rebate: string
  debits: string
  outstanding: string
  closingOutstanding: string
  verificationStatus: "UNVERIFIED" | "VERIFIED"
  publishedDemandId: string | null
  balanceKind: "COMPONENTS" | "CLOSING_ONLY"
}

export type UnreconciledYear = {
  assessmentYearId: string
  code: string
  name: string
  reason: string
}

export type OutstandingBreakdown = {
  selectedYearId: string
  selectedYearCode: string
  selectedYearName: string
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
  currentYearDemand: string
  openingArrears: string
  grossEligibleDemand: string
  rebateAmount: string
  rebateScope: string
  approvedCredits: string
  approvedDebits: string
  paymentsAllocated: string
  totalPayable: string
  netOutstanding: string
  previousPropertyTaxOutstanding: string
  previousWaterTaxOutstanding: string
  previousDrainageTaxOutstanding: string
  previousPenaltyInterestOutstanding: string
  previousRebatesCredits: string
  previousPayments: string
  historicalOpeningArrears: string
  publishedDemandId: string | null
  years: YearBreakdown[]
  unreconciledYears: UnreconciledYear[]
  unassignedPaymentIds: string[]
  missingHistoryYears: UnreconciledYear[]
  historyComplete: boolean
  authoritative: boolean
}

export function allocationCounts(
  allocationStatus: "ACTIVE" | "REVERSED",
  paymentStatus: string
): boolean {
  return allocationStatus === "ACTIVE" && paymentStatus === "SUCCESS"
}

/** This year's own unpaid demand. Opening arrears are not included. */
export function ownOutstanding(input: {
  currentYearDemand: string
  interest: string
  credits: string
  debits: string
  payments: string
  rebate?: string
}): string {
  const net = money(
    dec(input.currentYearDemand)
      .plus(input.interest)
      .plus(input.debits)
      .minus(input.credits)
      .minus(input.rebate ?? 0)
      .minus(input.payments)
  )
  return moneyString(net)
}

export function calculateOutstanding(input: {
  selectedYear: { id: string; code: string; name: string }
  demands: LedgerDemand[]
  payments: SuccessPaymentFact[]
  calculatedCurrent: {
    propertyTax: string
    waterTax: string
    drainageTax: string
    penalty: string
    interest: string
    currentYearDemand: string
  } | null
  rebateRule?: RebateRule | null
  /** Rebate already calculated once. Prevents a second application on preview. */
  lockedRebate?: { amount: string; scope: string } | null
  missingHistoryYears?: UnreconciledYear[]
}): OutstandingBreakdown {
  const publishedYearIds = new Set(
    input.demands.map((demand) => demand.assessmentYearId)
  )
  const selected =
    input.demands.find(
      (demand) => demand.assessmentYearId === input.selectedYear.id
    ) ?? null

  const components = selected
    ? {
        propertyTax: moneyString(selected.propertyTax),
        waterTax: moneyString(selected.waterTax),
        drainageTax: moneyString(selected.drainageTax),
        penalty: moneyString(selected.penalty),
        interest: moneyString(selected.interest),
        currentYearDemand: moneyString(selected.currentYearDemand),
        credits: moneyString(selected.credits),
        debits: moneyString(selected.debits),
        payments: moneyString(selected.payments),
      }
    : {
        propertyTax: moneyString(input.calculatedCurrent?.propertyTax ?? 0),
        waterTax: moneyString(input.calculatedCurrent?.waterTax ?? 0),
        drainageTax: moneyString(input.calculatedCurrent?.drainageTax ?? 0),
        penalty: moneyString(input.calculatedCurrent?.penalty ?? 0),
        interest: moneyString(input.calculatedCurrent?.interest ?? 0),
        currentYearDemand: moneyString(
          input.calculatedCurrent?.currentYearDemand ?? 0
        ),
        credits: moneyString(0),
        debits: moneyString(0),
        payments: moneyString(0),
      }

  const priorDemands = input.demands
    .filter(
      (demand) =>
        demand.assessmentYearCode.localeCompare(input.selectedYear.code) < 0
    )
    .sort((a, b) => a.assessmentYearCode.localeCompare(b.assessmentYearCode))

  const openingArrears = sumMoney(
    priorDemands
      .filter(
        (demand) => (demand.verificationStatus ?? "VERIFIED") === "VERIFIED"
      )
      .map((demand) => ownOutstanding(demand))
  )

  const storedRebate = selected?.rebate ?? "0.00"
  const previewRebate = selected
    ? {
        amount: moneyString(storedRebate),
        scope: money(storedRebate).gt(0) ? "SNAPSHOT" : "NONE",
      }
    : input.lockedRebate
      ? {
          amount: moneyString(input.lockedRebate.amount),
          scope: input.lockedRebate.scope,
        }
      : calculateRebate(input.rebateRule ?? null, {
        propertyTax: components.propertyTax,
        waterTax: components.waterTax,
        drainageTax: components.drainageTax,
        penalty: components.penalty,
        interest: components.interest,
        previousArrears: moneyString(openingArrears),
      })

  const years: YearBreakdown[] = priorDemands.map((demand) =>
    toYearRow(demand, ownOutstanding(demand))
  )
  const selectedOutstanding = selected
    ? ownOutstanding(selected)
    : ownOutstanding({
        ...components,
        rebate: previewRebate.amount,
      })
  years.push(
    selected
      ? toYearRow(selected, selectedOutstanding)
      : {
          assessmentYearId: input.selectedYear.id,
          assessmentYearCode: input.selectedYear.code,
          assessmentYearName: input.selectedYear.name,
          originalDemand: components.currentYearDemand,
          propertyTax: components.propertyTax,
          waterTax: components.waterTax,
          drainageTax: components.drainageTax,
          openingArrears: "0.00",
          penalty: components.penalty,
          balanceKind: "COMPONENTS",
          interest: components.interest,
          payments: components.payments,
          credits: components.credits,
          rebate: previewRebate.amount,
          debits: components.debits,
          outstanding: selectedOutstanding,
          closingOutstanding: selectedOutstanding,
          verificationStatus: "VERIFIED",
          publishedDemandId: null,
        }
  )
  years.sort((a, b) => a.assessmentYearCode.localeCompare(b.assessmentYearCode))
  applyCarryForward(years)
  const previous = previousYearFigures(years, input.selectedYear.code)

  const grossEligibleDemand = sumMoney([
    openingArrears,
    components.currentYearDemand,
    components.interest,
    components.debits,
  ])
  const totalPayable = subMoney(
    subMoney(grossEligibleDemand, previewRebate.amount),
    components.credits
  )
  const netOutstanding = subMoney(totalPayable, components.payments)

  const unreconciledYears: UnreconciledYear[] = []
  const seenYears = new Set<string>()
  const unassignedPaymentIds: string[] = []
  for (const payment of input.payments) {
    if (!payment.assessmentYearId) {
      if (exceedsMoney(payment.amount, payment.allocatedAmount)) {
        unassignedPaymentIds.push(payment.id)
      }
      continue
    }
    if (publishedYearIds.has(payment.assessmentYearId)) continue
    if (seenYears.has(payment.assessmentYearId)) continue
    seenYears.add(payment.assessmentYearId)
    unreconciledYears.push({
      assessmentYearId: payment.assessmentYearId,
      code: payment.assessmentYearCode ?? payment.assessmentYearId,
      name: payment.assessmentYearName ?? payment.assessmentYearId,
      reason:
        "Successful payment exists for this assessment year but no published demand is on the ledger",
    })
  }
  for (const demand of priorDemands) {
    if ((demand.verificationStatus ?? "VERIFIED") === "VERIFIED") continue
    unreconciledYears.push({
      assessmentYearId: demand.assessmentYearId,
      code: demand.assessmentYearCode,
      name: demand.assessmentYearName,
      reason: "Historical balance is recorded but not verified",
    })
  }

  const missingHistoryYears = input.missingHistoryYears ?? []
  const blockingYears = unreconciledYears.filter(
    (year) => year.assessmentYearId !== input.selectedYear.id
  )
  const authoritative =
    blockingYears.length === 0 &&
    unassignedPaymentIds.length === 0 &&
    missingHistoryYears.length === 0

  return {
    selectedYearId: input.selectedYear.id,
    selectedYearCode: input.selectedYear.code,
    selectedYearName: input.selectedYear.name,
    propertyTax: components.propertyTax,
    waterTax: components.waterTax,
    drainageTax: components.drainageTax,
    penalty: components.penalty,
    interest: components.interest,
    currentYearDemand: components.currentYearDemand,
    openingArrears: moneyString(openingArrears),
    grossEligibleDemand: moneyString(grossEligibleDemand),
    rebateAmount: previewRebate.amount,
    rebateScope: previewRebate.scope,
    approvedCredits: components.credits,
    approvedDebits: components.debits,
    paymentsAllocated: components.payments,
    totalPayable: moneyString(totalPayable),
    netOutstanding: moneyString(netOutstanding),
    ...previous,
    publishedDemandId: selected?.id ?? null,
    years,
    unreconciledYears,
    unassignedPaymentIds,
    missingHistoryYears,
    historyComplete: missingHistoryYears.length === 0,
    authoritative,
  }
}

function toYearRow(demand: LedgerDemand, outstanding: string): YearBreakdown {
  return {
    assessmentYearId: demand.assessmentYearId,
    assessmentYearCode: demand.assessmentYearCode,
    assessmentYearName: demand.assessmentYearName,
    originalDemand: moneyString(demand.currentYearDemand),
    propertyTax: moneyString(demand.propertyTax),
    waterTax: moneyString(demand.waterTax),
    drainageTax: moneyString(demand.drainageTax),
    openingArrears: "0.00",
    penalty: moneyString(demand.penalty),
    balanceKind: demand.balanceKind ?? "COMPONENTS",
    interest: moneyString(demand.interest),
    payments: moneyString(demand.payments),
    credits: moneyString(demand.credits),
    rebate: moneyString(demand.rebate ?? 0),
    debits: moneyString(demand.debits),
    outstanding,
    closingOutstanding: outstanding,
    verificationStatus: demand.verificationStatus ?? "VERIFIED",
    publishedDemandId: demand.id,
  }
}

function consume(amount: MoneyInput, left: MoneyInput) {
  const value = money(amount)
  const remaining = money(left)
  if (remaining.lte(0)) return { next: value, left: remaining }
  if (value.lte(remaining)) {
    return { next: money(0), left: money(remaining.minus(value)) }
  }
  return { next: money(value.minus(remaining)), left: money(0) }
}

/**
 * Order in which payments, credits and rebates settle one assessment year's
 * components. Shared by collection posting, the ledger and the notice so the
 * per-tax split is the same everywhere. (Existing rule; see the tax-portal
 * policy questions before changing it.)
 */
export const COMPONENT_ORDER = [
  "interest",
  "penalty",
  "drainageTax",
  "waterTax",
  "propertyTax",
] as const

export type YearComponent = (typeof COMPONENT_ORDER)[number]
export type ComponentAmounts = Record<YearComponent, string>

export type YearComponentsInput = {
  propertyTax: MoneyInput
  waterTax: MoneyInput
  drainageTax: MoneyInput
  penalty: MoneyInput
  /** Interest plus approved debits (other charges). */
  interest: MoneyInput
}

export function zeroComponentAmounts(): ComponentAmounts {
  return {
    interest: "0.00",
    penalty: "0.00",
    drainageTax: "0.00",
    waterTax: "0.00",
    propertyTax: "0.00",
  }
}

/** What is still unpaid on each component after `applied` (payments + credits + rebate) settled them in order. */
export function componentBalances(
  components: YearComponentsInput,
  applied: MoneyInput
): ComponentAmounts {
  let left = money(applied)
  const out = zeroComponentAmounts()
  for (const key of COMPONENT_ORDER) {
    const step = consume(components[key], left)
    out[key] = moneyString(step.next)
    left = step.left
  }
  return out
}

/**
 * Splits `amount` across the components that are still unpaid after
 * `appliedBefore`, in COMPONENT_ORDER. The parts always add up to `amount`
 * when it does not exceed the unpaid total; any excess is left in `unapplied`.
 */
export function splitPaymentByComponent(
  components: YearComponentsInput,
  appliedBefore: MoneyInput,
  amount: MoneyInput
): { parts: ComponentAmounts; unapplied: string } {
  const before = componentBalances(components, appliedBefore)
  let left = money(amount)
  const parts = zeroComponentAmounts()
  for (const key of COMPONENT_ORDER) {
    const due = money(before[key])
    if (!left.gt(0) || !due.gt(0)) continue
    const take = due.lte(left) ? due : left
    parts[key] = moneyString(take)
    left = money(left.minus(take))
  }
  return { parts, unapplied: moneyString(left) }
}

function previousYearFigures(years: YearBreakdown[], selectedYearCode: string) {
  const prior = years.filter(
    (year) =>
      year.assessmentYearCode < selectedYearCode &&
      year.verificationStatus === "VERIFIED"
  )
  let property = money(0)
  let water = money(0)
  let drainage = money(0)
  let penaltyInterest = money(0)
  let rebates = money(0)
  let payments = money(0)
  let historical = money(0)
  for (const year of prior) {
    rebates = money(dec(rebates).plus(year.rebate).plus(year.credits))
    payments = money(dec(payments).plus(year.payments))
    if (year.balanceKind === "CLOSING_ONLY") {
      historical = money(dec(historical).plus(year.outstanding))
      continue
    }
    const unpaid = componentBalances(
      {
        propertyTax: year.propertyTax,
        waterTax: year.waterTax,
        drainageTax: year.drainageTax,
        penalty: year.penalty,
        interest: dec(year.interest).plus(year.debits),
      },
      dec(year.payments).plus(year.credits).plus(year.rebate)
    )
    property = money(dec(property).plus(unpaid.propertyTax))
    water = money(dec(water).plus(unpaid.waterTax))
    drainage = money(dec(drainage).plus(unpaid.drainageTax))
    penaltyInterest = money(
      dec(penaltyInterest).plus(unpaid.penalty).plus(unpaid.interest)
    )
  }
  return {
    previousPropertyTaxOutstanding: moneyString(property),
    previousWaterTaxOutstanding: moneyString(water),
    previousDrainageTaxOutstanding: moneyString(drainage),
    previousPenaltyInterestOutstanding: moneyString(penaltyInterest),
    previousRebatesCredits: moneyString(rebates),
    previousPayments: moneyString(payments),
    historicalOpeningArrears: moneyString(historical),
  }
}

export type CountedAllocation = {
  amount: string
  status: "ACTIVE" | "REVERSED"
  paymentStatus: string
  paymentReference?: string | null
  receiptNumber?: string | null
  gatewayReference?: string | null
  remarks?: string | null
}

export function allocationMatchesHistoricalSource(
  sourceReference: string | null | undefined,
  payment: Omit<CountedAllocation, "amount" | "status" | "paymentStatus">
): boolean {
  const source = sourceReference?.trim()
  if (!source) return false
  return [
    payment.paymentReference,
    payment.receiptNumber,
    payment.gatewayReference,
    payment.remarks,
  ].some((value) => value?.trim() === source)
}

/** Historical receipts and later allocations are added once. A matching source reference is the same payment. */
export function countedPayments(input: {
  historicalPayments: string
  sourceReference?: string | null
  allocations: CountedAllocation[]
}): string {
  const allocations = input.allocations
    .filter((allocation) =>
      allocationCounts(allocation.status, allocation.paymentStatus)
    )
    .filter(
      (allocation) =>
        !allocationMatchesHistoricalSource(input.sourceReference, allocation)
    )
    .map((allocation) => allocation.amount)
  return moneyString(sumMoney([input.historicalPayments, ...allocations]))
}

function applyCarryForward(years: YearBreakdown[]) {
  let carry = money(0)
  for (const year of years) {
    year.openingArrears = moneyString(carry)
    year.closingOutstanding = moneyString(addMoney(carry, year.outstanding))
    if (year.verificationStatus === "VERIFIED") {
      carry = addMoney(carry, year.outstanding)
    }
  }
}

export function isPublishBlocked(breakdown: OutstandingBreakdown): boolean {
  return !breakdown.authoritative
}

export function zeroComponents(): {
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
  currentYearDemand: string
} {
  return {
    propertyTax: "0.00",
    waterTax: "0.00",
    drainageTax: "0.00",
    penalty: "0.00",
    interest: "0.00",
    currentYearDemand: "0.00",
  }
}

export function componentsFromParts(input: {
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest?: string
}): {
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
  currentYearDemand: string
} {
  const currentYearDemand = sumMoney([
    input.propertyTax,
    input.waterTax,
    input.drainageTax,
    input.penalty,
  ])
  return {
    propertyTax: moneyString(input.propertyTax),
    waterTax: moneyString(input.waterTax),
    drainageTax: moneyString(input.drainageTax),
    penalty: moneyString(input.penalty),
    interest: moneyString(input.interest ?? 0),
    currentYearDemand: moneyString(currentYearDemand),
  }
}

export function priorOpeningArrears(
  breakdownYears: YearBreakdown[],
  selectedYearCode: string
): string {
  return moneyString(
    sumMoney(
      breakdownYears
        .filter(
          (year) =>
            year.assessmentYearCode < selectedYearCode &&
            year.verificationStatus === "VERIFIED"
        )
        .map((year) => year.outstanding)
    )
  )
}

export { isZeroMoney }
