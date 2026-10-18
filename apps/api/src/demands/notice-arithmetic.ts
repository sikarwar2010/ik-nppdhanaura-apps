import { money, moneyString, subMoney, sumMoney } from "./money"

export class DemandArithmeticError extends Error {
  readonly gap: string

  constructor(gap: string) {
    super(
      `Demand notice components do not reconcile. Gap of ${gap} is not explained by the configured penalty.`
    )
    this.name = "DemandArithmeticError"
    this.gap = gap
  }
}

/**
 * Property + water + drainage + penalty must equal the stated demand.
 * The historical ₹240 gap is reconciled only when it equals the configured penalty.
 */
export function reconcileComponentTotal(input: {
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  totalDemand: string
}): { gap: string; reconciled: true } {
  const parts = sumMoney([
    input.propertyTax,
    input.waterTax,
    input.drainageTax,
  ])
  const gap = subMoney(input.totalDemand, parts)
  const withPenalty = money(parts.plus(input.penalty))
  if (
    !gap.eq(money(input.penalty)) ||
    !withPenalty.eq(money(input.totalDemand))
  ) {
    throw new DemandArithmeticError(moneyString(gap))
  }
  return { gap: moneyString(gap), reconciled: true }
}
