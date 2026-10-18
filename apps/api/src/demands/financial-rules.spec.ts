import { resolveAssessmentCharges } from "./assessment-charges"
import { historicalRowError, normalizeHistoricalRow } from "./historical-import"
import { addMoney, moneyString, subMoney } from "./money"
import { resolvePenaltyAmount } from "./penalty-policy"
import { calculateOutstanding } from "./outstanding"
import { calculateRebate, policyIsCurrent } from "./rebate"
import { findOverlappingYear } from "./year-overlap"

describe("rebate and penalty rules", () => {
  const base = {
    propertyTax: "4500.00",
    waterTax: "0.00",
    drainageTax: "0.00",
    penalty: "0.00",
    interest: "0.00",
    previousArrears: "0.00",
  }

  it("gives a 450 rebate and 4050 payable on an eligible 4500 demand", () => {
    const rebate = calculateRebate(
      {
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
      base
    )
    expect(rebate.amount).toBe("450.00")
    expect(rebate.eligibleBase).toBe("4500.00")
  })

  it("does not apply an expired rebate", () => {
    expect(
      policyIsCurrent({
        status: "ACTIVE",
        startsOn: new Date("2020-04-01T00:00:00.000Z"),
        endsOn: new Date("2021-03-31T00:00:00.000Z"),
        asOf: new Date("2026-10-18T00:00:00.000Z"),
      })
    ).toBe(false)
    expect(
      calculateRebate(
        {
          active: false,
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
        { ...base, previousArrears: "350.00" }
      ).amount
    ).toBe("0.00")
  })

  it("charges the same one-time penalty on repeated calculation", () => {
    const rule = {
      active: true,
      type: "PERCENT_OF_PROPERTY_TAX" as const,
      rate: "10",
      fixedAmount: "0",
      trigger: "ON_ASSESSMENT" as const,
      dueDate: null,
      graceDays: 0,
      includePropertyTax: true,
      includeWaterTax: false,
      includeDrainageTax: false,
      includeArrears: false,
      applyAfterRebate: false,
      maxAmount: null,
    }
    const input = {
      asOf: new Date("2026-10-18T00:00:00.000Z"),
      taxConfigPenalty: "0.00",
      propertyTax: "2400.00",
      waterTax: "1800.00",
      drainageTax: "0.00",
      previousArrears: "350.00",
    }
    const first = resolvePenaltyAmount(rule, input)
    const second = resolvePenaltyAmount(rule, input)
    expect(first).toEqual({ penalty: "240.00", policyApplied: true })
    expect(second).toEqual(first)
  })

  it("does not charge a due-date penalty before the due date", () => {
    const result = resolvePenaltyAmount(
      {
        active: true,
        type: "FIXED_AMOUNT",
        rate: "0",
        fixedAmount: "100.00",
        trigger: "DUE_DATE_PASSED",
        dueDate: new Date("2026-12-31T00:00:00.000Z"),
        graceDays: 0,
        includePropertyTax: true,
        includeWaterTax: false,
        includeDrainageTax: false,
        includeArrears: false,
        applyAfterRebate: false,
        maxAmount: null,
      },
      {
        asOf: new Date("2026-10-18T00:00:00.000Z"),
        taxConfigPenalty: "50.00",
        propertyTax: "2400.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        previousArrears: "0.00",
      }
    )
    expect(result).toEqual({ penalty: "0.00", policyApplied: true })
  })

  it("applies rebate then penalty once for 4000 current tax and 2000 arrears", () => {
    const input = {
      asOf: new Date("2026-10-18T00:00:00.000Z"),
      propertyTax: "4000.00",
      waterTax: "0.00",
      drainageTax: "0.00",
      interest: "0.00",
      taxConfigPenalty: "400.00",
      previousArrears: "2000.00",
      rebateRule: {
        active: true as const,
        type: "PERCENTAGE" as const,
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
      penaltyRule: {
        active: true as const,
        type: "PERCENT_OF_ELIGIBLE_BASE" as const,
        rate: "10",
        fixedAmount: "0",
        trigger: "ON_ASSESSMENT" as const,
        dueDate: null,
        graceDays: 0,
        includePropertyTax: true,
        includeWaterTax: true,
        includeDrainageTax: true,
        includeArrears: true,
        applyAfterRebate: true,
        maxAmount: null,
      },
    }
    const first = resolveAssessmentCharges(input)
    const second = resolveAssessmentCharges(input)
    expect(first.rebateAmount).toBe("600.00")
    expect(moneyString(subMoney("6000.00", first.rebateAmount))).toBe("5400.00")
    expect(first.penalty).toBe("540.00")
    expect(first.currentYearDemand).toBe("4540.00")
    const payable = moneyString(
      subMoney(addMoney("2000.00", first.currentYearDemand), first.rebateAmount)
    )
    expect(payable).toBe("5940.00")
    expect(second).toEqual(first)
  })

  it("does not apply rebate or penalty a second time to a published snapshot", () => {
    const published = calculateOutstanding({
      selectedYear: { id: "y", code: "2025-2026", name: "2025-2026" },
      demands: [
        {
          id: "d1",
          assessmentYearId: "y",
          assessmentYearCode: "2025-2026",
          assessmentYearName: "2025-2026",
          propertyTax: "4000.00",
          waterTax: "0.00",
          drainageTax: "0.00",
          penalty: "540.00",
          interest: "0.00",
          currentYearDemand: "4540.00",
          credits: "0.00",
          debits: "0.00",
          payments: "0.00",
          rebate: "600.00",
          verificationStatus: "VERIFIED",
        },
      ],
      payments: [],
      calculatedCurrent: null,
      rebateRule: {
        active: true,
        type: "PERCENTAGE",
        rate: "10",
        fixedAmount: "0",
        includePropertyTax: true,
        includeWaterTax: true,
        includeDrainageTax: true,
        includeArrears: true,
        includePenalty: true,
        includeInterest: false,
        maxAmount: null,
      },
    })
    expect(published.rebateAmount).toBe("600.00")
    expect(published.penalty).toBe("540.00")
    expect(published.totalPayable).toBe("3940.00")
    const again = calculateOutstanding({
      selectedYear: { id: "y", code: "2025-2026", name: "2025-2026" },
      demands: [
        {
          id: "d1",
          assessmentYearId: "y",
          assessmentYearCode: "2025-2026",
          assessmentYearName: "2025-2026",
          propertyTax: "4000.00",
          waterTax: "0.00",
          drainageTax: "0.00",
          penalty: "540.00",
          interest: "0.00",
          currentYearDemand: "4540.00",
          credits: "0.00",
          debits: "0.00",
          payments: "0.00",
          rebate: "600.00",
          verificationStatus: "VERIFIED",
        },
      ],
      payments: [],
      calculatedCurrent: null,
    })
    expect(again.totalPayable).toBe(published.totalPayable)
  })
})

describe("assessment year dates", () => {
  it("rejects an overlapping range and allows an archived year to overlap", () => {
    const existing = [
      {
        id: "year-1",
        startsOn: "2025-04-01",
        endsOn: "2026-03-31",
        status: "ACTIVE" as const,
      },
    ]
    expect(
      findOverlappingYear(
        {
          id: "year-2",
          startsOn: "2026-01-01",
          endsOn: "2026-12-31",
          status: "DRAFT",
        },
        existing
      )?.id
    ).toBe("year-1")
    expect(
      findOverlappingYear(
        {
          id: "year-3",
          startsOn: "2025-04-01",
          endsOn: "2026-03-31",
          status: "ARCHIVED",
        },
        existing
      )
    ).toBeNull()
  })
})

describe("historical import rows", () => {
  it("rejects a duplicate-style mixed closing balance and a mismatched closing", () => {
    expect(
      historicalRowError(
        normalizeHistoricalRow({
          propertyId: "P-1",
          assessmentYear: "2024-2025",
          balanceKind: "CLOSING_ONLY",
          propertyTax: "100.00",
          paymentsReceived: "20.00",
        })
      )
    ).toMatch(/cannot include/)
    expect(
      historicalRowError(
        normalizeHistoricalRow({
          propertyId: "P-1",
          assessmentYear: "2024-2025",
          propertyTax: "100.00",
          verifiedClosing: "90.00",
        })
      )
    ).toMatch(/does not match/)
  })

  it("stores a closing-only source as a historical opening balance", () => {
    const row = normalizeHistoricalRow({
      propertyId: "P-1",
      assessmentYear: "2024-2025",
      verifiedClosing: "2000.00",
    })
    expect(row.balanceKind).toBe("CLOSING_ONLY")
    expect(row.remarks).toBe("Historical opening balance")
    expect(historicalRowError(row)).toBeNull()
  })
})
