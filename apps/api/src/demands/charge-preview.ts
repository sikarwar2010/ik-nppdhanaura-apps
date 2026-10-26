import {
  type CategoryChargeLine,
  type CategoryPenaltyRule,
  type CategoryRebateRule,
  type ComponentCategory,
  resolveCategoryCharges,
} from "./category-charges"
import { dec, money, moneyString, subMoney, sumMoney } from "./money"

/**
 * Rule preview for the tax-administration pages. It runs the same engine
 * (resolveCategoryCharges) that publishes demands, so the preview and the
 * real calculation cannot drift. Nothing here writes to the database.
 */

export const ROUNDING_RULE =
  "Amounts are rounded half-up to the nearest paisa (₹0.01) at each step."

export type PreviewRuleInput = {
  kind: "rebate" | "penalty"
  taxCategory: ComponentCategory
  type: "PERCENTAGE" | "FIXED_AMOUNT"
  rate?: string | null
  fixedAmount?: string | null
  maxAmount?: string | null
  includeArrears: boolean
  /** Rebate only: also reduce this tax's penalty. */
  includePenalty?: boolean
  /** Penalty only. */
  applyAfterRebate?: boolean
  trigger?: "ON_ASSESSMENT" | "DUE_DATE_PASSED"
  dueDate?: string | null
  graceDays?: number
}

export type PreviewSample = {
  propertyTax: string
  waterTax: string
  drainageTax: string
  previousPropertyTax: string
  previousWaterTax: string
  previousDrainageTax: string
  /** Payments already allocated to this year (for the outstanding figure). */
  alreadyPaid: string
  /** Date the calculation is evaluated on (YYYY-MM-DD). */
  asOf: string
}

export type PreviewStep = { label: string; formula: string; amount: string }

export type ChargePreview = {
  estimate: true
  taxCategory: ComponentCategory
  kind: "rebate" | "penalty"
  eligibleBase: string
  eligibleExplanation: string
  ruleAmount: string
  applies: boolean
  reason: string
  steps: PreviewStep[]
  line: CategoryChargeLine
  totals: {
    originalDemand: string
    previousArrears: string
    rebate: string
    penalty: string
    payableBeforePayment: string
    alreadyPaid: string
    outstanding: string
  }
  roundingRule: string
}

export class PreviewInputError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message)
  }
}

const LABEL: Record<ComponentCategory, string> = {
  PROPERTY_TAX: "property tax",
  WATER_TAX: "water tax",
  DRAINAGE_TAX: "drainage tax",
}

const MONEY = /^\d{1,12}(\.\d{1,2})?$/
const RATE = /^\d{1,3}(\.\d{1,4})?$/

export function inr(value: string): string {
  const fixed = money(value).toFixed(2)
  const negative = fixed.startsWith("-")
  const [whole, paise] = fixed.replace("-", "").split(".") as [string, string]
  const last3 = whole.slice(-3)
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  return `${negative ? "−" : ""}₹${rest ? `${rest},` : ""}${last3}.${paise}`
}

/**
 * Shared amount checks for rebate and penalty rules (also used by the
 * create/update endpoints). Returns a list of problems; empty means valid.
 */
export function policyAmountProblems(input: {
  type: "PERCENTAGE" | "FIXED_AMOUNT"
  rate?: string | null
  fixedAmount?: string | null
  maxAmount?: string | null
  startsOn?: string | null
  endsOn?: string | null
}): Array<{ field: string; message: string }> {
  const problems: Array<{ field: string; message: string }> = []
  if (input.type === "PERCENTAGE") {
    const rate = input.rate?.trim() ?? ""
    if (!RATE.test(rate)) {
      problems.push({ field: "rate", message: "Enter a percentage such as 5 or 7.5 (up to 4 decimals)." })
    } else if (!dec(rate).gt(0) || dec(rate).gt(100)) {
      problems.push({ field: "rate", message: "The percentage must be more than 0 and at most 100." })
    }
  } else {
    const amount = input.fixedAmount?.trim() ?? ""
    if (!MONEY.test(amount) || !dec(amount).gt(0)) {
      problems.push({ field: "fixedAmount", message: "Enter an amount in rupees greater than 0 (up to 2 decimals)." })
    }
  }
  if (input.maxAmount != null && input.maxAmount !== "") {
    if (!MONEY.test(input.maxAmount) || !dec(input.maxAmount).gt(0)) {
      problems.push({ field: "maxAmount", message: "The maximum must be an amount greater than 0." })
    }
  }
  if (input.startsOn && input.endsOn && input.endsOn < input.startsOn) {
    problems.push({ field: "endsOn", message: "The end date is before the start date." })
  }
  return problems
}

