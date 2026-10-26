import { buildPublicWardStats, collectionsDisclosed, type DemandSums } from "./ward-stats"

const wards = [
  { id: "w2", number: 2, name: "वार्ड 2" },
  { id: "w1", number: 1, name: "वार्ड नंबर 1 - सुभाषनगर" },
  { id: "w3", number: 3, name: "वार्ड 3" },
]

const sums = (wardId: string, over: Partial<DemandSums>): DemandSums => ({
  wardId,
  demands: 0,
  propertyTax: "0.00",
  waterTax: "0.00",
  drainageTax: "0.00",
  penalty: "0.00",
  rebate: "0.00",
  netDemand: "0.00",
  collected: "0.00",
  ...over,
})

const input = {
  wards,
  surveyedByWard: new Map([
    ["w1", 4],
    ["w2", 2],
  ]),
  demandsByWard: new Map([
    ["w1", sums("w1", { demands: 3, propertyTax: "7200.00", waterTax: "5400.00", rebate: "1260.00", netDemand: "11340.00", collected: "4000.00" })],
    ["w2", sums("w2", { demands: 2, propertyTax: "1000.00", netDemand: "1000.00" })],
  ]),
}

describe("I: public ward statistics", () => {
  it("lists every active ward in ward order with its own figures", () => {
    const { wards: rows } = buildPublicWardStats({ ...input, discloseCollections: false })
    expect(rows.map((w) => w.wardNumber)).toEqual([1, 2, 3])
    expect(rows[0]).toMatchObject({
      propertiesSurveyed: 4,
      propertiesWithPublishedDemand: 3,
      demandCoveragePct: 75,
      propertyTax: "7200.00",
      waterTax: "5400.00",
      totalDemand: "11340.00",
    })
    // A ward with no surveys has no meaningful percentage.
    expect(rows[2]).toMatchObject({ propertiesSurveyed: 0, demandCoveragePct: null, totalDemand: "0.00" })
  })

  it("totals are the sum of the ward rows", () => {
    const { totals } = buildPublicWardStats({ ...input, discloseCollections: false })
    expect(totals).toMatchObject({
      wards: 3,
      wardsWithSurveys: 2,
      propertiesSurveyed: 6,
      propertiesWithPublishedDemand: 5,
      propertyTax: "8200.00",
      totalDemand: "12340.00",
    })
  })

  it("hides collections and outstanding unless disclosure is approved", () => {
    const hidden = buildPublicWardStats({ ...input, discloseCollections: false })
    expect(hidden.wards[0]).not.toHaveProperty("collected")
    expect(hidden.totals).not.toHaveProperty("outstanding")
    const shown = buildPublicWardStats({ ...input, discloseCollections: true })
    expect(shown.wards[0]).toMatchObject({ collected: "4000.00", outstanding: "7340.00" })
    expect(shown.totals).toMatchObject({ collected: "4000.00", outstanding: "8340.00" })
  })

  it("never contains personal or internal fields", () => {
    const { wards: rows, totals } = buildPublicWardStats({ ...input, discloseCollections: true })
    const json = JSON.stringify({ rows, totals })
    for (const forbidden of ["mobile", "owner", "aadhaar", "surveyId", "address", "email", "wardId", "receipt", "token"]) {
      expect(json.toLowerCase()).not.toContain(forbidden.toLowerCase())
    }
  })

  it("collection disclosure is off by default", () => {
    const previous = process.env.PUBLIC_DISCLOSE_COLLECTIONS
    delete process.env.PUBLIC_DISCLOSE_COLLECTIONS
    expect(collectionsDisclosed()).toBe(false)
    process.env.PUBLIC_DISCLOSE_COLLECTIONS = "true"
    expect(collectionsDisclosed()).toBe(true)
    if (previous === undefined) delete process.env.PUBLIC_DISCLOSE_COLLECTIONS
    else process.env.PUBLIC_DISCLOSE_COLLECTIONS = previous
  })
})
