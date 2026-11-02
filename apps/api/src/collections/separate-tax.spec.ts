import { calculateOutstanding, ownOutstanding, type LedgerDemand } from "../demands/outstanding"
import { bucketsOf, bucketTotal, yearTaxLedger } from "../demands/tax-ledger"
import { onlineTaxPlan } from "../public-property-tax/public-property-tax.service"
import {
  allocateTaxPlan,
  CollectionRuleError,
  legacyTaxPlan,
  resolveTaxPlan,
  type CollectableYear,
} from "./collection-rules"
import { renderReceiptHtml, type ReceiptSnapshot } from "./receipt-html"

const Y1 = { id: "y1", code: "AY_2025_2026", name: "2025-2026" }
const Y2 = { id: "y2", code: "AY_2026_2027", name: "2026-2027" }

function demand(year: typeof Y1, over: Partial<LedgerDemand> = {}): LedgerDemand {
  const propertyTax = over.propertyTax ?? "2400.00"
  const waterTax = over.waterTax ?? "1800.00"
  return {
    id: `d-${year.id}`,
    assessmentYearId: year.id,
    assessmentYearCode: year.code,
    assessmentYearName: year.name,
    propertyTax,
    waterTax,
    drainageTax: "0.00",
    penalty: "0.00",
    interest: "0.00",
    currentYearDemand: (Number(propertyTax) + Number(waterTax)).toFixed(2),
    credits: "0.00",
    debits: "0.00",
    payments: "0.00",
    rebate: "0.00",
    verificationStatus: "VERIFIED",
    balanceKind: "COMPONENTS",
    ...over,
  }
}

function collectable(year: typeof Y1, balances: Parameters<typeof bucketsOf>[0]): CollectableYear {
  const buckets = bucketsOf(balances)
  return {
    assessmentDemandId: `d-${year.id}`,
    assessmentYearCode: year.code,
    assessmentYearName: year.name,
    demandReference: `DM-${year.id}`,
    unpaid: bucketTotal(buckets),
    balances: buckets,
    balanceKind: "COMPONENTS",
  }
}

const position = (demands: LedgerDemand[], selected: typeof Y1) =>
  calculateOutstanding({
    selectedYear: selected,
    demands,
    payments: [],
    calculatedCurrent: null,
  }).taxPosition

describe("2.2 Ram pays only property tax", () => {
  const year = collectable(Y1, { propertyTax: "2400.00", waterTax: "1800.00" })
  const plan = resolveTaxPlan({ amount: "2400.00", kind: "PROPERTY_TAX" }, [year])
  const result = allocateTaxPlan(plan, [year])

  it("clears property tax, leaves water tax untouched and ₹1,800 outstanding", () => {
    expect(result.outstandingAfter).toBe("1800.00")
    expect(result.lines[0]!.buckets).toMatchObject({ propertyTax: "2400.00", waterTax: "0.00" })
    const property = result.taxSummary.find((line) => line.bucket === "propertyTax")!
    const water = result.taxSummary.find((line) => line.bucket === "waterTax")!
    expect(property).toMatchObject({ before: "2400.00", paid: "2400.00", after: "0.00", status: "PAID" })
    expect(water).toMatchObject({ before: "1800.00", paid: "0.00", after: "1800.00", status: "UNPAID" })
  })

  it("the ledger agrees, without marking the consumer as fully paid", () => {
    const tax = position(
      [demand(Y1, { payments: "2400.00", taggedPayments: { propertyTax: "2400.00" } })],
      Y1
    )
    expect(tax.current.propertyTax).toBe("0.00")
    expect(tax.current.waterTax).toBe("1800.00")
    expect(tax.total).toBe("1800.00")
  })
})

