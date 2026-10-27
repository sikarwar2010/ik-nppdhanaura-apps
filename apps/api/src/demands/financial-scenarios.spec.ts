/**
 * Acceptance scenarios A–L from the tax-portal brief, run against the real
 * calculation modules (no mocks of the arithmetic). Amounts are rupees.
 */
import {
  allocateOldestFirst,
  CollectionRuleError,
  idempotencyDecision,
  propertyPosition,
  replayedReceipt,
  type YearPositionInput,
} from "../collections/collection-rules"
import { renderReceiptHtml, type ReceiptSnapshot } from "../collections/receipt-html"
import {
  duesPayloadToNoticeViewModel,
  outstandingToNoticeLedger,
} from "../reports/demand-notice/demand-notice-view-model"
import {
  type CategoryPenaltyRule,
  type CategoryRebateRule,
  PolicyConflictError,
  resolveCategoryCharges,
} from "./category-charges"
import { moneyString, sumMoney } from "./money"
import {
  calculateOutstanding,
  countedPayments,
  type LedgerDemand,
  ownOutstanding,
} from "./outstanding"
import { supersededCategories } from "./policies.service"

const asOf = new Date("2026-06-15T06:00:00Z")

function year(code: string, over: Partial<YearPositionInput> = {}): YearPositionInput {
  return {
    yearCode: code,
    propertyTax: "0.00",
    waterTax: "0.00",
    drainageTax: "0.00",
    penalty: "0.00",
    interest: "0.00",
    currentYearDemand: "0.00",
    rebate: "0.00",
    credits: "0.00",
    debits: "0.00",
    payments: "0.00",
    ...over,
  }
}

function demand(code: string, over: Partial<LedgerDemand> = {}): LedgerDemand {
  return {
    id: `d-${code}`,
    assessmentYearId: code,
    assessmentYearCode: code,
    assessmentYearName: code,
    propertyTax: "0.00",
    waterTax: "0.00",
    drainageTax: "0.00",
    penalty: "0.00",
    interest: "0.00",
    currentYearDemand: "0.00",
    credits: "0.00",
    debits: "0.00",
    payments: "0.00",
    ...over,
  }
}

const rebate = (over: Partial<CategoryRebateRule>): CategoryRebateRule => ({
  active: true,
  category: "COMBINED",
  policyId: "r1",
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
  ...over,
})

const penalty = (over: Partial<CategoryPenaltyRule>): CategoryPenaltyRule => ({
  active: true,
  category: "PROPERTY_TAX",
  policyId: "p1",
  type: "PERCENT_OF_ELIGIBLE_BASE",
  rate: "5",
  fixedAmount: "0",
  trigger: "ON_ASSESSMENT",
  dueDate: null,
  graceDays: 0,
  includePropertyTax: true,
  includeWaterTax: false,
  includeDrainageTax: false,
  includeArrears: false,
  applyAfterRebate: false,
  maxAmount: null,
  ...over,
})

const noticeSample = {
  asOf,
  propertyTax: "2400.00",
  waterTax: "1800.00",
  drainageTax: "0.00",
  interest: "0.00",
  taxConfigPenalty: "0.00",
  previousArrears: "0.00",
  previousByCategory: { PROPERTY_TAX: "0.00", WATER_TAX: "0.00", DRAINAGE_TAX: "0.00" },
}

describe("A: partial offline payment", () => {
  it("₹4,500 due, ₹2,500 paid leaves ₹2,000 on the ledger and receipt", () => {
    const lines = allocateOldestFirst("2500.00", [
      { assessmentDemandId: "d-2025", assessmentYearCode: "2025-2026", unpaid: "4500.00" },
    ])
    expect(lines).toEqual([
      { assessmentDemandId: "d-2025", assessmentYearCode: "2025-2026", amount: "2500.00" },
    ])
    const position = propertyPosition("2025-2026", [
      year("2025-2026", { propertyTax: "4500.00", currentYearDemand: "4500.00", payments: "2500.00" }),
    ])
    expect(position.payable).toBe("4500.00")
    expect(position.collected).toBe("2500.00")
    expect(position.outstanding).toBe("2000.00")
    expect(position.status).toBe("PARTIAL")

    const html = renderReceiptHtml(receipt({ totalPayable: "4500.00", amountReceived: "2500.00", remaining: "2000.00" }))
    expect(html).toContain("4,500.00")
    expect(html).toContain("2,500.00")
    expect(html).toContain("2,000.00")
    expect(html).toContain("PARTIAL PAYMENT RECEIVED")
  })
})

