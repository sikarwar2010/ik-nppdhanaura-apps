import { moneyString, sumMoney } from "../demands/money"

/**
 * Public, ward-level aggregates only. No owner, mobile, address, property ID,
 * payment or staff field may be added here: the response is published on the
 * municipal website.
 */
export type PublicWardStat = {
  wardNumber: number
  wardName: string
  propertiesSurveyed: number
  propertiesWithPublishedDemand: number
  /** Published demands ÷ surveyed properties, 0–100, or null when nothing is surveyed. */
  demandCoveragePct: number | null
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  rebate: string
  totalDemand: string
  /** Present only when collection disclosure is approved. */
  collected?: string
  outstanding?: string
}

export type PublicWardStatsResponse = {
  assessmentYear: { id: string; code: string; name: string } | null
  years: Array<{ id: string; code: string; name: string }>
  generatedAt: string
  basis: string
  disclosure: { collections: boolean }
  /** No ward boundary geometry exists in the system yet. */
  geometryAvailable: false
  totals: Omit<PublicWardStat, "wardNumber" | "wardName" | "demandCoveragePct"> & {
    wards: number
    wardsWithSurveys: number
    demandCoveragePct: number | null
  }
  wards: PublicWardStat[]
}

export type WardRow = { id: string; number: number; name: string }
export type DemandSums = {
  wardId: string
  demands: number
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  rebate: string
  /** currentYearDemand + interest + debits − credits − rebate (before payments). */
  netDemand: string
  collected: string
}

function pct(part: number, whole: number): number | null {
  if (whole <= 0) return null
  return Math.min(100, Math.round((part / whole) * 1000) / 10)
}

export function buildPublicWardStats(input: {
  wards: WardRow[]
  surveyedByWard: Map<string, number>
  demandsByWard: Map<string, DemandSums>
  discloseCollections: boolean
}): { wards: PublicWardStat[]; totals: PublicWardStatsResponse["totals"] } {
  const wards = [...input.wards]
    .sort((a, b) => a.number - b.number)
    .map((ward): PublicWardStat => {
      const surveyed = input.surveyedByWard.get(ward.id) ?? 0
      const sums = input.demandsByWard.get(ward.id)
      const stat: PublicWardStat = {
        wardNumber: ward.number,
        wardName: ward.name,
        propertiesSurveyed: surveyed,
        propertiesWithPublishedDemand: sums?.demands ?? 0,
        demandCoveragePct: pct(sums?.demands ?? 0, surveyed),
        propertyTax: moneyString(sums?.propertyTax ?? 0),
        waterTax: moneyString(sums?.waterTax ?? 0),
        drainageTax: moneyString(sums?.drainageTax ?? 0),
        penalty: moneyString(sums?.penalty ?? 0),
        rebate: moneyString(sums?.rebate ?? 0),
        totalDemand: moneyString(sums?.netDemand ?? 0),
      }
      if (input.discloseCollections) {
        stat.collected = moneyString(sums?.collected ?? 0)
        stat.outstanding = moneyString(
          sumMoney([sums?.netDemand ?? 0]).minus(sums?.collected ?? 0)
        )
      }
      return stat
    })

  const sum = (key: keyof PublicWardStat) =>
    moneyString(sumMoney(wards.map((w) => String(w[key] ?? 0))))
  const surveyed = wards.reduce((n, w) => n + w.propertiesSurveyed, 0)
  const withDemand = wards.reduce((n, w) => n + w.propertiesWithPublishedDemand, 0)
  const totals: PublicWardStatsResponse["totals"] = {
    wards: wards.length,
    wardsWithSurveys: wards.filter((w) => w.propertiesSurveyed > 0).length,
    propertiesSurveyed: surveyed,
    propertiesWithPublishedDemand: withDemand,
    demandCoveragePct: pct(withDemand, surveyed),
    propertyTax: sum("propertyTax"),
    waterTax: sum("waterTax"),
    drainageTax: sum("drainageTax"),
    penalty: sum("penalty"),
    rebate: sum("rebate"),
    totalDemand: sum("totalDemand"),
  }
  if (input.discloseCollections) {
    totals.collected = sum("collected")
    totals.outstanding = sum("outstanding")
  }
  return { wards, totals }
}

export function collectionsDisclosed(): boolean {
  return process.env.PUBLIC_DISCLOSE_COLLECTIONS?.trim().toLowerCase() === "true"
}