describe("2.3 Water arrears carry forward as water tax only", () => {
  const paidY1 = demand(Y1, { payments: "2400.00", taggedPayments: { propertyTax: "2400.00" } })
  const tax = position(
    [paidY1, demand(Y2, { propertyTax: "0.00", waterTax: "2000.00" })],
    Y2
  )

  it("₹1,800 arrears + ₹2,000 demand = ₹3,800 water tax payable", () => {
    expect(tax.arrears.waterTax).toBe("1800.00")
    expect(tax.current.waterTax).toBe("2000.00")
    expect(tax.outstanding.waterTax).toBe("3800.00")
  })

  it("never becomes property-tax arrears, and keeps its original year", () => {
    expect(tax.arrears.propertyTax).toBe("0.00")
    expect(tax.outstanding.propertyTax).toBe("0.00")
    const first = tax.years.find((row) => row.assessmentYearCode === Y1.code)!
    expect(first.ledger.balance.waterTax).toBe("1800.00")
  })

  it("the next water payment settles the oldest water liability first", () => {
    const years = [
      collectable(Y1, { waterTax: "1800.00" }),
      collectable(Y2, { waterTax: "2000.00" }),
    ]
    const result = allocateTaxPlan(
      resolveTaxPlan({ amount: "2000.00", kind: "WATER_TAX" }, years),
      years
    )
    expect(result.lines.map((line) => [line.assessmentYearCode, line.buckets.waterTax])).toEqual([
      [Y1.code, "1800.00"],
      [Y2.code, "200.00"],
    ])
  })

  it("an unpaid property balance likewise stays property tax", () => {
    const later = position(
      [
        demand(Y1, { payments: "1800.00", taggedPayments: { waterTax: "1800.00" } }),
        demand(Y2, { propertyTax: "100.00", waterTax: "0.00" }),
      ],
      Y2
    )
    expect(later.arrears).toMatchObject({ propertyTax: "2400.00", waterTax: "0.00" })
  })

  it("does not duplicate arrears: the total equals the engine's outstanding", () => {
    const breakdown = calculateOutstanding({
      selectedYear: Y2,
      demands: [paidY1, demand(Y2, { propertyTax: "0.00", waterTax: "2000.00" })],
      payments: [],
      calculatedCurrent: null,
    })
    expect(breakdown.taxPosition.total).toBe(breakdown.netOutstanding)
    expect(breakdown.netOutstanding).toBe("3800.00")
  })
})

describe("2.4 and 2.5 Partial and combined payments", () => {
  const year = collectable(Y1, { propertyTax: "2400.00", waterTax: "1800.00" })

  it("₹1,500 property + ₹500 water leaves ₹900 and ₹1,300", () => {
    const plan = resolveTaxPlan(
      { amount: "2000.00", kind: "COMBINED", parts: { propertyTax: "1500.00", waterTax: "500.00" } },
      [year]
    )
    const result = allocateTaxPlan(plan, [year])
    expect(result.outstandingAfter).toBe("2200.00")
    const after = Object.fromEntries(result.taxSummary.map((line) => [line.bucket, line.after]))
    expect(after).toEqual({ propertyTax: "900.00", waterTax: "1300.00" })
    expect(result.taxSummary.every((line) => line.status === "PARTIALLY_PAID")).toBe(true)
  })

  it("a full combined payment clears both", () => {
    const plan = resolveTaxPlan(
      { amount: "4200.00", kind: "COMBINED", parts: { propertyTax: "2400.00", waterTax: "1800.00" } },
      [year]
    )
    expect(allocateTaxPlan(plan, [year]).outstandingAfter).toBe("0.00")
  })

  it("refuses tax amounts that do not add up to the amount received", () => {
    expect(() =>
      resolveTaxPlan(
        { amount: "2000.00", kind: "COMBINED", parts: { propertyTax: "1500.00", waterTax: "400.00" } },
        [year]
      )
    ).toThrow(expect.objectContaining({ code: "TAX_SPLIT_MISMATCH" }))
  })

  it("never moves an excess to the other tax", () => {
    const plan = resolveTaxPlan({ amount: "2500.00", kind: "PROPERTY_TAX" }, [year])
    expect(() => allocateTaxPlan(plan, [year])).toThrow(
      expect.objectContaining({ code: "TAX_OVERPAYMENT" })
    )
  })

  it("a single-tax payment cannot include another tax", () => {
    expect(() =>
      resolveTaxPlan(
        { amount: "100.00", kind: "WATER_TAX", parts: { propertyTax: "100.00" } },
        [year]
      )
    ).toThrow(expect.objectContaining({ code: "TAX_KIND_MISMATCH" }))
  })

  it("a partial payment must say which tax it is for", () => {
    expect(() => resolveTaxPlan({ amount: "100.00" }, [year])).toThrow(
      expect.objectContaining({ code: "TAX_SPLIT_REQUIRED" })
    )
    expect(() => resolveTaxPlan({ amount: "0.00" }, [year])).toThrow(CollectionRuleError)
    expect(resolveTaxPlan({ amount: "4200.00" }, [year]).parts).toMatchObject({
      propertyTax: "2400.00",
      waterTax: "1800.00",
    })
  })

  it("gateway money that no longer fits is left unallocated, not moved", () => {
    const small = collectable(Y1, { propertyTax: "100.00", waterTax: "1800.00" })
    const result = allocateTaxPlan(
      { kind: "PROPERTY_TAX", parts: bucketsOf({ propertyTax: "2400.00" }) },
      [small],
      { strict: false }
    )
    expect(result.unallocated).toBe("2300.00")
    expect(result.lines[0]!.buckets).toMatchObject({ propertyTax: "100.00", waterTax: "0.00" })
    expect(result.outstandingAfter).toBe("1800.00")
  })
})