describe("B: full payment", () => {
  it("₹4,500 due, ₹4,500 paid leaves ₹0 and marks the year paid", () => {
    const position = propertyPosition("2025-2026", [
      year("2025-2026", { propertyTax: "4500.00", currentYearDemand: "4500.00", payments: "4500.00" }),
    ])
    expect(position.outstanding).toBe("0.00")
    expect(position.status).toBe("PAID")
    const html = renderReceiptHtml(receipt({ totalPayable: "4500.00", amountReceived: "4500.00", remaining: "0.00" }))
    expect(html).not.toContain("PARTIAL PAYMENT RECEIVED")
    expect(html).toContain("FULLY PAID")
  })

  it("rejects zero, negative and above-balance amounts", () => {
    const years = [{ assessmentDemandId: "d", assessmentYearCode: "2025-2026", unpaid: "4500.00" }]
    expect(() => allocateOldestFirst("0", years)).toThrow(CollectionRuleError)
    expect(() => allocateOldestFirst("-10", years)).toThrow(CollectionRuleError)
    expect(() => allocateOldestFirst("4500.01", years)).toThrow(/above the outstanding/)
  })
})

describe("C: reference notice arithmetic (₹2,400 + ₹1,800 − ₹420 = ₹3,780)", () => {
  it("a combined 10% rule over property and water tax gives ₹420", () => {
    const charges = resolveCategoryCharges({ ...noticeSample, rebateRules: [rebate({})], penaltyRules: [] })
    expect(charges.rebateAmount).toBe("420.00")
    expect(charges.currentYearDemand).toBe("4200.00")
    const breakdown = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [],
      payments: [],
      calculatedCurrent: charges,
      lockedRebate: { amount: charges.rebateAmount, scope: charges.rebateScope },
    })
    expect(breakdown.totalPayable).toBe("3780.00")
    expect(breakdown.netOutstanding).toBe("3780.00")
  })
})

describe("D: separate property-tax and water-tax rules", () => {
  it("a property-tax rebate does not reduce water tax", () => {
    const charges = resolveCategoryCharges({
      ...noticeSample,
      rebateRules: [rebate({ category: "PROPERTY_TAX", includeWaterTax: false, includeDrainageTax: false })],
      penaltyRules: [],
    })
    expect(charges.rebateAmount).toBe("240.00")
    expect(charges.breakdown.mode).toBe("CATEGORY")
    if (charges.breakdown.mode !== "CATEGORY") throw new Error("mode")
    const water = charges.breakdown.lines.find((l) => l.category === "WATER_TAX")!
    expect(water.rebate).toBe("0.00")
    expect(water.rebatePolicyId).toBeNull()
  })

  it("property and water rebates apply independently at their own rates", () => {
    const charges = resolveCategoryCharges({
      ...noticeSample,
      rebateRules: [
        rebate({ category: "PROPERTY_TAX", policyId: "rp", rate: "10" }),
        rebate({ category: "WATER_TAX", policyId: "rw", rate: "5" }),
      ],
      penaltyRules: [],
    })
    // 10% of 2,400 + 5% of 1,800
    expect(charges.rebateAmount).toBe("330.00")
    expect(charges.rebatePolicyIds.sort()).toEqual(["rp", "rw"])
  })

  it("a water-tax penalty is charged only on water tax", () => {
    const charges = resolveCategoryCharges({
      ...noticeSample,
      rebateRules: [],
      penaltyRules: [penalty({ category: "WATER_TAX", rate: "10" })],
    })
    expect(charges.penalty).toBe("180.00")
    expect(charges.currentYearDemand).toBe("4380.00")
  })

  it("previous-year rebate uses only that tax's own arrears, and only when allowed", () => {
    const base = {
      ...noticeSample,
      previousArrears: "1500.00",
      previousByCategory: { PROPERTY_TAX: "1000.00", WATER_TAX: "500.00", DRAINAGE_TAX: "0.00" },
      penaltyRules: [],
    }
    const without = resolveCategoryCharges({
      ...base,
      rebateRules: [rebate({ category: "PROPERTY_TAX", includeArrears: false })],
    })
    expect(without.rebateAmount).toBe("240.00")
    const withArrears = resolveCategoryCharges({
      ...base,
      rebateRules: [rebate({ category: "PROPERTY_TAX", includeArrears: true })],
    })
    // 10% of (2,400 current + 1,000 property arrears); water arrears untouched
    expect(withArrears.rebateAmount).toBe("340.00")
  })

  it("rejects a combined rule active together with a tax-specific rule", () => {
    expect(() =>
      resolveCategoryCharges({
        ...noticeSample,
        rebateRules: [rebate({}), rebate({ category: "WATER_TAX", policyId: "rw" })],
        penaltyRules: [],
      })
    ).toThrow(PolicyConflictError)
  })

  it("activating a property-tax rule archives only property-tax and combined rules", () => {
    expect(supersededCategories("PROPERTY_TAX")).toEqual({
      taxCategory: { in: ["PROPERTY_TAX", "COMBINED"] },
    })
    expect(supersededCategories("COMBINED")).toEqual({})
  })

  it("an inactive rule is ignored", () => {
    const charges = resolveCategoryCharges({
      ...noticeSample,
      rebateRules: [rebate({ category: "PROPERTY_TAX", active: false })],
      penaltyRules: [],
    })
    expect(charges.rebateAmount).toBe("0.00")
  })
})

