import type { computePublicDuesPayload } from "../../public-property-tax/dues.util"

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
  propertyUse: string | null
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
  propertyTax: number
  waterTax: number
  drainageTax: number
  totalDemand: number
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
    dues.city ?? "Nagar Panchayat Chhata",
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
  options?: { noticeDate?: Date; mobileDisplay?: string }
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
    propertyUse: dues.propertyUse,
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
    propertyTax: dues.tax.propertyTax,
    waterTax: dues.tax.waterTax,
    drainageTax: dues.tax.drainageTax,
    totalDemand: dues.tax.totalDemand,
  }
}
