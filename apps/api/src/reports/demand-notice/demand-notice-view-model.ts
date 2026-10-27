import type { computePublicDuesPayload } from "../../public-property-tax/dues.util"
import { MUNICIPALITY } from "../../common/municipality"
import { dec } from "../../demands/money"
import {
  DemandArithmeticError,
  reconcileComponentTotal,
} from "../../demands/notice-arithmetic"

export type PropertyTaxDemandNoticeFloorRow = {
  floorLabel: string
  usageType: string
  usageFactor: string
  construction: string
  areaSqFt: number
  rate: number
  alv: number
  tax: number
}

export type PropertyTaxDemandNoticeViewModel = {
  surveyId: string
  noticeDate: string
  assessmentYear: string
  wardNumber: number
  wardName: string
  taxRateZone: string | null
  roadType: string | null
  monthlyBaseRateLabel: string
  houseNo: string | null
  propertyNo: string | null
  parcelNo: string | null
  propertyType: string | null
  /** Display name; blank owner becomes "N/A". */
  ownerName: string
  ownerFatherName: string | null
  /** Masked for notice display (parity with existing template). */
  mobileDisplay: string
  address: string
  floors: PropertyTaxDemandNoticeFloorRow[]
  totalArea: number
  totalAlv: number
  totalFloorTax: number
  propertyTaxPct: number
  waterTaxPct: number
  drainageTaxPct: number
  penaltyPct: number
  propertyTax: number
  waterTax: number
  drainageTax: number
  penalty: number
  totalDemand: number
  ledger: NoticeLedger
}

export type NoticeArrearYear = {
  assessmentYear: string
  propertyTax: number | null
  waterTax: number | null
  drainageTax: number | null
  penalty: number | null
  interest: number | null
  rebate: number
  payments: number
  credits: number
  outstanding: number
  componentDetail: boolean
}

export type NoticeLedger = {
  years: NoticeArrearYear[]
  previousArrears: number
  previousPropertyTax: number
  previousWaterTax: number
  previousDrainageTax: number
  previousPenaltyInterest: number
  previousRebatesCredits: number
  previousPayments: number
  historicalOpeningArrears: number
  hasHistoricalOpening: boolean
  currentYearDemand: number
  penalty: number
  interest: number
  otherCharges: number
  grossEligibleDemand: number
  rebateAmount: number
  rebateScope: string
  approvedCredits: number
  totalPayable: number
  paymentsAllocated: number
  paymentsAndCreditsApplied: number
  netOutstanding: number
  authoritative: boolean
  warning: string | null
}

type DuesPayload = ReturnType<typeof computePublicDuesPayload>