describe("Payments accepted before tax-wise accounting", () => {
  const years = [
    collectable(Y1, { propertyTax: "1000.00", waterTax: "500.00" }),
    collectable(Y2, { propertyTax: "700.00", waterTax: "300.00" }),
  ]

  it("follow the rule in force when they were accepted: oldest year first, water before property", () => {
    const result = allocateTaxPlan(legacyTaxPlan("1700.00", years), years)
    expect(result.lines.map((line) => [line.assessmentYearCode, line.buckets.waterTax, line.buckets.propertyTax])).toEqual([
      [Y1.code, "500.00", "1000.00"],
      [Y2.code, "200.00", "0.00"],
    ])
    expect(result.outstandingAfter).toBe("800.00")
    expect(result.unallocated).toBe("0.00")
  })

  it("never allocate more than is owed", () => {
    expect(bucketTotal(legacyTaxPlan("9000.00", years).parts)).toBe("2500.00")
  })
})

describe("Online plan", () => {
  const outstanding = bucketsOf({ propertyTax: "2400.00", waterTax: "1800.00", charges: "50.00" })

  it("each option pays only its own tax", () => {
    expect(onlineTaxPlan("PROPERTY_TAX", outstanding).parts).toEqual(bucketsOf({ propertyTax: "2400.00" }))
    expect(onlineTaxPlan("WATER_TAX", outstanding).parts).toEqual(bucketsOf({ waterTax: "1800.00" }))
    expect(bucketTotal(onlineTaxPlan("COMBINED", outstanding).parts)).toBe("4250.00")
  })

  it("ignores a negative balance", () => {
    const parts = onlineTaxPlan("COMBINED", bucketsOf({ propertyTax: "-10.00", waterTax: "5.00" })).parts
    expect(parts.propertyTax).toBe("0.00")
    expect(bucketTotal(parts)).toBe("5.00")
  })
})

describe("Tax ledger arithmetic", () => {
  const base = {
    propertyTax: "3000.00",
    waterTax: "2000.00",
    drainageTax: "500.00",
    penalty: "0.00",
    interest: "100.00",
    currentYearDemand: "5500.00",
    rebate: "0.00",
    credits: "0.00",
    debits: "0.00",
    payments: "0.00",
    balanceKind: "COMPONENTS" as const,
  }

  it("payments from before this feature settle in the existing order", () => {
    const ledger = yearTaxLedger({ ...base, payments: "2600.00" })
    expect(ledger.balance).toMatchObject({
      charges: "0.00",
      drainageTax: "0.00",
      waterTax: "0.00",
      propertyTax: "3000.00",
    })
  })

  it("a later tagged payment does not move what an old untagged one settled", () => {
    const before = yearTaxLedger({ ...base, payments: "600.00" })
    expect(before.balance).toMatchObject({ charges: "0.00", drainageTax: "0.00", waterTax: "2000.00" })
    const after = yearTaxLedger({
      ...base,
      payments: "1600.00",
      taggedPayments: { propertyTax: "1000.00" },
    })
    expect(after.balance).toMatchObject({
      charges: "0.00",
      drainageTax: "0.00",
      waterTax: "2000.00",
      propertyTax: "2000.00",
    })
  })

  it("a rebate published per tax reduces only that tax", () => {
    const ledger = yearTaxLedger({
      ...base,
      rebate: "200.00",
      chargeBreakdown: {
        mode: "CATEGORY",
        lines: [{ category: "WATER_TAX", penalty: "0.00", rebate: "200.00" }],
      },
    })
    expect(ledger.balance.waterTax).toBe("1800.00")
    expect(ledger.balance.propertyTax).toBe("3000.00")
  })

  it("a penalty published per tax is owed under that tax", () => {
    const ledger = yearTaxLedger({
      ...base,
      penalty: "90.00",
      currentYearDemand: "5590.00",
      chargeBreakdown: {
        mode: "CATEGORY",
        lines: [{ category: "PROPERTY_TAX", penalty: "90.00", rebate: "0.00" }],
      },
    })
    expect(ledger.balance.propertyTax).toBe("3090.00")
    expect(ledger.unpaidPenalty.propertyTax).toBe("90.00")
    expect(ledger.balance.charges).toBe("100.00")
  })

  it("a credit naming a tax reduces that tax", () => {
    const ledger = yearTaxLedger({ ...base, credits: "300.00", taggedCredits: { waterTax: "300.00" } })
    expect(ledger.balance.waterTax).toBe("1700.00")
    expect(ledger.balance.drainageTax).toBe("500.00")
  })

  it("a closing-only balance stays unsplit: it is never guessed into a tax", () => {
    const ledger = yearTaxLedger({
      ...base,
      propertyTax: "700.00",
      waterTax: "0.00",
      drainageTax: "0.00",
      interest: "0.00",
      currentYearDemand: "700.00",
      balanceKind: "CLOSING_ONLY",
    })
    expect(ledger.balance).toMatchObject({ historical: "700.00", propertyTax: "0.00" })
  })

  it("the buckets always add up to the year's outstanding, whatever the mix", () => {
    const cases = [
      { payments: "0.00" },
      { payments: "6000.00" },
      { payments: "1234.56", taggedPayments: { waterTax: "1000.00" } },
      { credits: "99.99", debits: "10.00", payments: "500.00", rebate: "50.00" },
      { credits: "20.00", taggedCredits: { drainageTax: "20.00" }, debits: "5.00", taggedDebits: { waterTax: "5.00" } },
      { payments: "7000.00", taggedPayments: { propertyTax: "7000.00" } },
    ]
    for (const over of cases) {
      const ledger = yearTaxLedger({ ...base, ...over })
      expect(ledger.total).toBe(
        ownOutstanding({
          currentYearDemand: base.currentYearDemand,
          interest: base.interest,
          credits: over.credits ?? "0.00",
          debits: over.debits ?? "0.00",
          payments: over.payments ?? "0.00",
          rebate: over.rebate ?? "0.00",
        })
      )
    }
  })
})

