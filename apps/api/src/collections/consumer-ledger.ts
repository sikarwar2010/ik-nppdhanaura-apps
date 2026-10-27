import {
  dec,
  money,
  moneyString,
  sumMoney,
  type MoneyInput,
} from "../demands/money"
import {
  allocationCounts,
  allocationMatchesHistoricalSource,
  ownOutstanding,
  splitPaymentByComponent,
  zeroComponentAmounts,
  type ComponentAmounts,
} from "../demands/outstanding"

/**
 * Consumer ledger: every financial event on a property in date order with a
 * running balance. Built from the same rows the outstanding engine reads, so
 * the closing balance must equal the engine's outstanding; `reconciles`
 * reports whether it does. Nothing here writes or corrects records.
 */

export type LedgerEntryType =
  | "DEMAND"
  | "OPENING_BALANCE"
  | "REBATE"
  | "HISTORICAL_PAYMENTS"
  | "CREDIT"
  | "DEBIT"
  | "PAYMENT"
  | "PAYMENT_REVERSAL"
  | "PENDING_PAYMENT"

export type LedgerEntryStatus = "POSTED" | "REVERSED" | "PENDING" | "UNVERIFIED"

export type LedgerAllocationInput = {
  id: string
  amount: MoneyInput
  status: "ACTIVE" | "REVERSED"
  createdAt: Date
  reversedAt: Date | null
  payment: {
    id: string
    status: string
    receiptNumber: string | null
    paymentReference: string | null
    gatewayReference: string | null
    remarks: string | null
    paymentMode: string
    collectionDate: Date | null
    createdAt: Date
    collectedByName: string | null
    chequeDdReference: string | null
    reversedAt: Date | null
    reversalReason: string | null
    /** Tax-wise split stored on the receipt when it was issued, if any. */
    postedParts: ComponentAmounts | null
  }
}

export type LedgerDemandInput = {
  id: string
  assessmentYearId: string
  assessmentYearCode: string
  assessmentYearName: string
  demandReference: string
  publishedAt: Date
  verificationStatus: "VERIFIED" | "UNVERIFIED"
  balanceKind: "COMPONENTS" | "CLOSING_ONLY"
  propertyTax: MoneyInput
  waterTax: MoneyInput
  drainageTax: MoneyInput
  penalty: MoneyInput
  interest: MoneyInput
  currentYearDemand: MoneyInput
  rebateAmount: MoneyInput
  historicalPayments: MoneyInput
  sourceReference: string | null
  publishedByName: string | null
  adjustments: Array<{
    id: string
    kind: "CREDIT" | "DEBIT"
    amount: MoneyInput
    reason: string
    createdAt: Date
    createdByName: string | null
  }>
  allocations: LedgerAllocationInput[]
}

export type PendingPaymentInput = {
  id: string
  amount: MoneyInput
  paymentMode: string
  collectionDate: Date | null
  createdAt: Date
  collectedByName: string | null
  chequeDdReference: string | null
  assessmentYearCode: string | null
  assessmentYearName: string | null
}

export type LedgerEntry = {
  id: string
  at: string
  type: LedgerEntryType
  status: LedgerEntryStatus
  assessmentYearCode: string | null
  assessmentYearName: string | null
  demandReference: string | null
  receiptNumber: string | null
  paymentId: string | null
  paymentMode: string | null
  reference: string | null
  collector: string | null
  description: string
  /** Increases what is owed. */
  debit: string
  /** Reduces what is owed (payment, rebate, credit). */
  credit: string
  parts: ComponentAmounts
  /** False for unverified history and pending instruments: shown, not counted. */
  counted: boolean
  yearBalanceAfter: string | null
  balanceAfter: string
}

export type LedgerYearSummary = {
  assessmentYearId: string
  assessmentYearCode: string
  assessmentYearName: string
  verificationStatus: "VERIFIED" | "UNVERIFIED"
  balanceKind: "COMPONENTS" | "CLOSING_ONLY"
  openingBalance: string
  demand: string
  rebateAndCredits: string
  penaltyAndInterest: string
  payments: string
  outstanding: string
  closingBalance: string
}

const TYPE_ORDER: Record<LedgerEntryType, number> = {
  OPENING_BALANCE: 0,
  DEMAND: 1,
  REBATE: 2,
  HISTORICAL_PAYMENTS: 3,
  DEBIT: 4,
  CREDIT: 5,
  PAYMENT: 6,
  PAYMENT_REVERSAL: 7,
  PENDING_PAYMENT: 8,
}

