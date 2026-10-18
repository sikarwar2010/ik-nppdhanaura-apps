import { minMoney, money, moneyString, sumMoney } from "./money"

export type RebateRule = {
  active: boolean
  type: "PERCENTAGE" | "FIXED_AMOUNT"
  rate: string
  fixedAmount: string
  includePropertyTax: boolean
  includeWaterTax: boolean
  includeDrainageTax: boolean
  includeArrears: boolean
  includePenalty: boolean
  includeInterest: boolean
  maxAmount: string | null
}

export type RebateResult = {
  amount: string
  eligibleBase: string
  scope: string
}

export function rebateScopeLabel(rule: RebateRule): string {
  const parts: string[] = []
  if (rule.includePropertyTax) parts.push("property tax")
  if (rule.includeWaterTax) parts.push("water tax")
  if (rule.includeDrainageTax) parts.push("drainage tax")
  if (rule.includeArrears) parts.push("previous-year arrears")
  if (rule.includePenalty) parts.push("penalty")
  if (rule.includeInterest) parts.push("interest")
  if (parts.length === 0) return "No eligible components"
  return parts.join(", ")
}

/** One application of an approved rebate. Expired or inactive rules return zero. */
export function calculateRebate(
  rule: RebateRule | null,
  input: {
    propertyTax: string
    waterTax: string
    drainageTax: string
    penalty: string
    interest: string
    previousArrears: string
  }
): RebateResult {
  if (!rule?.active) {
    return { amount: "0.00", eligibleBase: "0.00", scope: "NONE" }
  }
  const parts: string[] = []
  if (rule.includePropertyTax) parts.push(input.propertyTax)
  if (rule.includeWaterTax) parts.push(input.waterTax)
  if (rule.includeDrainageTax) parts.push(input.drainageTax)
  if (rule.includeArrears) parts.push(input.previousArrears)
  if (rule.includePenalty) parts.push(input.penalty)
  if (rule.includeInterest) parts.push(input.interest)
  const eligible = sumMoney(parts)
  let amount =
    rule.type === "FIXED_AMOUNT"
      ? minMoney(rule.fixedAmount, eligible)
      : money(eligible.mul(rule.rate).div(100))
  if (rule.maxAmount) amount = minMoney(amount, rule.maxAmount)
  if (amount.gt(eligible)) amount = eligible
  return {
    amount: moneyString(amount),
    eligibleBase: moneyString(eligible),
    scope: rebateScopeLabel(rule),
  }
}

export function calendarDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date)
}

export function policyIsCurrent(input: {
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED"
  startsOn: Date | null
  endsOn: Date | null
  paymentDeadline?: Date | null
  asOf: Date
}): boolean {
  if (input.status !== "ACTIVE") return false
  const day = calendarDay(input.asOf)
  if (input.startsOn && calendarDay(input.startsOn) > day) return false
  if (input.endsOn && calendarDay(input.endsOn) < day) return false
  if (input.paymentDeadline && calendarDay(input.paymentDeadline) < day) {
    return false
  }
  return true
}
