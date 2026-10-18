import { dec, minMoney, money, moneyString, subMoney, sumMoney } from "./money"
import {
  resolvePenaltyAmount,
  type PenaltyRule,
} from "./penalty-policy"
import { calculateRebate, type RebateRule } from "./rebate"
import { componentsFromParts } from "./outstanding"

export type AssessmentChargeInput = {
  asOf: Date
  propertyTax: string
  waterTax: string
  drainageTax: string
  interest: string
  taxConfigPenalty: string
  previousArrears: string
  rebateRule: RebateRule | null
  penaltyRule: PenaltyRule | null
}

export type AssessmentCharges = {
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
  currentYearDemand: string
  rebateAmount: string
  rebateScope: string
  penaltyPolicyApplied: boolean
}

type Part = { key: string; amount: string }

function rebateParts(
  rule: RebateRule,
  input: AssessmentChargeInput
): Part[] {
  const parts: Part[] = []
  if (rule.includePropertyTax) parts.push({ key: "propertyTax", amount: input.propertyTax })
  if (rule.includeWaterTax) parts.push({ key: "waterTax", amount: input.waterTax })
  if (rule.includeDrainageTax) parts.push({ key: "drainageTax", amount: input.drainageTax })
  if (rule.includeArrears) parts.push({ key: "previousArrears", amount: input.previousArrears })
  if (rule.includeInterest) parts.push({ key: "interest", amount: input.interest })
  return parts
}

function penaltyParts(rule: PenaltyRule, input: AssessmentChargeInput): Part[] {
  if (rule.type === "PERCENT_OF_PROPERTY_TAX") {
    return [{ key: "propertyTax", amount: input.propertyTax }]
  }
  if (rule.type !== "PERCENT_OF_ELIGIBLE_BASE") return []
  const parts: Part[] = []
  if (rule.includePropertyTax) parts.push({ key: "propertyTax", amount: input.propertyTax })
  if (rule.includeWaterTax) parts.push({ key: "waterTax", amount: input.waterTax })
  if (rule.includeDrainageTax) parts.push({ key: "drainageTax", amount: input.drainageTax })
  if (rule.includeArrears) parts.push({ key: "previousArrears", amount: input.previousArrears })
  return parts
}

/** Portion of the rebate that falls on the penalty-eligible components. */
export function rebateOnPenaltyBase(
  penaltyEligible: Part[],
  rebateEligible: Part[],
  rebateAmount: string
): string {
  const rebateBase = sumMoney(rebateEligible.map((part) => part.amount))
  if (rebateBase.eq(0)) return "0.00"
  const overlap = sumMoney(
    penaltyEligible
      .filter((part) => rebateEligible.some((item) => item.key === part.key))
      .map((part) => part.amount)
  )
  return moneyString(money(dec(rebateAmount).mul(overlap).div(rebateBase)))
}

function withComponents(
  input: AssessmentChargeInput,
  penalty: string,
  rebateAmount: string,
  rebateScope: string,
  penaltyPolicyApplied: boolean
): AssessmentCharges {
  const components = componentsFromParts({
    propertyTax: input.propertyTax,
    waterTax: input.waterTax,
    drainageTax: input.drainageTax,
    penalty,
    interest: input.interest,
  })
  return {
    ...components,
    rebateAmount,
    rebateScope,
    penaltyPolicyApplied,
  }
}

/**
 * One application of the approved rebate and penalty.
 * Published snapshots must not call this again.
 * When the penalty policy applies after rebate, the percentage is taken on the reduced eligible base.
 */
export function resolveAssessmentCharges(
  input: AssessmentChargeInput
): AssessmentCharges {
  const rule = input.penaltyRule
  if (rule?.active && rule.applyAfterRebate) {
    const rebate = calculateRebate(input.rebateRule, {
      propertyTax: input.propertyTax,
      waterTax: input.waterTax,
      drainageTax: input.drainageTax,
      penalty: "0.00",
      interest: input.interest,
      previousArrears: input.previousArrears,
    })
    const gated = resolvePenaltyAmount(rule, {
      asOf: input.asOf,
      taxConfigPenalty: "0.00",
      propertyTax: input.propertyTax,
      waterTax: input.waterTax,
      drainageTax: input.drainageTax,
      previousArrears: input.previousArrears,
    })
    if (rule.trigger === "DUE_DATE_PASSED" && gated.penalty === "0.00") {
      return withComponents(input, "0.00", rebate.amount, rebate.scope, true)
    }
    if (rule.type === "FIXED_AMOUNT") {
      return withComponents(input, gated.penalty, rebate.amount, rebate.scope, true)
    }
    const parts = penaltyParts(rule, input)
    const base = sumMoney(parts.map((part) => part.amount))
    const reduced = money(
      subMoney(
        base,
        rebateOnPenaltyBase(
          parts,
          input.rebateRule?.active ? rebateParts(input.rebateRule, input) : [],
          rebate.amount
        )
      )
    )
    const raw = money(reduced.mul(rule.rate).div(100))
    const capped = rule.maxAmount ? minMoney(raw, rule.maxAmount) : raw
    const penalty = capped.lt(0) ? money(0) : capped
    return withComponents(
      input,
      moneyString(penalty),
      rebate.amount,
      rebate.scope,
      true
    )
  }

  const penalty = resolvePenaltyAmount(rule, {
    asOf: input.asOf,
    taxConfigPenalty: input.taxConfigPenalty,
    propertyTax: input.propertyTax,
    waterTax: input.waterTax,
    drainageTax: input.drainageTax,
    previousArrears: input.previousArrears,
  })
  const rebate = calculateRebate(input.rebateRule, {
    propertyTax: input.propertyTax,
    waterTax: input.waterTax,
    drainageTax: input.drainageTax,
    penalty: penalty.penalty,
    interest: input.interest,
    previousArrears: input.previousArrears,
  })
  return withComponents(
    input,
    penalty.penalty,
    rebate.amount,
    rebate.scope,
    penalty.policyApplied
  )
}