describe("E: historical arrears", () => {
  it("a payment settles the older year first and leaves the current year unchanged", () => {
    const lines = allocateOldestFirst("1000.00", [
      { assessmentDemandId: "d-2025", assessmentYearCode: "2025-2026", unpaid: "2000.00" },
      { assessmentDemandId: "d-2024", assessmentYearCode: "2024-2025", unpaid: "1000.00" },
    ])
    expect(lines).toEqual([
      { assessmentDemandId: "d-2024", assessmentYearCode: "2024-2025", amount: "1000.00" },
    ])
    const position = propertyPosition("2025-2026", [
      year("2024-2025", { propertyTax: "1000.00", currentYearDemand: "1000.00", payments: "1000.00" }),
      year("2025-2026", { propertyTax: "2000.00", currentYearDemand: "2000.00" }),
    ])
    expect(position.previousArrears).toBe("0.00")
    expect(position.outstanding).toBe("2000.00")
  })

  it("a partial payment splits across years in age order", () => {
    const lines = allocateOldestFirst("1500.00", [
      { assessmentDemandId: "d-2024", assessmentYearCode: "2024-2025", unpaid: "1000.00" },
      { assessmentDemandId: "d-2025", assessmentYearCode: "2025-2026", unpaid: "2000.00" },
    ])
    expect(lines.map((l) => l.amount)).toEqual(["1000.00", "500.00"])
  })
})

describe("F: duplicate submission", () => {
  it("the same idempotency key replays the stored receipt", () => {
    expect(idempotencyDecision(null, { amount: "2500.00", surveyId: "s1" })).toBe("create")
    expect(
      idempotencyDecision({ amount: "2500.00", surveyId: "s1" }, { amount: "2500.00", surveyId: "s1" })
    ).toBe("replay")
    expect(
      idempotencyDecision({ amount: "2500.00", surveyId: "s1" }, { amount: "2400.00", surveyId: "s1" })
    ).toBe("conflict")
    expect(replayedReceipt({ receiptNumber: "RCP-20252026-000001" })).toEqual({
      created: false,
      receiptNumber: "RCP-20252026-000001",
    })
  })
})

describe("G: reversal", () => {
  it("a reversed allocation no longer reduces the balance; the original stays on record", () => {
    const allocations = [
      { amount: "2500.00", status: "REVERSED" as const, paymentStatus: "REFUNDED" },
    ]
    expect(countedPayments({ historicalPayments: "0.00", allocations })).toBe("0.00")
    expect(allocations).toHaveLength(1)
    const outstanding = ownOutstanding({
      currentYearDemand: "4500.00",
      interest: "0.00",
      credits: "0.00",
      debits: "0.00",
      payments: countedPayments({ historicalPayments: "0.00", allocations }),
    })
    expect(outstanding).toBe("4500.00")
  })

  it("a reprinted receipt of a reversed payment is stamped, not reissued", () => {
    const html = renderReceiptHtml(
      receipt({ reversal: { at: "26 Oct 2026, 11:00 am", by: "Accounts Clerk", reason: "Cheque dishonoured" } })
    )
    expect(html).toContain("REVERSED")
    expect(html).toContain("Cheque dishonoured")
    expect(html).toContain("RCP-20252026-000123")
  })
})

