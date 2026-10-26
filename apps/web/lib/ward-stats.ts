/**
 * Public ward statistics from the municipal API (published ledger aggregates).
 * The website never computes tax figures itself.
 */
export type WardStat = {
  wardNumber: number
  wardName: string
  propertiesSurveyed: number
  propertiesWithPublishedDemand: number
  demandCoveragePct: number | null
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  rebate: string
  totalDemand: string
  collected?: string
  outstanding?: string
}

export type WardStatsResponse = {
  assessmentYear: { id: string; code: string; name: string } | null
  years: Array<{ id: string; code: string; name: string }>
  generatedAt: string
  basis: string
  disclosure: { collections: boolean }
  geometryAvailable: boolean
  totals: Omit<WardStat, "wardNumber" | "wardName"> & { wards: number; wardsWithSurveys: number }
  wards: WardStat[]
}

export type WardStatsResult =
  | { ok: true; data: WardStatsResponse }
  | { ok: false; reason: "unavailable" | "not-found" }

const API = process.env.API_INTERNAL_URL?.replace(/\/$/, "") || "http://127.0.0.1:4000"

export async function fetchWardStats(assessmentYear?: string): Promise<WardStatsResult> {
  const query = assessmentYear ? `?assessmentYear=${encodeURIComponent(assessmentYear)}` : ""
  try {
    const res = await fetch(`${API}/api/v1/public/ward-stats${query}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 404) return { ok: false, reason: "not-found" }
    if (!res.ok) return { ok: false, reason: "unavailable" }
    const body = (await res.json()) as { data?: WardStatsResponse }
    if (!body.data) return { ok: false, reason: "unavailable" }
    return { ok: true, data: body.data }
  } catch {
    return { ok: false, reason: "unavailable" }
  }
}

/** Indian rupee grouping from the API's fixed-decimal strings (no float maths). */
export function inr(value: string | undefined, opts: { paise?: boolean } = {}): string {
  if (!value) return "—"
  const negative = value.startsWith("-")
  const [whole = "0", paise = "00"] = value.replace("-", "").split(".")
  const last3 = whole.slice(-3)
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  const grouped = `${rest ? `${rest},` : ""}${last3}`
  return `${negative ? "−" : ""}₹${grouped}${opts.paise ? `.${paise.padEnd(2, "0").slice(0, 2)}` : ""}`
}