function partsOf(input: Partial<Record<keyof ComponentAmounts, MoneyInput>>): ComponentAmounts {
  const out = zeroComponentAmounts()
  for (const key of Object.keys(out) as Array<keyof ComponentAmounts>) {
    out[key] = moneyString(input[key] ?? 0)
  }
  return out
}

function negateParts(parts: ComponentAmounts): ComponentAmounts {
  const out = zeroComponentAmounts()
  for (const key of Object.keys(out) as Array<keyof ComponentAmounts>) {
    out[key] = moneyString(dec(parts[key]).negated())
  }
  return out
}

type Draft = Omit<LedgerEntry, "yearBalanceAfter" | "balanceAfter">

export function buildConsumerLedger(input: {
  demands: LedgerDemandInput[]
  pendingPayments?: PendingPaymentInput[]
}): {
  entries: LedgerEntry[]
  years: LedgerYearSummary[]
  closingBalance: string
  engineOutstanding: string
  reconciles: boolean
} {
  const drafts: Draft[] = []
  const years: LedgerYearSummary[] = []
  const engineParts: string[] = []

  const ordered = [...input.demands].sort((a, b) =>
    a.assessmentYearCode.localeCompare(b.assessmentYearCode)
  )
  for (const demand of ordered) {
    const verified = demand.verificationStatus === "VERIFIED"
    const yearFields = {
      assessmentYearCode: demand.assessmentYearCode,
      assessmentYearName: demand.assessmentYearName,
      demandReference: demand.demandReference,
    }
    const components = {
      propertyTax: demand.propertyTax,
      waterTax: demand.waterTax,
      drainageTax: demand.drainageTax,
      penalty: demand.penalty,
      interest: sumMoney([
        demand.interest,
        ...demand.adjustments.filter((a) => a.kind === "DEBIT").map((a) => a.amount),
      ]),
    }
    const closingOnly = demand.balanceKind === "CLOSING_ONLY"
    drafts.push({
      id: `demand:${demand.id}`,
      at: demand.publishedAt.toISOString(),
      type: closingOnly ? "OPENING_BALANCE" : "DEMAND",
      status: verified ? "POSTED" : "UNVERIFIED",
      ...yearFields,
      receiptNumber: null,
      paymentId: null,
      paymentMode: null,
      reference: demand.sourceReference,
      collector: demand.publishedByName,
      description: closingOnly
        ? "Verified historical closing balance"
        : "Assessment-year demand published",
      debit: moneyString(sumMoney([demand.currentYearDemand, demand.interest])),
      credit: "0.00",
      parts: closingOnly
        ? partsOf({ propertyTax: demand.currentYearDemand })
        : partsOf({
            propertyTax: demand.propertyTax,
            waterTax: demand.waterTax,
            drainageTax: demand.drainageTax,
            penalty: demand.penalty,
            interest: demand.interest,
          }),
      counted: verified,
    })

    // Replay what settled the year, in date order, to show each payment's split.
    let applied = money(0)
    if (money(demand.rebateAmount).gt(0)) {
      const split = splitPaymentByComponent(components, applied, demand.rebateAmount)
      applied = money(applied.plus(demand.rebateAmount))
      drafts.push({
        id: `rebate:${demand.id}`,
        at: demand.publishedAt.toISOString(),
        type: "REBATE",
        status: verified ? "POSTED" : "UNVERIFIED",
        ...yearFields,
        receiptNumber: null,
        paymentId: null,
        paymentMode: null,
        reference: null,
        collector: demand.publishedByName,
        description: "Approved rebate applied when the demand was published",
        debit: "0.00",
        credit: moneyString(demand.rebateAmount),
        parts: negateParts(split.parts),
        counted: verified,
      })
    }
    if (money(demand.historicalPayments).gt(0)) {
      const split = splitPaymentByComponent(components, applied, demand.historicalPayments)
      applied = money(applied.plus(demand.historicalPayments))
      drafts.push({
        id: `historical:${demand.id}`,
        at: demand.publishedAt.toISOString(),
        type: "HISTORICAL_PAYMENTS",
        status: verified ? "POSTED" : "UNVERIFIED",
        ...yearFields,
        receiptNumber: null,
        paymentId: null,
        paymentMode: null,
        reference: demand.sourceReference,
        collector: demand.publishedByName,
        description: "Payments recorded in the historical register",
        debit: "0.00",
        credit: moneyString(demand.historicalPayments),
        parts: negateParts(split.parts),
        counted: verified,
      })
    }

    type Event =
      | { at: Date; order: number; kind: "adjustment"; row: LedgerDemandInput["adjustments"][number] }
      | { at: Date; order: number; kind: "allocation"; row: LedgerAllocationInput }
    const events: Event[] = [
      ...demand.adjustments.map((row) => ({
        at: row.createdAt,
        order: row.kind === "DEBIT" ? TYPE_ORDER.DEBIT : TYPE_ORDER.CREDIT,
        kind: "adjustment" as const,
        row,
      })),
      ...demand.allocations.map((row) => ({
        at: row.payment.collectionDate ?? row.createdAt,
        order: TYPE_ORDER.PAYMENT,
        kind: "allocation" as const,
        row,
      })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime() || a.order - b.order)

    for (const event of events) {
      if (event.kind === "adjustment") {
        const row = event.row
        const isCredit = row.kind === "CREDIT"
        const split = isCredit
          ? splitPaymentByComponent(components, applied, row.amount).parts
          : partsOf({ interest: row.amount })
        if (isCredit) applied = money(applied.plus(row.amount))
        drafts.push({
          id: `adjustment:${row.id}`,
          at: row.createdAt.toISOString(),
          type: isCredit ? "CREDIT" : "DEBIT",
          status: verified ? "POSTED" : "UNVERIFIED",
          ...yearFields,
          receiptNumber: null,
          paymentId: null,
          paymentMode: null,
          reference: null,
          collector: row.createdByName,
          description: `${isCredit ? "Approved credit" : "Approved charge"}: ${row.reason}`,
          debit: isCredit ? "0.00" : moneyString(row.amount),
          credit: isCredit ? moneyString(row.amount) : "0.00",
          parts: isCredit ? negateParts(split) : split,
          counted: verified,
        })
        continue
      }
      const row = event.row
      const payment = row.payment
      const inHistorical = allocationMatchesHistoricalSource(demand.sourceReference, {
        paymentReference: payment.paymentReference,
        receiptNumber: payment.receiptNumber,
        gatewayReference: payment.gatewayReference,
        remarks: payment.remarks,
      })
      const active = allocationCounts(row.status, payment.status)
      const wasPosted = row.status === "REVERSED" || active
      if (!wasPosted) continue
      const parts =
        payment.postedParts ?? splitPaymentByComponent(components, applied, row.amount).parts
      if (active && !inHistorical) applied = money(applied.plus(row.amount))
      const base = {
        ...yearFields,
        receiptNumber: payment.receiptNumber,
        paymentId: payment.id,
        paymentMode: payment.paymentMode,
        reference: payment.chequeDdReference,
        collector: payment.collectedByName,
      }
      drafts.push({
        id: `allocation:${row.id}`,
        at: event.at.toISOString(),
        type: "PAYMENT",
        status: !verified ? "UNVERIFIED" : row.status === "REVERSED" ? "REVERSED" : "POSTED",
        ...base,
        description: inHistorical
          ? "Payment already included in the historical register (not counted again)"
          : "Payment received",
        debit: "0.00",
        credit: moneyString(row.amount),
        parts: negateParts(parts),
        counted: verified && !inHistorical,
      })
      if (row.status === "REVERSED") {
        drafts.push({
          id: `reversal:${row.id}`,
          at: (payment.reversedAt ?? row.reversedAt ?? event.at).toISOString(),
          type: "PAYMENT_REVERSAL",
          status: verified ? "POSTED" : "UNVERIFIED",
          ...base,
          description: `Payment reversed${payment.reversalReason ? `: ${payment.reversalReason}` : ""}`,
          debit: moneyString(row.amount),
          credit: "0.00",
          parts,
          counted: verified && !inHistorical,
        })
      }
    }

    const credits = sumMoney(
      demand.adjustments.filter((a) => a.kind === "CREDIT").map((a) => a.amount)
    )
    const debits = sumMoney(
      demand.adjustments.filter((a) => a.kind === "DEBIT").map((a) => a.amount)
    )
    const payments = sumMoney([
      demand.historicalPayments,
      ...demand.allocations
        .filter((a) => allocationCounts(a.status, a.payment.status))
        .filter(
          (a) =>
            !allocationMatchesHistoricalSource(demand.sourceReference, {
              paymentReference: a.payment.paymentReference,
              receiptNumber: a.payment.receiptNumber,
              gatewayReference: a.payment.gatewayReference,
              remarks: a.payment.remarks,
            })
        )
        .map((a) => a.amount),
    ])
    const outstanding = ownOutstanding({
      currentYearDemand: moneyString(demand.currentYearDemand),
      interest: moneyString(demand.interest),
      credits: moneyString(credits),
      debits: moneyString(debits),
      payments: moneyString(payments),
      rebate: moneyString(demand.rebateAmount),
    })
    if (verified) engineParts.push(outstanding)
    years.push({
      assessmentYearId: demand.assessmentYearId,
      assessmentYearCode: demand.assessmentYearCode,
      assessmentYearName: demand.assessmentYearName,
      verificationStatus: demand.verificationStatus,
      balanceKind: demand.balanceKind,
      openingBalance: "0.00",
      demand: closingOnly
        ? moneyString(demand.currentYearDemand)
        : moneyString(
            sumMoney([demand.propertyTax, demand.waterTax, demand.drainageTax])
          ),
      rebateAndCredits: moneyString(sumMoney([demand.rebateAmount, credits])),
      penaltyAndInterest: closingOnly
        ? "0.00"
        : moneyString(sumMoney([demand.penalty, demand.interest, debits])),
      payments: moneyString(payments),
      outstanding,
      closingBalance: "0.00",
    })
  }

  for (const pending of input.pendingPayments ?? []) {
    drafts.push({
      id: `pending:${pending.id}`,
      at: (pending.collectionDate ?? pending.createdAt).toISOString(),
      type: "PENDING_PAYMENT",
      status: "PENDING",
      assessmentYearCode: pending.assessmentYearCode,
      assessmentYearName: pending.assessmentYearName,
      demandReference: null,
      receiptNumber: null,
      paymentId: pending.id,
      paymentMode: pending.paymentMode,
      reference: pending.chequeDdReference,
      collector: pending.collectedByName,
      description: "Instrument received; not counted until it is confirmed",
      debit: "0.00",
      credit: moneyString(pending.amount),
      parts: zeroComponentAmounts(),
      counted: false,
    })
  }

  // Carry-forward per year: opening = verified closing of the year before.
  let carry = money(0)
  for (const year of years) {
    year.openingBalance = moneyString(carry)
    year.closingBalance = moneyString(carry.plus(year.outstanding))
    if (year.verificationStatus === "VERIFIED") carry = money(carry.plus(year.outstanding))
  }

  drafts.sort(
    (a, b) =>
      a.at.localeCompare(b.at) ||
      (a.assessmentYearCode ?? "").localeCompare(b.assessmentYearCode ?? "") ||
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
  )
  let balance = money(0)
  const yearBalance = new Map<string, ReturnType<typeof money>>()
  const entries: LedgerEntry[] = drafts.map((draft) => {
    const key = draft.assessmentYearCode ?? ""
    let yearAfter: string | null = null
    if (draft.counted) {
      const delta = dec(draft.debit).minus(draft.credit)
      balance = money(balance.plus(delta))
      const next = money((yearBalance.get(key) ?? money(0)).plus(delta))
      yearBalance.set(key, next)
      yearAfter = moneyString(next)
    } else if (yearBalance.has(key)) {
      yearAfter = moneyString(yearBalance.get(key)!)
    }
    return { ...draft, yearBalanceAfter: yearAfter, balanceAfter: moneyString(balance) }
  })

  const engineOutstanding = moneyString(sumMoney(engineParts))
  const closingBalance = moneyString(balance)
  return {
    entries,
    years,
    closingBalance,
    engineOutstanding,
    reconciles: money(closingBalance).eq(money(engineOutstanding)),
  }
}

export type LedgerFilter = {
  assessmentYearCode?: string
  dateFrom?: string
  dateTo?: string
  category?: "propertyTax" | "waterTax" | "drainageTax" | "penalty" | "interest"
  status?: LedgerEntryStatus
}

/** Filters after balances are computed, so running balances stay true. Dates are YYYY-MM-DD (IST). */
export function filterLedgerEntries(entries: LedgerEntry[], filter: LedgerFilter): LedgerEntry[] {
  const from = filter.dateFrom ? new Date(`${filter.dateFrom}T00:00:00+05:30`).getTime() : null
  const to = filter.dateTo ? new Date(`${filter.dateTo}T00:00:00+05:30`).getTime() + 86_400_000 : null
  return entries.filter((entry) => {
    if (filter.assessmentYearCode && entry.assessmentYearCode !== filter.assessmentYearCode) return false
    const at = new Date(entry.at).getTime()
    if (from !== null && at < from) return false
    if (to !== null && at >= to) return false
    if (filter.status && entry.status !== filter.status) return false
    if (filter.category && money(entry.parts[filter.category]).eq(0)) return false
    return true
  })
}
