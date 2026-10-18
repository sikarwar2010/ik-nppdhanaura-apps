import { Prisma } from "@prisma/client"

export type MoneyInput = Prisma.Decimal.Value

const HALF_UP = Prisma.Decimal.ROUND_HALF_UP

export function dec(value: MoneyInput): Prisma.Decimal {
  return new Prisma.Decimal(value)
}

/** Half-up to paise. Matches the existing roundMoney rule for non-negative amounts. */
export function money(value: MoneyInput): Prisma.Decimal {
  return dec(value).toDecimalPlaces(2, HALF_UP)
}

export function moneyString(value: MoneyInput): string {
  return money(value).toFixed(2)
}

export function moneyToNumber(value: MoneyInput): number {
  return money(value).toNumber()
}

export function addMoney(a: MoneyInput, b: MoneyInput): Prisma.Decimal {
  return money(dec(a).plus(dec(b)))
}

export function subMoney(a: MoneyInput, b: MoneyInput): Prisma.Decimal {
  return money(dec(a).minus(dec(b)))
}

export function sumMoney(values: MoneyInput[]): Prisma.Decimal {
  const total = values.reduce<Prisma.Decimal>(
    (sum, value) => sum.plus(dec(value)),
    new Prisma.Decimal(0)
  )
  return money(total)
}

export function minMoney(a: MoneyInput, b: MoneyInput): Prisma.Decimal {
  const left = money(a)
  const right = money(b)
  return left.lte(right) ? left : right
}

export function isPositiveMoney(value: MoneyInput): boolean {
  return money(value).gt(0)
}

export function isZeroMoney(value: MoneyInput): boolean {
  return money(value).eq(0)
}

export function exceedsMoney(value: MoneyInput, limit: MoneyInput): boolean {
  return money(value).gt(money(limit))
}