describe("H: demand notice matches the calculation", () => {
  it("every notice figure comes from the same breakdown", () => {
    const charges = resolveCategoryCharges({ ...noticeSample, rebateRules: [rebate({})], penaltyRules: [] })
    const breakdown = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [],
      payments: [],
      calculatedCurrent: charges,
      lockedRebate: { amount: charges.rebateAmount, scope: charges.rebateScope },
    })
    const figures = outstandingToNoticeLedger(breakdown)
    const vm = duesPayloadToNoticeViewModel(duesFixture(), {
      ledger: figures.ledger,
      snapshot: figures.snapshot,
    })
    expect(vm.propertyTax).toBe(2400)
    expect(vm.waterTax).toBe(1800)
    expect(vm.ledger.totalPayable).toBe(3780)
    expect(vm.address).not.toMatch(/Chhata/)
    expect(vm.address).toContain("Dhanaura")
  })
})

describe("L: reconciliation", () => {
  it("allocations, receipts and outstanding balances add up", () => {
    const demands = [
      demand("2024-2025", { propertyTax: "1000.00", currentYearDemand: "1000.00" }),
      demand("2025-2026", { propertyTax: "2400.00", waterTax: "1800.00", currentYearDemand: "4200.00" }),
    ]
    const receiptsIssued = ["1500.00", "700.00"]
    const allocations = [
      allocateOldestFirst("1500.00", [
        { assessmentDemandId: "d-2024-2025", assessmentYearCode: "2024-2025", unpaid: "1000.00" },
        { assessmentDemandId: "d-2025-2026", assessmentYearCode: "2025-2026", unpaid: "4200.00" },
      ]),
      allocateOldestFirst("700.00", [
        { assessmentDemandId: "d-2025-2026", assessmentYearCode: "2025-2026", unpaid: "3700.00" },
      ]),
    ].flat()
    expect(sumMoney(allocations.map((a) => a.amount)).toFixed(2)).toBe(
      sumMoney(receiptsIssued).toFixed(2)
    )
    const paid = (id: string) =>
      moneyString(sumMoney(allocations.filter((a) => a.assessmentDemandId === id).map((a) => a.amount)))
    const breakdown = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: demands.map((d) => ({ ...d, payments: paid(d.id) })),
      payments: [],
      calculatedCurrent: null,
    })
    const totalDemand = sumMoney(demands.map((d) => d.currentYearDemand))
    expect(breakdown.netOutstanding).toBe(
      moneyString(totalDemand.minus(sumMoney(receiptsIssued)))
    )
    expect(breakdown.netOutstanding).toBe("3000.00")
  })
})

function receipt(over: Partial<ReceiptSnapshot> = {}): ReceiptSnapshot {
  return {
    municipality: "Nagar Palika Parishad Dhanaura",
    receiptNumber: "RCP-20252026-000123",
    receiptAt: "26 Oct 2026, 10:30 am",
    propertyId: "249044-001-000001-001-R",
    ownerName: "राम कुमार",
    address: "Dhanaura",
    ward: "Ward 1",
    assessmentYear: "2025-2026",
    demandReference: "DMD-1",
    propertyTax: "2400.00",
    waterTax: "1800.00",
    drainageTax: "0.00",
    previousDues: "300.00",
    rebate: "0.00",
    penalty: "0.00",
    interest: "0.00",
    totalPayable: "4500.00",
    amountReceived: "2500.00",
    paymentMode: "CASH",
    remaining: "2000.00",
    amountInWords: "",
    cashierName: "Cashier",
    counterCode: "C1",
    allocationText: "2025-2026 ₹ 2500.00",
    ...over,
  }
}

function duesFixture() {
  return {
    id: "cuid-1",
    surveyId: "249044-001-000001-001-R",
    wardNumber: 1,
    wardName: "Ward 1",
    ownerName: "धर्मशाला",
    ownerFatherName: null,
    mobileMasked: null,
    propertyNo: "1",
    parcelNo: "000001",
    houseNo: "NEW",
    streetName: null,
    locality: "सुभाष नगर",
    colony: null,
    city: null,
    pincode: null,
    propertyUse: "सामाजिक",
    taxRateZone: "BELOW_9M",
    roadType: null,
    assessmentYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
    taxConfig: { id: "cfg", version: 1 },
    floors: [],
    tax: {
      propertyTaxPct: 10,
      waterTaxPct: 7.5,
      drainageTaxPct: 0,
      penaltyPct: 0,
      assessablePct: 80,
      commercialAssessablePct: 80,
      propertyTax: 2400,
      waterTax: 1800,
      drainageTax: 0,
      penalty: 0,
      totalDemand: 4200,
      annualBaseRate: null,
      configFound: true,
    },
  }
}