describe("Receipts", () => {
  const snapshot = (over: Partial<ReceiptSnapshot>): ReceiptSnapshot => ({
    municipality: "Nagar Palika Parishad Dhanaura",
    receiptNumber: "RCP-1",
    receiptAt: "2 Nov 2026",
    propertyId: "P-1",
    ownerName: "Ram",
    address: "Ward 1",
    ward: "Ward 1",
    assessmentYear: Y1.code,
    demandReference: "DM-1",
    propertyTax: "2400.00",
    waterTax: "1800.00",
    drainageTax: "0.00",
    previousDues: "0.00",
    rebate: "0.00",
    penalty: "0.00",
    interest: "0.00",
    totalPayable: "4200.00",
    amountReceived: "2400.00",
    paymentMode: "CASH",
    remaining: "1800.00",
    amountInWords: "Rupees two thousand four hundred only",
    cashierName: "Clerk",
    counterCode: "",
    allocationText: "",
    taxKind: "PROPERTY_TAX",
    taxSummary: [
      { label: "Property tax", labelHi: "संपत्ति कर", before: "2400.00", paid: "2400.00", after: "0.00", status: "PAID" },
      { label: "Water tax", labelHi: "जल कर", before: "1800.00", paid: "0.00", after: "1800.00", status: "UNPAID" },
    ],
    ...over,
  })

  it("names the tax in the title and shows each tax's position", () => {
    const html = renderReceiptHtml(snapshot({}), { copy: "consumer" })
    expect(html).toContain("Property Tax Receipt")
    expect(html).toContain("Tax-wise position")
    expect(html).toContain("Unpaid / अवैतनिक")
    expect(html).toContain("Paid / भुगतान")
  })

  it("has water-only and combined titles", () => {
    expect(renderReceiptHtml(snapshot({ taxKind: "WATER_TAX" }))).toContain("Water Tax Receipt")
    expect(renderReceiptHtml(snapshot({ taxKind: "COMBINED" }))).toContain("Combined Tax Receipt")
  })

  it("older receipts without a split still print", () => {
    const html = renderReceiptHtml(snapshot({ taxKind: undefined, taxSummary: undefined }))
    expect(html).toContain("Property Tax Receipt")
    expect(html).not.toContain("Tax-wise position")
  })

  it("flags money held for reconciliation", () => {
    expect(renderReceiptHtml(snapshot({ unallocated: "100.00" }))).toContain("held for reconciliation")
  })
})
