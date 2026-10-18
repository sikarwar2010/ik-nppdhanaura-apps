import {
  DemandArithmeticError,
  reconcileComponentTotal,
} from "./notice-arithmetic"

describe("demand notice arithmetic", () => {
  it("N: a 240 gap is reconciled when it equals the configured penalty", () => {
    const result = reconcileComponentTotal({
      propertyTax: "2400.00",
      waterTax: "1800.00",
      drainageTax: "0.00",
      penalty: "240.00",
      totalDemand: "4440.00",
    })
    expect(result).toEqual({ gap: "240.00", reconciled: true })
  })

  it("N: an unexplained gap is rejected", () => {
    expect(() =>
      reconcileComponentTotal({
        propertyTax: "2400.00",
        waterTax: "1800.00",
        drainageTax: "0.00",
        penalty: "0.00",
        totalDemand: "4440.00",
      })
    ).toThrow(DemandArithmeticError)
  })
})
