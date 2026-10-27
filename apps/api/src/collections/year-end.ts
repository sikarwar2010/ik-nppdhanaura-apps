import { money, moneyString, subMoney, sumMoney, type MoneyInput } from "../demands/money"

/**
 * Year-end carry-forward reconciliation. Arrears are never copied into the
 * next year: the next year's opening arrears are always computed from the
 * earlier years' own unpaid balances. This report proves that chain and
 * lists what still needs attention before a year is closed.
 */

export type YearEndLine = {
  surveyId: string
  yearCode: string
  /** Current-year demand + interest + approved debits. */
  demand: MoneyInput
  rebate: MoneyInput
  credits: MoneyInput
  /** Allocated payments plus historical payments. */
  payments: MoneyInput
  ownOutstanding: MoneyInput
}

export type YearEndYearRow = {
  yearCode: string
  properties: number
  openingArrears: string
  demand: string
  rebateAndCredits: string
  payments: string
  ownOutstanding: string
  closingBalance: string
  /**
   * Closing = opening + demand − rebates/credits − payments, recomputed from
   * the components (independent of the stored own-outstanding figure), and
   * opening equals the previous row's closing.
   */
  chainOk: boolean
}

export type YearEndFlags = {
  unverifiedDemands: number
  unverifiedAmount: string
  pendingInstruments: number
  pendingAmount: string
  paymentsWithoutDemand: number
  unassignedPayments: number
  /** Properties with a later-year demand but no verified demand for the closing year. */
  gapProperties: number
}

export type NextYearCheck = {
  yearCode: string
  demandsPublished: number
  /** Opening arrears stored on next-year demands when they were published. */
  storedOpeningArrears: string
  /** The same properties' carry-forward computed from today's records. */
  currentCarryForward: string
  difference: string
  mismatchedProperties: number
  explanation: string
}

export type YearEndReport = {
  yearCode: string
  rows: YearEndYearRow[]
  openingArrears: string
  demand: string
  rebateAndCredits: string
  payments: string
  ownOutstanding: string
  closingCarryForward: string
  propertiesWithArrears: number
  chainOk: boolean
  nextYear: NextYearCheck | null
  flags: YearEndFlags
  blockingIssues: string[]
}

export function buildYearEndReport(input: {
  yearCode: string
  lines: YearEndLine[]
  nextYear?: {
    yearCode: string
    storedOpening: Array<{ surveyId: string; openingArrears: MoneyInput }>
  } | null
  flags: YearEndFlags
}): YearEndReport {
  const upTo = input.lines.filter((line) => line.yearCode.localeCompare(input.yearCode) <= 0)
  const codes = [...new Set(upTo.map((line) => line.yearCode))].sort()
  const rows: YearEndYearRow[] = []
  let carry = money(0)
  let previousClosing = money(0)
  for (const code of codes) {
    const year = upTo.filter((line) => line.yearCode === code)
    const own = sumMoney(year.map((line) => line.ownOutstanding))
    const demand = sumMoney(year.map((line) => line.demand))
    const reductions = sumMoney(year.flatMap((line) => [line.rebate, line.credits]))
    const payments = sumMoney(year.map((line) => line.payments))
    const opening = carry
    const closing = money(opening.plus(own))
    const recomputed = money(opening.plus(demand).minus(reductions).minus(payments))
    rows.push({
      yearCode: code,
      properties: new Set(year.map((line) => line.surveyId)).size,
      openingArrears: moneyString(opening),
      demand: moneyString(demand),
      rebateAndCredits: moneyString(reductions),
      payments: moneyString(payments),
      ownOutstanding: moneyString(own),
      closingBalance: moneyString(closing),
      chainOk: opening.eq(previousClosing) && recomputed.eq(closing),
    })
    carry = closing
    previousClosing = closing
  }
  const selected = rows.find((row) => row.yearCode === input.yearCode)
  const perProperty = new Map<string, ReturnType<typeof money>>()
  for (const line of upTo) {
    perProperty.set(
      line.surveyId,
      money((perProperty.get(line.surveyId) ?? money(0)).plus(line.ownOutstanding))
    )
  }

  let nextYear: NextYearCheck | null = null
  if (input.nextYear) {
    let stored = money(0)
    let current = money(0)
    let mismatched = 0
    for (const row of input.nextYear.storedOpening) {
      const carryNow = perProperty.get(row.surveyId) ?? money(0)
      stored = money(stored.plus(row.openingArrears))
      current = money(current.plus(carryNow))
      if (!money(row.openingArrears).eq(carryNow)) mismatched += 1
    }
    const difference = subMoney(stored, current)
    nextYear = {
      yearCode: input.nextYear.yearCode,
      demandsPublished: input.nextYear.storedOpening.length,
      storedOpeningArrears: moneyString(stored),
      currentCarryForward: moneyString(current),
      difference: moneyString(difference),
      mismatchedProperties: mismatched,
      explanation:
        mismatched === 0
          ? "Next-year opening arrears match the closing balances."
          : "Payments, credits or reversals were posted against earlier years after the next-year demand was published. Balances and notices use the current figures; the stored figure is the value at publication.",
    }
  }

  const blockingIssues: string[] = []
  if (input.flags.unverifiedDemands > 0) {
    blockingIssues.push(
      `${input.flags.unverifiedDemands} historical balance(s) are not verified and are excluded from the carry-forward.`
    )
  }
  if (input.flags.pendingInstruments > 0) {
    blockingIssues.push(
      `${input.flags.pendingInstruments} cheque/draft/transfer payment(s) are still pending.`
    )
  }
  if (input.flags.paymentsWithoutDemand > 0) {
    blockingIssues.push(
      `${input.flags.paymentsWithoutDemand} successful payment(s) belong to a year with no published demand.`
    )
  }
  if (input.flags.unassignedPayments > 0) {
    blockingIssues.push(
      `${input.flags.unassignedPayments} successful payment(s) have no assessment year and are not allocated.`
    )
  }
  if (input.flags.gapProperties > 0) {
    blockingIssues.push(
      `${input.flags.gapProperties} propert(ies) have a later demand but no verified balance for this year.`
    )
  }

  return {
    yearCode: input.yearCode,
    rows,
    openingArrears: selected?.openingArrears ?? moneyString(carry),
    demand: selected?.demand ?? "0.00",
    rebateAndCredits: selected?.rebateAndCredits ?? "0.00",
    payments: selected?.payments ?? "0.00",
    ownOutstanding: selected?.ownOutstanding ?? "0.00",
    closingCarryForward: moneyString(carry),
    propertiesWithArrears: [...perProperty.values()].filter((value) => value.gt(0)).length,
    chainOk: rows.every((row) => row.chainOk),
    nextYear,
    flags: input.flags,
    blockingIssues,
  }
}
