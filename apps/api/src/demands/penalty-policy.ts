import { minMoney, money, moneyString, sumMoney } from "./money"
import { calendarDay, policyIsCurrent } from "./rebate"

export type PenaltyRule = {
  active: boolean
  type: "PERCENT_OF_PROPERTY_TAX" | "PERCENT_OF_ELIGIBLE_BASE" | "FIXED_AMOUNT"
  rate: string
  fixedAmount: string
  trigger: "ON_ASSESSMENT" | "DUE_DATE_PASSED"
  dueDate: Date | null
  graceDays: number
  includePropertyTax: boolean
  includeWaterTax: boolean
  includeDrainageTax: boolean
  includeArrears: boolean
  applyAfterRebate: boolean
  maxAmount: string | null
}

function dueDateReached(rule: PenaltyRule, asOf: Date): boolean {
  if (!rule.dueDate) return false
  const due = new Date(rule.dueDate)
  due.setUTCDate(due.getUTCDate() + Math.max(0, rule.graceDays))
  return calendarDay(asOf) > calendarDay(due)
}

/**
 * One-time penalty. An active policy replaces the tax-config percent for unpublished
 * calculations. Without an active policy, the existing property-tax percent is kept.
 * Recurring or compounding interest is not calculated here.
 */
export function resolvePenaltyAmount(
  rule: PenaltyRule | null,
  input: {
    asOf: Date
    taxConfigPenalty: string
    propertyTax: string
    waterTax: string
    drainageTax: string
    previousArrears: string
  }
): { penalty: string; policyApplied: boolean } {
  if (!rule?.active) {
    return {
      penalty: moneyString(input.taxConfigPenalty),
      policyApplied: false,
    }
  }
  if (rule.trigger === "DUE_DATE_PASSED" && !dueDateReached(rule, input.asOf)) {
    return { penalty: "0.00", policyApplied: true }
  }
  const parts: string[] = []
  if (rule.type === "PERCENT_OF_PROPERTY_TAX" || rule.includePropertyTax) {
    parts.push(input.propertyTax)
  }
  if (rule.type === "PERCENT_OF_ELIGIBLE_BASE") {
    if (rule.includeWaterTax) parts.push(input.waterTax)
    if (rule.includeDrainageTax) parts.push(input.drainageTax)
    if (rule.includeArrears) parts.push(input.previousArrears)
  }
  const base =
    rule.type === "PERCENT_OF_PROPERTY_TAX"
      ? money(input.propertyTax)
      : sumMoney(parts)
  let amount =
    rule.type === "FIXED_AMOUNT"
      ? money(rule.fixedAmount)
      : money(base.mul(rule.rate).div(100))
  if (rule.maxAmount) amount = minMoney(amount, rule.maxAmount)
  return { penalty: moneyString(amount), policyApplied: true }
}

export function penaltyRuleFromPolicy(input: {
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED"
  penaltyType: PenaltyRule["type"]
  rate: { toString(): string } | null
  fixedAmount: { toString(): string } | null
  trigger: PenaltyRule["trigger"]
  dueDate: Date | null
  graceDays: number
  includePropertyTax: boolean
  includeWaterTax: boolean
  includeDrainageTax: boolean
  includeArrears: boolean
  applyAfterRebate?: boolean
  maxAmount: { toString(): string } | null
  startsOn: Date | null
  endsOn: Date | null
  asOf: Date
}): PenaltyRule | null {
  const active = policyIsCurrent({
    status: input.status,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    asOf: input.asOf,
  })
  if (!active) return null
  return {
    active: true,
    type: input.penaltyType,
    rate: input.rate?.toString() ?? "0",
    fixedAmount: input.fixedAmount?.toString() ?? "0",
    trigger: input.trigger,
    dueDate: input.dueDate,
    graceDays: input.graceDays,
    includePropertyTax: input.includePropertyTax,
    includeWaterTax: input.includeWaterTax,
    includeDrainageTax: input.includeDrainageTax,
    includeArrears: input.includeArrears,
    applyAfterRebate: input.applyAfterRebate === true,
    maxAmount: input.maxAmount?.toString() ?? null,
  }
}
