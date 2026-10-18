import { Prisma } from "@prisma/client"

import {
  calculateOutstanding,
  allocationCounts,
  countedPayments,
  type LedgerDemand,
} from "./outstanding"
import { money, moneyString } from "./money"

function demand(input: {
  year: string
  currentYearDemand: string
  payments?: string
  credits?: string
  id?: string
}): LedgerDemand {
  return {
    id: input.id ?? input.year,
    assessmentYearId: input.year,
    assessmentYearCode: input.year,
    assessmentYearName: input.year,
    propertyTax: input.currentYearDemand,
    waterTax: "0.00",
    drainageTax: "0.00",
    penalty: "0.00",
    interest: "0.00",
    currentYearDemand: input.currentYearDemand,
    credits: input.credits ?? "0.00",
    debits: "0.00",
    payments: input.payments ?? "0.00",
  }
}

const calculated1500 = {
  propertyTax: "1500.00",
  waterTax: "0.00",
  drainageTax: "0.00",
  penalty: "0.00",
  interest: "0.00",
  currentYearDemand: "1500.00",
}

describe("assessment outstanding", () => {
  it("A: previous arrears 250 and current demand 1500 outstanding 1750", () => {
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [
        demand({ year: "2024-2025", currentYearDemand: "250.00" }),
      ],
      payments: [],
      calculatedCurrent: calculated1500,
    })
    expect(result.openingArrears).toBe("250.00")
    expect(result.currentYearDemand).toBe("1500.00")
    expect(result.totalPayable).toBe("1750.00")
    expect(result.netOutstanding).toBe("1750.00")
    expect(result.authoritative).toBe(true)
  })

  it("B: a 500 payment on the current demand leaves 1250", () => {
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [
        demand({ year: "2024-2025", currentYearDemand: "250.00" }),
        demand({
          year: "2025-2026",
          currentYearDemand: "1500.00",
          payments: "500.00",
        }),
      ],
      payments: [],
      calculatedCurrent: null,
    })
    expect(result.netOutstanding).toBe("1250.00")
    expect(result.paymentsAllocated).toBe("500.00")
  })

  it("C: demand 1000 and payments 750 close at 250 and open the next year at 250", () => {
    const prior = calculateOutstanding({
      selectedYear: { id: "2024-2025", code: "2024-2025", name: "2024-2025" },
      demands: [
        demand({
          year: "2024-2025",
          currentYearDemand: "1000.00",
          payments: "750.00",
        }),
      ],
      payments: [],
      calculatedCurrent: null,
    })
    expect(prior.netOutstanding).toBe("250.00")

    const next = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [
        demand({
          year: "2024-2025",
          currentYearDemand: "1000.00",
          payments: "750.00",
        }),
      ],
      payments: [],
      calculatedCurrent: calculated1500,
    })
    expect(next.openingArrears).toBe("250.00")
    expect(next.totalPayable).toBe("1750.00")
  })

  it("D: two previous years are included once", () => {
    const result = calculateOutstanding({
      selectedYear: { id: "2026-2027", code: "2026-2027", name: "2026-2027" },
      demands: [
        demand({ year: "2024-2025", currentYearDemand: "100.00" }),
        demand({
          year: "2025-2026",
          currentYearDemand: "400.00",
          payments: "250.00",
        }),
      ],
      payments: [],
      calculatedCurrent: {
        ...calculated1500,
        propertyTax: "0.00",
        currentYearDemand: "0.00",
      },
    })
    expect(result.openingArrears).toBe("250.00")
    expect(result.years.filter((year) => year.outstanding !== "0.00")).toHaveLength(
      2
    )
    const summed = result.years
      .filter((year) => year.assessmentYearCode < "2026-2027")
      .reduce((sum, year) => sum + Number(year.outstanding), 0)
    expect(summed).toBe(250)
  })

  it("E: a fully paid previous year does not add arrears", () => {
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [
        demand({
          year: "2024-2025",
          currentYearDemand: "1000.00",
          payments: "1000.00",
        }),
      ],
      payments: [],
      calculatedCurrent: calculated1500,
    })
    expect(result.openingArrears).toBe("0.00")
    expect(
      result.years.find((year) => year.assessmentYearCode === "2024-2025")
        ?.outstanding
    ).toBe("0.00")
    expect(result.totalPayable).toBe("1500.00")
  })

  it("H: pending, failed, and reversed payments do not reduce outstanding", () => {
    expect(allocationCounts("ACTIVE", "PENDING")).toBe(false)
    expect(allocationCounts("ACTIVE", "FAILED")).toBe(false)
    expect(allocationCounts("REVERSED", "SUCCESS")).toBe(false)
    expect(allocationCounts("ACTIVE", "REFUNDED")).toBe(false)
    expect(allocationCounts("ACTIVE", "SUCCESS")).toBe(true)

    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [demand({ year: "2024-2025", currentYearDemand: "250.00" })],
      payments: [
        {
          id: "pending-not-included",
          amount: "500.00",
          allocatedAmount: "0.00",
          assessmentYearId: null,
          assessmentYearCode: null,
          assessmentYearName: null,
        },
      ],
      calculatedCurrent: calculated1500,
    })
    expect(result.netOutstanding).toBe("1750.00")
    expect(result.authoritative).toBe(false)
    expect(result.unassignedPaymentIds).toEqual(["pending-not-included"])
  })

  it("I: a later calculation does not replace a published snapshot", () => {
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [
        demand({
          id: "published-2025",
          year: "2025-2026",
          currentYearDemand: "1500.00",
        }),
      ],
      payments: [],
      calculatedCurrent: {
        propertyTax: "9999.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
        currentYearDemand: "9999.00",
      },
    })
    expect(result.publishedDemandId).toBe("published-2025")
    expect(result.currentYearDemand).toBe("1500.00")
    expect(result.propertyTax).toBe("1500.00")
  })

  it("K: a successful payment without a published demand is unreconciled and excluded", () => {
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [],
      payments: [
        {
          id: "pay-2024",
          amount: "750.00",
          allocatedAmount: "0.00",
          assessmentYearId: "2024-2025",
          assessmentYearCode: "2024-2025",
          assessmentYearName: "2024-2025",
        },
      ],
      calculatedCurrent: calculated1500,
    })
    expect(result.unreconciledYears.map((year) => year.code)).toEqual([
      "2024-2025",
    ])
    expect(result.openingArrears).toBe("0.00")
    expect(result.authoritative).toBe(false)
    expect(result.totalPayable).toBe("1500.00")
    expect(result.netOutstanding).toBe("1500.00")
  })

  it("includes historical balances of 100 and 250 once and keeps current demand separate", () => {
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [
        demand({ year: "2023-2024", currentYearDemand: "100.00" }),
        demand({ year: "2024-2025", currentYearDemand: "250.00" }),
      ],
      payments: [],
      calculatedCurrent: {
        propertyTax: "4500.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
        currentYearDemand: "4500.00",
      },
      rebateRule: {
        active: true,
        type: "PERCENTAGE",
        rate: "10",
        fixedAmount: "0",
        includePropertyTax: true,
        includeWaterTax: true,
        includeDrainageTax: true,
        includeArrears: true,
        includePenalty: false,
        includeInterest: false,
        maxAmount: null,
      },
    })
    expect(result.openingArrears).toBe("350.00")
    expect(result.currentYearDemand).toBe("4500.00")
    expect(result.grossEligibleDemand).toBe("4850.00")
    expect(result.rebateAmount).toBe("485.00")
    expect(result.totalPayable).toBe("4365.00")
    expect(result.netOutstanding).toBe("4365.00")
  })

  it("applies a 10 percent rebate to a 4500 current-year base when arrears are excluded", () => {
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [],
      payments: [],
      calculatedCurrent: {
        propertyTax: "4500.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
        currentYearDemand: "4500.00",
      },
      rebateRule: {
        active: true,
        type: "PERCENTAGE",
        rate: "10",
        fixedAmount: "0",
        includePropertyTax: true,
        includeWaterTax: true,
        includeDrainageTax: true,
        includeArrears: false,
        includePenalty: false,
        includeInterest: false,
        maxAmount: null,
      },
    })
    expect(result.rebateAmount).toBe("450.00")
    expect(result.totalPayable).toBe("4050.00")
  })

  it("does not discount a penalty that the policy excludes", () => {
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [],
      payments: [],
      calculatedCurrent: {
        propertyTax: "2400.00",
        waterTax: "1800.00",
        drainageTax: "0.00",
        penalty: "240.00",
        interest: "0.00",
        currentYearDemand: "4440.00",
      },
      rebateRule: {
        active: true,
        type: "PERCENTAGE",
        rate: "10",
        fixedAmount: "0",
        includePropertyTax: true,
        includeWaterTax: true,
        includeDrainageTax: true,
        includeArrears: false,
        includePenalty: false,
        includeInterest: false,
        maxAmount: null,
      },
    })
    expect(result.rebateAmount).toBe("420.00")
    expect(result.totalPayable).toBe("4020.00")
  })

  it("keeps a snapshotted rebate when a later rule would differ", () => {
    const published = demand({
      year: "2025-2026",
      currentYearDemand: "4500.00",
    })
    published.rebate = "450.00"
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [published],
      payments: [],
      calculatedCurrent: {
        propertyTax: "9999.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
        currentYearDemand: "9999.00",
      },
      rebateRule: {
        active: true,
        type: "PERCENTAGE",
        rate: "50",
        fixedAmount: "0",
        includePropertyTax: true,
        includeWaterTax: true,
        includeDrainageTax: true,
        includeArrears: true,
        includePenalty: true,
        includeInterest: true,
        maxAmount: null,
      },
    })
    expect(result.currentYearDemand).toBe("4500.00")
    expect(result.rebateAmount).toBe("450.00")
    expect(result.totalPayable).toBe("4050.00")
  })

  it("excludes an unverified historical balance from confirmed arrears", () => {
    const unverified = demand({ year: "2024-2025", currentYearDemand: "250.00" })
    unverified.verificationStatus = "UNVERIFIED"
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [unverified],
      payments: [],
      calculatedCurrent: calculated1500,
    })
    expect(result.openingArrears).toBe("0.00")
    expect(result.authoritative).toBe(false)
    expect(result.unreconciledYears[0]?.reason).toContain("not verified")
  })

  it("partial payment leaves the remaining component outstanding", () => {
    const prior = demand({
      year: "2024-2025",
      currentYearDemand: "1000.00",
      payments: "400.00",
    })
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [prior],
      payments: [],
      calculatedCurrent: calculated1500,
    })
    const year = result.years.find((item) => item.assessmentYearCode === "2024-2025")
    expect(year?.propertyTax).toBe("1000.00")
    expect(year?.outstanding).toBe("600.00")
    expect(result.openingArrears).toBe("600.00")
    expect(result.previousPropertyTaxOutstanding).toBe("600.00")
    expect(result.netOutstanding).toBe("2100.00")
  })

  it("fully paid historical demand does not increase component arrears", () => {
    const prior = demand({
      year: "2024-2025",
      currentYearDemand: "1000.00",
      payments: "1000.00",
    })
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [prior],
      payments: [],
      calculatedCurrent: calculated1500,
    })
    const year = result.years.find((item) => item.assessmentYearCode === "2024-2025")
    expect(year?.outstanding).toBe("0.00")
    expect(result.openingArrears).toBe("0.00")
    expect(result.previousPropertyTaxOutstanding).toBe("0.00")
    expect(result.netOutstanding).toBe("1500.00")
  })

  it("closing-only opening balance is not split into tax components", () => {
    const opening = demand({
      year: "2023-2024",
      currentYearDemand: "500.00",
    })
    opening.balanceKind = "CLOSING_ONLY"
    opening.propertyTax = "500.00"
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [opening],
      payments: [],
      calculatedCurrent: calculated1500,
    })
    const year = result.years.find((item) => item.assessmentYearCode === "2023-2024")
    expect(year?.balanceKind).toBe("CLOSING_ONLY")
    expect(year?.outstanding).toBe("500.00")
    expect(result.historicalOpeningArrears).toBe("500.00")
    expect(result.previousPropertyTaxOutstanding).toBe("0.00")
    expect(result.openingArrears).toBe("500.00")
    expect(result.netOutstanding).toBe("2000.00")
  })

  it("historical receipt matched to an allocation is counted once", () => {
    expect(
      countedPayments({
        historicalPayments: "400.00",
        sourceReference: "RCPT-1",
        allocations: [
          {
            amount: "400.00",
            status: "ACTIVE",
            paymentStatus: "SUCCESS",
            paymentReference: "RCPT-1",
          },
        ],
      })
    ).toBe("400.00")
    expect(
      countedPayments({
        historicalPayments: "400.00",
        sourceReference: "RCPT-1",
        allocations: [
          {
            amount: "100.00",
            status: "ACTIVE",
            paymentStatus: "SUCCESS",
            receiptNumber: "OTHER-2",
          },
        ],
      })
    ).toBe("500.00")
  })

  it("missing history is not an authoritative zero arrears balance", () => {
    const result = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [],
      payments: [],
      calculatedCurrent: calculated1500,
      missingHistoryYears: [
        {
          assessmentYearId: "2024-2025",
          code: "2024-2025",
          name: "2024-2025",
          reason: "No verified published balance",
        },
      ],
    })
    expect(result.openingArrears).toBe("0.00")
    expect(result.authoritative).toBe(false)
    expect(result.missingHistoryYears).toHaveLength(1)
  })
})

describe("decimal money", () => {
  it("M: half-up paise rounding and 250 + 1500 = 1750.00", () => {
    expect(moneyString(money("1.005"))).toBe("1.01")
    expect(moneyString(money("1.004"))).toBe("1.00")
    expect(moneyString(new Prisma.Decimal("250.00").plus("1500.00"))).toBe(
      "1750.00"
    )
    expect(money("1750").toFixed(2)).toBe("1750.00")
  })
})
