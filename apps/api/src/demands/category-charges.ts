import {
  type AssessmentCharges,
  rebateOnPenaltyBase,
  resolveAssessmentCharges,
} from "./assessment-charges"
import { minMoney, money, moneyString, subMoney, sumMoney } from "./money"
import { componentsFromParts } from "./outstanding"
import { calendarDay } from "./rebate"
import type { PenaltyRule } from "./penalty-policy"
import type { RebateRule } from "./rebate"

export type TaxCategory = "COMBINED" | "PROPERTY_TAX" | "WATER_TAX" | "DRAINAGE_TAX"
export type ComponentCategory = Exclude<TaxCategory, "COMBINED">

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  "PROPERTY_TAX",
  "WATER_TAX",
  "DRAINAGE_TAX",
]

export type CategoryRebateRule = RebateRule & { category: TaxCategory; policyId: string }
export type CategoryPenaltyRule = PenaltyRule & { category: TaxCategory; policyId: string }

export type CategoryChargeLine = {
  category: ComponentCategory
  /** Current-year tax for this category. */
  component: string
  /** This category's own unpaid previous-year tax. */
  previousArrears: string
  penalty: string
  penaltyBase: string
  penaltyPolicyId: string | null
  /** True when the penalty came from the tax-config percent (no policy). */
  penaltyFromTaxConfig: boolean
  rebate: string
  rebateBase: string
  rebatePolicyId: string | null
}

export type ChargeBreakdown =
  | {
      mode: "COMBINED"
      calculatedAt: string
      rebatePolicyId: string | null
      penaltyPolicyId: string | null
      rebate: string
      penalty: string
    }
  | {
      mode: "CATEGORY"
      calculatedAt: string
      lines: CategoryChargeLine[]
      rebate: string
      penalty: string
    }

export type CategoryCharges = AssessmentCharges & {
  breakdown: ChargeBreakdown
  rebatePolicyIds: string[]
  penaltyPolicyIds: string[]
}

export class PolicyConflictError extends Error {
  readonly code = "POLICY_CATEGORY_CONFLICT"
  constructor() {
    super(
      "A combined rule and a tax-specific rule are both active for this assessment year. Archive one of them before calculating demands."
    )
  }
}

export type CategoryChargeInput = {
  asOf: Date
  propertyTax: string
  waterTax: string
  drainageTax: string
  interest: string
  /** Legacy tax-config penalty (a percent of property tax). */
  taxConfigPenalty: string
  /** Total verified previous-year arrears (all categories). */
  previousArrears: string
  /** Unpaid previous-year tax per category (from the ledger breakdown). */
  previousByCategory: Record<ComponentCategory, string>
  rebateRules: CategoryRebateRule[]
  penaltyRules: CategoryPenaltyRule[]
}

const LABEL: Record<ComponentCategory, string> = {
  PROPERTY_TAX: "property tax",
  WATER_TAX: "water tax",
  DRAINAGE_TAX: "drainage tax",
}

function componentOf(input: CategoryChargeInput, category: ComponentCategory) {
  if (category === "PROPERTY_TAX") return input.propertyTax
  if (category === "WATER_TAX") return input.waterTax
  return input.drainageTax
}

function dueDateReached(rule: PenaltyRule, asOf: Date): boolean {
  if (!rule.dueDate) return false
  const due = new Date(rule.dueDate)
  due.setUTCDate(due.getUTCDate() + Math.max(0, rule.graceDays))
  return calendarDay(asOf) > calendarDay(due)
}

function capped(amount: ReturnType<typeof money>, max: string | null, limit: string) {
  let value = amount
  if (max) value = minMoney(value, max)
  if (value.gt(money(limit))) value = money(limit)
  if (value.lt(0)) value = money(0)
  return value
}