function sampleAmount(name: string, value: string): string {
  const v = (value ?? "").trim() || "0"
  if (!MONEY.test(v)) {
    throw new PreviewInputError("PREVIEW_AMOUNT_INVALID", `${name} must be an amount in rupees (up to 2 decimals).`)
  }
  return moneyString(v)
}

export function previewCharges(rule: PreviewRuleInput, sampleIn: PreviewSample): ChargePreview {
  const problems = policyAmountProblems({
    type: rule.type,
    rate: rule.rate,
    fixedAmount: rule.fixedAmount,
    maxAmount: rule.maxAmount,
  })
  if (problems.length) {
    throw new PreviewInputError("PREVIEW_RULE_INVALID", problems.map((p) => p.message).join(" "))
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sampleIn.asOf)) {
    throw new PreviewInputError("PREVIEW_DATE_INVALID", "Choose the date to evaluate the rule on.")
  }
  if (rule.kind === "penalty" && rule.trigger === "DUE_DATE_PASSED" && !rule.dueDate) {
    throw new PreviewInputError("PREVIEW_DUE_DATE_REQUIRED", "A due-date penalty needs a due date.")
  }
  const sample = {
    propertyTax: sampleAmount("Property tax", sampleIn.propertyTax),
    waterTax: sampleAmount("Water tax", sampleIn.waterTax),
    drainageTax: sampleAmount("Drainage tax", sampleIn.drainageTax),
    previousPropertyTax: sampleAmount("Previous property tax", sampleIn.previousPropertyTax),
    previousWaterTax: sampleAmount("Previous water tax", sampleIn.previousWaterTax),
    previousDrainageTax: sampleAmount("Previous drainage tax", sampleIn.previousDrainageTax),
    alreadyPaid: sampleAmount("Amount already paid", sampleIn.alreadyPaid),
  }
  const asOf = new Date(`${sampleIn.asOf}T12:00:00+05:30`)
  const category = rule.taxCategory
  const common = {
    active: true,
    category,
    policyId: "preview",
    rate: rule.type === "PERCENTAGE" ? (rule.rate ?? "0") : "0",
    fixedAmount: rule.type === "FIXED_AMOUNT" ? (rule.fixedAmount ?? "0") : "0",
    includePropertyTax: category === "PROPERTY_TAX",
    includeWaterTax: category === "WATER_TAX",
    includeDrainageTax: category === "DRAINAGE_TAX",
    includeArrears: rule.includeArrears,
    maxAmount: rule.maxAmount?.trim() ? rule.maxAmount : null,
  }
  const rebateRules: CategoryRebateRule[] =
    rule.kind === "rebate"
      ? [{ ...common, type: rule.type, includePenalty: rule.includePenalty === true, includeInterest: false }]
      : []
  const penaltyRules: CategoryPenaltyRule[] =
    rule.kind === "penalty"
      ? [
          {
            ...common,
            type: rule.type === "PERCENTAGE" ? "PERCENT_OF_ELIGIBLE_BASE" : "FIXED_AMOUNT",
            trigger: rule.trigger ?? "ON_ASSESSMENT",
            dueDate: rule.dueDate ? new Date(`${rule.dueDate}T00:00:00.000Z`) : null,
            graceDays: Math.max(0, Math.trunc(rule.graceDays ?? 0)),
            applyAfterRebate: rule.applyAfterRebate === true,
          },
        ]
      : []

  // Same engine as demand publication. The tax-config penalty is left at 0 so
  // the preview shows only the effect of the rule being configured.
  const charges = resolveCategoryCharges({
    asOf,
    propertyTax: sample.propertyTax,
    waterTax: sample.waterTax,
    drainageTax: sample.drainageTax,
    interest: "0.00",
    taxConfigPenalty: "0.00",
    previousArrears: sumMoney([
      sample.previousPropertyTax,
      sample.previousWaterTax,
      sample.previousDrainageTax,
    ]).toFixed(2),
    previousByCategory: {
      PROPERTY_TAX: sample.previousPropertyTax,
      WATER_TAX: sample.previousWaterTax,
      DRAINAGE_TAX: sample.previousDrainageTax,
    },
    rebateRules,
    penaltyRules,
  })
  if (charges.breakdown.mode !== "CATEGORY") {
    throw new PreviewInputError("PREVIEW_FAILED", "The rule could not be evaluated.")
  }
  const line = charges.breakdown.lines.find((l) => l.category === category)!
  const label = LABEL[category]
  const base = rule.kind === "rebate" ? line.rebateBase : line.penaltyBase
  const amount = rule.kind === "rebate" ? line.rebate : line.penalty

  const parts = [`current ${label} ${inr(line.component)}`]
  if (rule.includeArrears) parts.push(`unpaid previous-year ${label} ${inr(line.previousArrears)}`)
  if (rule.kind === "rebate" && rule.includePenalty) parts.push(`${label} penalty ${inr(line.penalty)}`)
  const explanation = rule.includeArrears
    ? `Eligible amount = ${parts.join(" + ")}. Other taxes are not included.`
    : `Eligible amount = ${parts.join(" + ")}. Previous-year arrears and other taxes are not included because this rule does not cover them.`

  const steps: PreviewStep[] = [
    { label: `Eligible ${label}`, formula: parts.join(" + "), amount: base },
  ]
  let applies = true
  let reason = ""
  const gated =
    rule.kind === "penalty" &&
    rule.trigger === "DUE_DATE_PASSED" &&
    money(amount).eq(0) &&
    money(base).gt(0)
  if (gated) {
    applies = false
    reason = `Not applied: the due date ${rule.dueDate}${rule.graceDays ? ` plus ${rule.graceDays} grace day(s)` : ""} has not passed on ${sampleIn.asOf}.`
    steps.push({ label: "Penalty", formula: "Due date not yet passed", amount: "0.00" })
  } else if (money(base).eq(0)) {
    applies = false
    reason = `Not applied: there is no ${label} to apply this rule to.`
    steps.push({ label: rule.kind === "rebate" ? "Rebate" : "Penalty", formula: "Nothing eligible", amount: "0.00" })
  } else {
    const raw =
      rule.type === "PERCENTAGE"
        ? money(dec(base).mul(rule.rate ?? "0").div(100))
        : money(rule.fixedAmount ?? "0")
    steps.push({
      label: rule.kind === "rebate" ? "Rebate before limits" : "Penalty before limits",
      formula:
        rule.type === "PERCENTAGE"
          ? `${inr(base)} × ${rule.rate}% ÷ 100`
          : `Fixed amount ${inr(rule.fixedAmount ?? "0")}`,
      amount: moneyString(raw),
    })
    if (!raw.eq(money(amount))) {
      const limits: string[] = []
      if (common.maxAmount && money(common.maxAmount).lt(raw)) limits.push(`maximum ${inr(common.maxAmount)}`)
      if (rule.kind === "rebate" && money(base).lt(raw)) limits.push(`cannot exceed the eligible amount ${inr(base)}`)
      steps.push({ label: "After limits", formula: limits.join("; ") || "limit applied", amount })
    }
    reason =
      rule.kind === "rebate"
        ? `Applies: ${label} is eligible under this rule.`
        : `Applies: ${label} is subject to this penalty${rule.trigger === "DUE_DATE_PASSED" ? " because the due date has passed" : ""}.`
  }

  const original = sumMoney([sample.propertyTax, sample.waterTax, sample.drainageTax])
  const previous = sumMoney([sample.previousPropertyTax, sample.previousWaterTax, sample.previousDrainageTax])
  const payable = subMoney(sumMoney([original, previous, charges.penalty]), charges.rebateAmount)
  const outstanding = subMoney(payable, sample.alreadyPaid)
  steps.push({
    label: "Payable before payments",
    formula: `${inr(moneyString(original))} current + ${inr(moneyString(previous))} arrears + ${inr(charges.penalty)} penalty − ${inr(charges.rebateAmount)} rebate`,
    amount: moneyString(payable),
  })

  return {
    estimate: true,
    taxCategory: category,
    kind: rule.kind,
    eligibleBase: base,
    eligibleExplanation: explanation,
    ruleAmount: amount,
    applies,
    reason,
    steps,
    line,
    totals: {
      originalDemand: moneyString(original),
      previousArrears: moneyString(previous),
      rebate: charges.rebateAmount,
      penalty: charges.penalty,
      payableBeforePayment: moneyString(payable),
      alreadyPaid: sample.alreadyPaid,
      outstanding: moneyString(outstanding),
    },
    roundingRule: ROUNDING_RULE,
  }
}