function formatNoticeDate(date = new Date()): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function buildAddress(dues: DuesPayload): string {
  const parts = [
    dues.houseNo,
    dues.streetName,
    dues.locality,
    dues.colony,
    dues.city ?? MUNICIPALITY.town,
    dues.pincode,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "—"
}

function money(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function duesPayloadToNoticeViewModel(
  dues: DuesPayload,
  options?: {
    noticeDate?: Date
    mobileDisplay?: string
    propertyType?: string | null
    ledger?: NoticeLedger
    snapshot?: {
      propertyTax: number
      waterTax: number
      drainageTax: number
      penalty: number
      totalDemand: number
    }
  }
): PropertyTaxDemandNoticeViewModel {
  const floors = dues.floors.map((f) => ({
    floorLabel: f.floorLabel,
    usageType: f.usageType,
    usageFactor: f.usageFactor,
    construction: f.construction,
    areaSqFt: f.areaSqFt,
    rate: f.rate,
    alv: f.alv,
    tax: f.tax,
  }))
  const annualBaseRate = dues.tax.annualBaseRate
  const monthlyBaseRateLabel =
    annualBaseRate != null && annualBaseRate > 0
      ? `₹${money(annualBaseRate)}/sqft/mo`
      : "—"

  const ownerName =
    dues.ownerName && String(dues.ownerName).trim()
      ? String(dues.ownerName).trim()
      : "N/A"

  return {
    surveyId: dues.surveyId,
    noticeDate: formatNoticeDate(options?.noticeDate),
    assessmentYear: dues.assessmentYear.name,
    wardNumber: dues.wardNumber,
    wardName: dues.wardName,
    taxRateZone: dues.taxRateZone,
    roadType: dues.roadType,
    monthlyBaseRateLabel,
    houseNo: dues.houseNo,
    propertyNo: dues.propertyNo,
    parcelNo: dues.parcelNo,
    propertyType: options?.propertyType ?? null,
    ownerName,
    ownerFatherName: dues.ownerFatherName,
    mobileDisplay: options?.mobileDisplay ?? dues.mobileMasked ?? "—",
    address: buildAddress(dues),
    floors,
    totalArea: floors.reduce((s, f) => s + f.areaSqFt, 0),
    totalAlv: floors.reduce((s, f) => s + f.alv, 0),
    totalFloorTax: floors.reduce((s, f) => s + f.tax, 0),
    propertyTaxPct: dues.tax.propertyTaxPct,
    waterTaxPct: dues.tax.waterTaxPct,
    drainageTaxPct: dues.tax.drainageTaxPct,
    penaltyPct: dues.tax.penaltyPct,
    propertyTax: options?.snapshot?.propertyTax ?? dues.tax.propertyTax,
    waterTax: options?.snapshot?.waterTax ?? dues.tax.waterTax,
    drainageTax: options?.snapshot?.drainageTax ?? dues.tax.drainageTax,
    penalty: options?.snapshot?.penalty ?? dues.tax.penalty,
    totalDemand: options?.snapshot?.totalDemand ?? dues.tax.totalDemand,
    ledger:
      options?.ledger ??
      unavailableLedger(dues.tax.totalDemand, dues.tax.penalty),
  }
}

function unavailableLedger(
  currentYearDemand: number,
  penalty: number
): NoticeLedger {
  return {
    years: [],
    previousArrears: 0,
    previousPropertyTax: 0,
    previousWaterTax: 0,
    previousDrainageTax: 0,
    previousPenaltyInterest: 0,
    previousRebatesCredits: 0,
    previousPayments: 0,
    historicalOpeningArrears: 0,
    hasHistoricalOpening: false,
    currentYearDemand,
    penalty,
    interest: 0,
    otherCharges: 0,
    grossEligibleDemand: currentYearDemand,
    rebateAmount: 0,
    rebateScope: "NONE",
    approvedCredits: 0,
    totalPayable: currentYearDemand,
    paymentsAllocated: 0,
    paymentsAndCreditsApplied: 0,
    netOutstanding: currentYearDemand,
    authoritative: false,
    warning:
      "Previous-year balances are not available from the demand ledger. Outstanding arrears are not shown as zero.",
  }
}

export function moneyAmount(value: string): number {
  return Number(value)
}

export function outstandingToNoticeLedger(input: {
  years: Array<{
    assessmentYearName: string
    assessmentYearCode?: string
    originalDemand: string
    propertyTax?: string
    waterTax?: string
    drainageTax?: string
    balanceKind?: "COMPONENTS" | "CLOSING_ONLY"
    penalty?: string
    interest?: string
    rebate?: string
    payments: string
    credits: string
    outstanding: string
  }>
  selectedYearCode?: string
  openingArrears: string
  grossEligibleDemand?: string
  rebateAmount?: string
  rebateScope?: string
  currentYearDemand: string
  penalty: string
  interest: string
  approvedCredits: string
  approvedDebits?: string
  paymentsAllocated: string
  totalPayable: string
  netOutstanding: string
  previousPropertyTaxOutstanding?: string
  previousWaterTaxOutstanding?: string
  previousDrainageTaxOutstanding?: string
  previousPenaltyInterestOutstanding?: string
  previousRebatesCredits?: string
  previousPayments?: string
  historicalOpeningArrears?: string
  authoritative: boolean
  unreconciledYears: Array<{ name: string }>
  missingHistoryYears?: Array<{ name: string }>
  propertyTax: string
  waterTax: string
  drainageTax: string
}): { ledger: NoticeLedger; snapshot: {
  propertyTax: number
  waterTax: number
  drainageTax: number
  penalty: number
  totalDemand: number
} } {
  const missing = input.missingHistoryYears ?? []
  let arithmeticWarning: string | null = null
  try {
    reconcileComponentTotal({
      propertyTax: input.propertyTax,
      waterTax: input.waterTax,
      drainageTax: input.drainageTax,
      penalty: input.penalty,
      totalDemand: input.currentYearDemand,
    })
  } catch (error) {
    arithmeticWarning =
      error instanceof DemandArithmeticError
        ? error.message
        : "Demand components do not reconcile with the stated total."
  }
  const warning = arithmeticWarning
    ? arithmeticWarning
    : !input.authoritative
      ? input.unreconciledYears.length > 0
        ? `Unreconciled assessment years are excluded from the total: ${input.unreconciledYears.map((year) => year.name).join(", ")}. They are not treated as zero.`
        : missing.length > 0
          ? `Verified historical balances are missing for: ${missing.map((year) => year.name).join(", ")}. They are not treated as zero.`
          : "Successful payments without an assessment year are not reconciled. Outstanding balance is not treated as complete."
      : null
  // The notice prints gross − rebate/credits − paid = net; refuse to call it
  // confirmed if those printed figures do not add up.
  if (!arithmeticWarning && input.grossEligibleDemand != null) {
    const net = dec(input.grossEligibleDemand)
      .minus(input.rebateAmount ?? 0)
      .minus(input.approvedCredits)
      .minus(input.paymentsAllocated)
    if (!net.toDecimalPlaces(2).eq(dec(input.netOutstanding).toDecimalPlaces(2))) {
      arithmeticWarning =
        "Gross demand, rebate, credits and payments do not add up to the net amount. The notice is not confirmed."
    }
  }
  const warningText = arithmeticWarning ?? warning
  const applied =
    Number(input.approvedCredits) + Number(input.paymentsAllocated)
  const authoritative = input.authoritative && arithmeticWarning == null
  return {
    snapshot: {
      propertyTax: Number(input.propertyTax),
      waterTax: Number(input.waterTax),
      drainageTax: Number(input.drainageTax),
      penalty: Number(input.penalty),
      totalDemand: Number(input.currentYearDemand),
    },
    ledger: {
      years: input.years
        .filter(
          (year) =>
            !input.selectedYearCode ||
            !year.assessmentYearCode ||
            year.assessmentYearCode < input.selectedYearCode
        )
        .map((year) => {
          const componentDetail = (year.balanceKind ?? "COMPONENTS") === "COMPONENTS"
          return {
            assessmentYear: year.assessmentYearName,
            propertyTax: componentDetail ? Number(year.propertyTax ?? 0) : null,
            waterTax: componentDetail ? Number(year.waterTax ?? 0) : null,
            drainageTax: componentDetail ? Number(year.drainageTax ?? 0) : null,
            penalty: componentDetail ? Number(year.penalty ?? 0) : null,
            interest: componentDetail ? Number(year.interest ?? 0) : null,
            rebate: Number(year.rebate ?? 0),
            payments: Number(year.payments),
            credits: Number(year.credits),
            outstanding: Number(year.outstanding),
            componentDetail,
          }
        }),
      previousArrears: Number(input.openingArrears),
      previousPropertyTax: Number(input.previousPropertyTaxOutstanding ?? 0),
      previousWaterTax: Number(input.previousWaterTaxOutstanding ?? 0),
      previousDrainageTax: Number(input.previousDrainageTaxOutstanding ?? 0),
      previousPenaltyInterest: Number(
        input.previousPenaltyInterestOutstanding ?? 0
      ),
      previousRebatesCredits: Number(input.previousRebatesCredits ?? 0),
      previousPayments: Number(input.previousPayments ?? 0),
      historicalOpeningArrears: Number(input.historicalOpeningArrears ?? 0),
      hasHistoricalOpening: input.years.some(
        (year) =>
          year.balanceKind === "CLOSING_ONLY" &&
          (!input.selectedYearCode ||
            !year.assessmentYearCode ||
            year.assessmentYearCode < input.selectedYearCode)
      ),
      currentYearDemand: Number(input.currentYearDemand),
      penalty: Number(input.penalty),
      interest: Number(input.interest),
      otherCharges: Number(input.approvedDebits ?? 0),
      grossEligibleDemand: Number(
        input.grossEligibleDemand ?? input.totalPayable
      ),
      rebateAmount: Number(input.rebateAmount ?? 0),
      rebateScope: input.rebateScope ?? "NONE",
      approvedCredits: Number(input.approvedCredits),
      totalPayable: Number(input.totalPayable),
      paymentsAllocated: Number(input.paymentsAllocated),
      paymentsAndCreditsApplied: applied,
      netOutstanding: Number(input.netOutstanding),
      authoritative,
      warning: warningText,
    },
  }
}