/**
 * Rebate and penalty for one assessment year.
 *
 * - Only COMBINED rules active: the existing single-rule calculation runs unchanged.
 * - Tax-specific rules active: each rule applies only to its own tax and, when
 *   it explicitly includes arrears, to that tax's own unpaid previous years.
 *   A property-tax rule never reduces water or drainage tax.
 * - COMBINED and tax-specific rules together are rejected (double counting).
 *
 * Each rule is applied once. Published demands keep the result and are never
 * recalculated through this function.
 */
export function resolveCategoryCharges(input: CategoryChargeInput): CategoryCharges {
  const calculatedAt = input.asOf.toISOString()
  const active = <T extends { active: boolean }>(rules: T[]) => rules.filter((r) => r.active)
  const rebates = active(input.rebateRules)
  const penalties = active(input.penaltyRules)
  const combinedRebate = rebates.find((r) => r.category === "COMBINED") ?? null
  const combinedPenalty = penalties.find((r) => r.category === "COMBINED") ?? null
  const categoryRebates = rebates.filter((r) => r.category !== "COMBINED")
  const categoryPenalties = penalties.filter((r) => r.category !== "COMBINED")

  if (
    (combinedRebate || combinedPenalty) &&
    (categoryRebates.length > 0 || categoryPenalties.length > 0)
  ) {
    throw new PolicyConflictError()
  }

  if (categoryRebates.length === 0 && categoryPenalties.length === 0) {
    const legacy = resolveAssessmentCharges({
      asOf: input.asOf,
      propertyTax: input.propertyTax,
      waterTax: input.waterTax,
      drainageTax: input.drainageTax,
      interest: input.interest,
      taxConfigPenalty: input.taxConfigPenalty,
      previousArrears: input.previousArrears,
      rebateRule: combinedRebate,
      penaltyRule: combinedPenalty,
    })
    return {
      ...legacy,
      breakdown: {
        mode: "COMBINED",
        calculatedAt,
        rebatePolicyId: combinedRebate?.policyId ?? null,
        penaltyPolicyId: legacy.penaltyPolicyApplied ? combinedPenalty?.policyId ?? null : null,
        rebate: legacy.rebateAmount,
        penalty: legacy.penalty,
      },
      rebatePolicyIds: combinedRebate ? [combinedRebate.policyId] : [],
      penaltyPolicyIds:
        legacy.penaltyPolicyApplied && combinedPenalty ? [combinedPenalty.policyId] : [],
    }
  }

  const lines: CategoryChargeLine[] = []
  for (const category of COMPONENT_CATEGORIES) {
    const component = money(componentOf(input, category))
    const arrears = money(input.previousByCategory[category] ?? "0")
    const rebateRule = categoryRebates.find((r) => r.category === category) ?? null
    const penaltyRule = categoryPenalties.find((r) => r.category === category) ?? null

    // Rebate base before any penalty (used when the penalty applies after rebate).
    const rebateParts = (penalty: string) => {
      if (!rebateRule) return [] as Array<{ key: string; amount: string }>
      const parts = [{ key: "component", amount: moneyString(component) }]
      if (rebateRule.includeArrears) parts.push({ key: "arrears", amount: moneyString(arrears) })
      if (rebateRule.includePenalty) parts.push({ key: "penalty", amount: penalty })
      return parts
    }
    const rebateFor = (penalty: string) => {
      if (!rebateRule) return { amount: money(0), base: money(0) }
      const base = sumMoney(rebateParts(penalty).map((p) => p.amount))
      const raw =
        rebateRule.type === "FIXED_AMOUNT"
          ? money(rebateRule.fixedAmount)
          : money(base.mul(rebateRule.rate).div(100))
      return { amount: capped(raw, rebateRule.maxAmount, moneyString(base)), base }
    }

    let penalty = money(0)
    let penaltyBase = money(0)
    let penaltyFromTaxConfig = false
    if (penaltyRule) {
      const parts = [{ key: "component", amount: moneyString(component) }]
      if (penaltyRule.includeArrears) parts.push({ key: "arrears", amount: moneyString(arrears) })
      penaltyBase = sumMoney(parts.map((p) => p.amount))
      const gated =
        penaltyRule.trigger === "DUE_DATE_PASSED" && !dueDateReached(penaltyRule, input.asOf)
      if (!gated) {
        if (penaltyRule.type === "FIXED_AMOUNT") {
          penalty = money(penaltyRule.fixedAmount)
        } else {
          let base = penaltyBase
          if (penaltyRule.applyAfterRebate && rebateRule) {
            const pre = rebateFor("0.00")
            base = subMoney(
              base,
              rebateOnPenaltyBase(parts, rebateParts("0.00"), moneyString(pre.amount))
            )
            penaltyBase = base
          }
          penalty = money(base.mul(penaltyRule.rate).div(100))
        }
        if (penaltyRule.maxAmount) penalty = minMoney(penalty, penaltyRule.maxAmount)
        if (penalty.lt(0)) penalty = money(0)
      }
    } else if (category === "PROPERTY_TAX") {
      // No property-tax penalty policy: keep the published tax-config percent.
      penalty = money(input.taxConfigPenalty)
      penaltyBase = component
      penaltyFromTaxConfig = true
    }

    const rebate = rebateFor(moneyString(penalty))
    lines.push({
      category,
      component: moneyString(component),
      previousArrears: moneyString(arrears),
      penalty: moneyString(penalty),
      penaltyBase: moneyString(penaltyBase),
      penaltyPolicyId: penaltyRule?.policyId ?? null,
      penaltyFromTaxConfig,
      rebate: moneyString(rebate.amount),
      rebateBase: moneyString(rebate.base),
      rebatePolicyId: rebateRule?.policyId ?? null,
    })
  }

  const totalPenalty = sumMoney(lines.map((l) => l.penalty))
  const totalRebate = sumMoney(lines.map((l) => l.rebate))
  const scope =
    lines
      .filter((l) => l.rebatePolicyId)
      .map((l) => `${LABEL[l.category]}: ₹${l.rebate}`)
      .join("; ") || "NONE"
  const components = componentsFromParts({
    propertyTax: input.propertyTax,
    waterTax: input.waterTax,
    drainageTax: input.drainageTax,
    penalty: moneyString(totalPenalty),
    interest: input.interest,
  })
  return {
    ...components,
    rebateAmount: moneyString(totalRebate),
    rebateScope: scope,
    penaltyPolicyApplied: lines.some((l) => l.penaltyPolicyId),
    breakdown: {
      mode: "CATEGORY",
      calculatedAt,
      lines,
      rebate: moneyString(totalRebate),
      penalty: moneyString(totalPenalty),
    },
    rebatePolicyIds: lines.flatMap((l) => (l.rebatePolicyId ? [l.rebatePolicyId] : [])),
    penaltyPolicyIds: lines.flatMap((l) => (l.penaltyPolicyId ? [l.penaltyPolicyId] : [])),
  }
}

/** Rebate rule from a stored policy row (call only for a current policy). */
export function rebateRuleFromPolicy(policy: {
  id: string
  taxCategory: TaxCategory
  rebateType: "PERCENTAGE" | "FIXED_AMOUNT"
  rate: { toString(): string } | null
  fixedAmount: { toString(): string } | null
  includePropertyTax: boolean
  includeWaterTax: boolean
  includeDrainageTax: boolean
  includeArrears: boolean
  includePenalty: boolean
  includeInterest: boolean
  maxAmount: { toString(): string } | null
}): CategoryRebateRule {
  return {
    active: true,
    category: policy.taxCategory,
    policyId: policy.id,
    type: policy.rebateType,
    rate: policy.rate?.toString() ?? "0",
    fixedAmount: policy.fixedAmount?.toString() ?? "0",
    includePropertyTax: policy.includePropertyTax,
    includeWaterTax: policy.includeWaterTax,
    includeDrainageTax: policy.includeDrainageTax,
    includeArrears: policy.includeArrears,
    includePenalty: policy.includePenalty,
    includeInterest: policy.includeInterest,
    maxAmount: policy.maxAmount?.toString() ?? null,
  }
}
