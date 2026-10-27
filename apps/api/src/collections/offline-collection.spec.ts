/**
 * Offline collection, receipts, ledger and carry-forward (brief tests A–K),
 * run against the real calculation modules. "Ram" is an illustration only;
 * no amount here is a configured municipal rate.
 */
import { REQUIRE_PERMISSIONS_KEY } from "../auth/auth.decorators"
import { calculateOutstanding, type LedgerDemand } from "../demands/outstanding"
import { outstandingToNoticeLedger } from "../reports/demand-notice/demand-notice-view-model"
import {
  allocateWithComponents,
  CollectionRuleError,
  collectionInstant,
  type CollectableYear,
} from "./collection-rules"
import { CollectionsController } from "./collections.controller"
import {
  buildConsumerLedger,
  filterLedgerEntries,
  type LedgerAllocationInput,
  type LedgerDemandInput,
} from "./consumer-ledger"
import { renderReceiptHtml, type ReceiptSnapshot } from "./receipt-html"
import { buildYearEndReport, type YearEndFlags } from "./year-end"

const Y1 = { id: "y2025", code: "2025-2026", name: "2025-2026" }
const Y2 = { id: "y2026", code: "2026-2027", name: "2026-2027" }

function year(over: Partial<CollectableYear> & { unpaid: string }): CollectableYear {
  return {
    assessmentDemandId: "d-2025",
    assessmentYearCode: Y1.code,
    assessmentYearName: Y1.name,
    demandReference: "DM-2025",
    components: {
      propertyTax: "3000.00",
      waterTax: "2000.00",
      drainageTax: "0.00",
      penalty: "0.00",
      interest: "0.00",
    },
    appliedBefore: "0.00",
    balanceKind: "COMPONENTS",
    ...over,
  }
}

function allocation(
  id: string,
  amount: string,
  at: string,
  over: Partial<LedgerAllocationInput["payment"]> = {},
  status: "ACTIVE" | "REVERSED" = "ACTIVE"
): LedgerAllocationInput {
  return {
    id,
    amount,
    status,
    createdAt: new Date(at),
    reversedAt: status === "REVERSED" ? new Date(at) : null,
    payment: {
      id: `pay-${id}`,
      status: status === "REVERSED" ? "REFUNDED" : "SUCCESS",
      receiptNumber: `RCP-${id}`,
      paymentReference: `OFF-${id}`,
      gatewayReference: null,
      remarks: null,
      paymentMode: "CASH",
      collectionDate: new Date(at),
      createdAt: new Date(at),
      collectedByName: "Cashier",
      chequeDdReference: null,
      reversedAt: status === "REVERSED" ? new Date(at) : null,
      reversalReason: status === "REVERSED" ? "Wrong property" : null,
      postedParts: null,
      ...over,
    },
  }
}

function ledgerDemand(
  y: { id: string; code: string; name: string },
  over: Partial<LedgerDemandInput> = {}
): LedgerDemandInput {
  return {
    id: `d-${y.code}`,
    assessmentYearId: y.id,
    assessmentYearCode: y.code,
    assessmentYearName: y.name,
    demandReference: `DM-${y.code}`,
    publishedAt: new Date(`${y.code.slice(0, 4)}-04-10T05:00:00Z`),
    verificationStatus: "VERIFIED",
    balanceKind: "COMPONENTS",
    propertyTax: "3000.00",
    waterTax: "2000.00",
    drainageTax: "0.00",
    penalty: "0.00",
    interest: "0.00",
    currentYearDemand: "5000.00",
    rebateAmount: "0.00",
    historicalPayments: "0.00",
    sourceReference: null,
    publishedByName: "Clerk",
    adjustments: [],
    allocations: [],
    ...over,
  }
}

function engineDemand(code: string, id: string, over: Partial<LedgerDemand>): LedgerDemand {
  return {
    id: `d-${code}`,
    assessmentYearId: id,
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

function snapshot(over: Partial<ReceiptSnapshot> = {}): ReceiptSnapshot {
  return {
    municipality: "Nagar Palika Parishad Dhanaura",
    receiptNumber: "RCP-20252026-000007",
    receiptAt: "27 Oct 2026, 11:15 am",
    propertyId: "249044-001-000001-001-R",
    ownerName: "Ram",
    address: "House 1, Dhanaura",
    ward: "Ward 1",
    assessmentYear: Y1.code,
    demandReference: "DM-2025",
    propertyTax: "3000.00",
    waterTax: "2000.00",
    drainageTax: "0.00",
    previousDues: "0.00",
    rebate: "0.00",
    penalty: "0.00",
    interest: "0.00",
    totalPayable: "5000.00",
    amountReceived: "3000.00",
    paymentMode: "CASH",
    remaining: "2000.00",
    amountInWords: "",
    cashierName: "Counter Clerk",
    counterCode: "C-1",
    allocationText: "2025-2026 ₹ 3000.00",
    paymentId: "pay-internal-123",
    collectorId: "user-clerk-9",
    allocations: [
      {
        assessmentYearCode: Y1.code,
        assessmentYearName: Y1.name,
        closingBalanceOnly: false,
        amount: "3000.00",
        outstandingAfter: "2000.00",
        parts: {
          propertyTax: "1000.00",
          waterTax: "2000.00",
          drainageTax: "0.00",
          penalty: "0.00",
          interest: "0.00",
        },
      },
    ],
    ...over,
  }
}

const noFlags: YearEndFlags = {
  unverifiedDemands: 0,
  unverifiedAmount: "0.00",
  pendingInstruments: 0,
  pendingAmount: "0.00",
  paymentsWithoutDemand: 0,
  unassignedPayments: 0,
  gapProperties: 0,
}

describe("Test A: Ram pays ₹3,000 of a ₹5,000 demand", () => {
  const result = allocateWithComponents("3000.00", [year({ unpaid: "5000.00" })])

  it("records ₹3,000 received and ₹2,000 still outstanding", () => {
    expect(result.outstandingBefore).toBe("5000.00")
    expect(result.outstandingAfter).toBe("2000.00")
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0]!.amount).toBe("3000.00")
    expect(result.lines[0]!.outstandingAfter).toBe("2000.00")
  })

  it("keeps the split between water tax and property tax (existing order)", () => {
    expect(result.lines[0]!.parts).toEqual({
      interest: "0.00",
      penalty: "0.00",
      drainageTax: "0.00",
      waterTax: "2000.00",
      propertyTax: "1000.00",
    })
  })

  it("never shows ₹5,000 as the amount received on the receipt", () => {
    const html = renderReceiptHtml(snapshot())
    expect(html).toContain("PARTIAL PAYMENT RECEIVED")
    expect(html).toMatch(/class="received">₹ 3,000\.00</)
    expect(html).not.toMatch(/class="received">₹ 5,000\.00</)
    expect(html).toContain("₹ 2,000.00 still due")
  })

  it("keeps the ₹2,000 on the ledger with a running balance", () => {
    const ledger = buildConsumerLedger({
      demands: [
        ledgerDemand(Y1, { allocations: [allocation("a1", "3000.00", "2025-07-01T06:00:00Z")] }),
      ],
    })
    const payment = ledger.entries.find((entry) => entry.type === "PAYMENT")!
    expect(payment.credit).toBe("3000.00")
    expect(payment.balanceAfter).toBe("2000.00")
    expect(ledger.closingBalance).toBe("2000.00")
    expect(ledger.reconciles).toBe(true)
    expect(ledger.years[0]!.outstanding).toBe("2000.00")
  })

  it("rejects zero, negative-like and above-balance amounts", () => {
    expect(() => allocateWithComponents("0.00", [year({ unpaid: "5000.00" })])).toThrow(
      CollectionRuleError
    )
    expect(() => allocateWithComponents("5000.01", [year({ unpaid: "5000.00" })])).toThrow(
      /outstanding balance/
    )
  })
})

describe("Test B: carry-forward into 2026-27", () => {
  const engine = calculateOutstanding({
    selectedYear: Y2,
    demands: [
      engineDemand(Y1.code, Y1.id, {
        propertyTax: "3000.00",
        waterTax: "2000.00",
        currentYearDemand: "5000.00",
        payments: "3000.00",
      }),
      engineDemand(Y2.code, Y2.id, {
        propertyTax: "2500.00",
        waterTax: "1500.00",
        currentYearDemand: "4000.00",
      }),
    ],
    payments: [],
    calculatedCurrent: null,
  })

  it("opens 2026-27 with the verified ₹2,000, not the original ₹5,000", () => {
    expect(engine.openingArrears).toBe("2000.00")
    expect(engine.currentYearDemand).toBe("4000.00")
    expect(engine.totalPayable).toBe("6000.00")
    expect(engine.netOutstanding).toBe("6000.00")
    expect(engine.authoritative).toBe(true)
  })

  it("prints ₹2,000 as previous-year arrears and ₹4,000 as current demand on the notice", () => {
    const { ledger, snapshot: current } = outstandingToNoticeLedger({
      ...engine,
      selectedYearCode: Y2.code,
      unreconciledYears: engine.unreconciledYears,
    })
    expect(ledger.previousArrears).toBe(2000)
    expect(ledger.currentYearDemand).toBe(4000)
    expect(ledger.totalPayable).toBe(6000)
    expect(current.totalDemand).toBe(4000)
    // The arrears row keeps its origin year and is not added twice.
    expect(ledger.years.map((row) => row.assessmentYear)).toEqual([Y1.name])
    expect(ledger.years[0]!.outstanding).toBe(2000)
    // Unpaid 2025-26 water tax was settled first; property tax remains.
    expect(ledger.previousPropertyTax).toBe(2000)
    expect(ledger.previousWaterTax).toBe(0)
  })

  it("shows the opening balance as the earlier year's closing balance on the ledger", () => {
    const ledger = buildConsumerLedger({
      demands: [
        ledgerDemand(Y1, { allocations: [allocation("a1", "3000.00", "2025-07-01T06:00:00Z")] }),
        ledgerDemand(Y2, { propertyTax: "2500.00", waterTax: "1500.00", currentYearDemand: "4000.00" }),
      ],
    })
    const [first, second] = ledger.years
    expect(first!.closingBalance).toBe("2000.00")
    expect(second!.openingBalance).toBe("2000.00")
    expect(second!.closingBalance).toBe("6000.00")
    expect(ledger.closingBalance).toBe("6000.00")
  })
})

describe("Test C: ₹1,000 later paid against the old ₹2,000", () => {
  const lines = allocateWithComponents("1000.00", [
    year({ unpaid: "2000.00", appliedBefore: "3000.00" }),
    year({
      assessmentDemandId: "d-2026",
      assessmentYearCode: Y2.code,
      assessmentYearName: Y2.name,
      unpaid: "4000.00",
      components: {
        propertyTax: "2500.00",
        waterTax: "1500.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
      },
    }),
  ])

  it("reduces 2025-26 property tax, not the new year", () => {
    expect(lines.lines).toHaveLength(1)
    expect(lines.lines[0]!.assessmentYearCode).toBe(Y1.code)
    expect(lines.lines[0]!.parts.propertyTax).toBe("1000.00")
    expect(lines.lines[0]!.parts.waterTax).toBe("0.00")
    expect(lines.lines[0]!.outstandingAfter).toBe("1000.00")
    expect(lines.outstandingAfter).toBe("5000.00")
  })

  it("updates the old year and the overall ledger", () => {
    const ledger = buildConsumerLedger({
      demands: [
        ledgerDemand(Y1, {
          allocations: [
            allocation("a1", "3000.00", "2025-07-01T06:00:00Z"),
            allocation("a2", "1000.00", "2026-05-02T06:00:00Z"),
          ],
        }),
        ledgerDemand(Y2, { propertyTax: "2500.00", waterTax: "1500.00", currentYearDemand: "4000.00" }),
      ],
    })
    expect(ledger.years[0]!.outstanding).toBe("1000.00")
    expect(ledger.years[1]!.openingBalance).toBe("1000.00")
    expect(ledger.closingBalance).toBe("5000.00")
    const second = ledger.entries.find((entry) => entry.id === "allocation:a2")!
    expect(second.parts.propertyTax).toBe("-1000.00")
    expect(second.yearBalanceAfter).toBe("1000.00")
    expect(ledger.reconciles).toBe(true)
  })
})

describe("Test D: full payment", () => {
  it("₹5,000 against ₹5,000 leaves ₹0", () => {
    const result = allocateWithComponents("5000.00", [year({ unpaid: "5000.00" })])
    expect(result.outstandingAfter).toBe("0.00")
    const html = renderReceiptHtml(
      snapshot({ amountReceived: "5000.00", remaining: "0.00" })
    )
    expect(html).toContain("FULLY PAID")
    expect(html).not.toContain("PARTIAL PAYMENT RECEIVED")
  })
})

describe("Test F: consumer and office copies", () => {
  const both = renderReceiptHtml(snapshot(), {
    office: { paymentStatus: "SUCCESS", printedBy: "Supervisor", printedAt: "27 Oct 2026" },
  })
  const consumer = renderReceiptHtml(snapshot(), { copy: "consumer" })
  const office = renderReceiptHtml(snapshot(), {
    copy: "office",
    office: { paymentStatus: "SUCCESS", printedBy: "Supervisor", printedAt: "27 Oct 2026" },
  })

  it("prints both copies from one posted payment and one receipt number", () => {
    expect(both.match(/data-receipt="RCP-20252026-000007"/g)).toHaveLength(2)
    expect(both).toContain('data-copy="office"')
    expect(both).toContain('data-copy="consumer"')
  })

  it("keeps internal reconciliation fields off the consumer copy", () => {
    expect(consumer).toContain("CONSUMER COPY")
    expect(consumer).not.toContain("OFFICE COPY")
    expect(consumer).not.toContain("pay-internal-123")
    expect(consumer).not.toContain("user-clerk-9")
    expect(consumer).not.toContain("Office reconciliation")
    expect(consumer).toContain("₹ 3,000.00")
    expect(consumer).toContain("₹ 2,000.00")
  })

  it("shows payment ID, collector, status and printer on the office copy", () => {
    expect(office).toContain("OFFICE COPY")
    expect(office).toContain("pay-internal-123")
    expect(office).toContain("user-clerk-9")
    expect(office).toContain("Printed / मुद्रित")
    expect(office).toContain("Supervisor")
  })

  it("shows the tax-wise allocation on both copies", () => {
    for (const html of [consumer, office]) {
      expect(html).toContain("How this payment was applied")
      expect(html).toContain("₹ 1,000.00")
    }
  })

  it("moves the consumer copy to its own page when the allocation is long", () => {
    const many = snapshot({
      allocations: ["2021-2022", "2022-2023", "2023-2024", "2024-2025"].map((code) => ({
        ...snapshot().allocations![0]!,
        assessmentYearCode: code,
        assessmentYearName: code,
      })),
    })
    const html = renderReceiptHtml(many)
    expect(html).toContain('<div class="page-break">')
    expect(html).not.toContain('class="sheet shared"')
  })
})

describe("Test G/H: year-end reconciliation", () => {
  const lines = [
    { surveyId: "ram", yearCode: Y1.code, demand: "5000.00", rebate: "0", credits: "0", payments: "3000.00", ownOutstanding: "2000.00" },
    { surveyId: "sita", yearCode: Y1.code, demand: "1000.00", rebate: "100.00", credits: "0", payments: "900.00", ownOutstanding: "0.00" },
  ]

  it("opening of each year equals the previous closing, recomputed from components", () => {
    const report = buildYearEndReport({
      yearCode: Y1.code,
      lines: [
        { surveyId: "ram", yearCode: "2024-2025", demand: "800.00", rebate: "0", credits: "0", payments: "300.00", ownOutstanding: "500.00" },
        ...lines,
      ],
      flags: noFlags,
    })
    expect(report.rows.map((row) => [row.yearCode, row.openingArrears, row.closingBalance])).toEqual([
      ["2024-2025", "0.00", "500.00"],
      [Y1.code, "500.00", "2500.00"],
    ])
    expect(report.chainOk).toBe(true)
    expect(report.closingCarryForward).toBe("2500.00")
    expect(report.blockingIssues).toEqual([])
  })

  it("detects a year whose stored outstanding does not match its components", () => {
    const report = buildYearEndReport({
      yearCode: Y1.code,
      lines: [{ ...lines[0]!, ownOutstanding: "2500.00" }],
      flags: noFlags,
    })
    expect(report.chainOk).toBe(false)
  })

  it("explains next-year opening arrears that changed after publication", () => {
    const report = buildYearEndReport({
      yearCode: Y1.code,
      lines,
      nextYear: { yearCode: Y2.code, storedOpening: [{ surveyId: "ram", openingArrears: "3000.00" }] },
      flags: noFlags,
    })
    expect(report.nextYear?.currentCarryForward).toBe("2000.00")
    expect(report.nextYear?.difference).toBe("1000.00")
    expect(report.nextYear?.mismatchedProperties).toBe(1)
  })

  it("Test H: flags unverified and missing history instead of treating it as zero", () => {
    const report = buildYearEndReport({
      yearCode: Y1.code,
      lines,
      flags: { ...noFlags, unverifiedDemands: 2, unverifiedAmount: "700.00", gapProperties: 1 },
    })
    expect(report.blockingIssues.join(" ")).toMatch(/not verified/)
    expect(report.blockingIssues.join(" ")).toMatch(/no verified balance/)

    const engine = calculateOutstanding({
      selectedYear: Y2,
      demands: [
        engineDemand(Y1.code, Y1.id, { currentYearDemand: "5000.00", propertyTax: "5000.00", verificationStatus: "UNVERIFIED" }),
        engineDemand(Y2.code, Y2.id, { currentYearDemand: "4000.00", propertyTax: "4000.00" }),
      ],
      payments: [],
      calculatedCurrent: null,
    })
    expect(engine.authoritative).toBe(false)
    expect(engine.openingArrears).toBe("0.00")
    expect(engine.unreconciledYears.map((row) => row.code)).toEqual([Y1.code])

    const ledger = buildConsumerLedger({
      demands: [ledgerDemand(Y1, { verificationStatus: "UNVERIFIED" }), ledgerDemand(Y2)],
    })
    const unverified = ledger.entries.find((entry) => entry.assessmentYearCode === Y1.code)!
    expect(unverified.status).toBe("UNVERIFIED")
    expect(unverified.counted).toBe(false)
  })
})

describe("Test J: ledger, reversals and filters agree with the engine", () => {
  const ledger = buildConsumerLedger({
    demands: [
      ledgerDemand(Y1, {
        rebateAmount: "250.00",
        adjustments: [
          { id: "c1", kind: "CREDIT", amount: "100.00", reason: "Area corrected", createdAt: new Date("2025-06-01T06:00:00Z"), createdByName: "Admin" },
        ],
        allocations: [
          allocation("a1", "3000.00", "2025-07-01T06:00:00Z"),
          allocation("bad", "500.00", "2025-07-02T06:00:00Z", {}, "REVERSED"),
        ],
      }),
    ],
    pendingPayments: [
      {
        id: "chq",
        amount: "400.00",
        paymentMode: "CHEQUE",
        collectionDate: new Date("2025-08-01T06:00:00Z"),
        createdAt: new Date("2025-08-01T06:00:00Z"),
        collectedByName: "Clerk",
        chequeDdReference: "000123",
        assessmentYearCode: Y1.code,
        assessmentYearName: Y1.name,
      },
    ],
  })

  it("keeps the reversed payment and its reversal, and nets them to zero", () => {
    const types = ledger.entries.map((entry) => `${entry.type}:${entry.status}`)
    expect(types).toContain("PAYMENT:REVERSED")
    expect(types).toContain("PAYMENT_REVERSAL:POSTED")
    expect(ledger.closingBalance).toBe("1650.00") // 5000 − 250 − 100 − 3000
    expect(ledger.reconciles).toBe(true)
  })

  it("shows a pending cheque without counting it", () => {
    const pending = ledger.entries.find((entry) => entry.type === "PENDING_PAYMENT")!
    expect(pending.counted).toBe(false)
    expect(pending.balanceAfter).toBe("1650.00")
  })

  it("filters by status and tax without changing running balances", () => {
    const reversed = filterLedgerEntries(ledger.entries, { status: "REVERSED" })
    expect(reversed.map((entry) => entry.id)).toEqual(["allocation:bad"])
    const water = filterLedgerEntries(ledger.entries, { category: "waterTax" })
    expect(water.every((entry) => entry.parts.waterTax !== "0.00")).toBe(true)
    const july = filterLedgerEntries(ledger.entries, { dateFrom: "2025-07-01", dateTo: "2025-07-01" })
    expect(july.map((entry) => entry.balanceAfter)).toEqual(["1650.00"])
  })
})

describe("Test K: server-side permissions on collection routes", () => {
  const permissionOf = (method: keyof CollectionsController) =>
    Reflect.getMetadata(REQUIRE_PERMISSIONS_KEY, CollectionsController.prototype[method]) as string[]

  it("posting and previewing need payment:collect", () => {
    expect(permissionOf("collect")).toEqual(["payment:collect"])
    expect(permissionOf("confirm")).toEqual(["payment:collect"])
    expect(permissionOf("preview")).toEqual(["payment:collect"])
  })

  it("closing a year needs settings:update; reading needs demand:read", () => {
    expect(permissionOf("closeYear")).toEqual(["settings:update"])
    expect(permissionOf("yearEnd")).toEqual(["demand:read"])
    expect(permissionOf("ledger")).toEqual(["demand:read"])
    expect(permissionOf("receipt")).toEqual(["demand:read"])
  })
})

describe("Payment date and time at the counter", () => {
  // 27 Oct 2026, 15:30 IST
  const now = new Date("2026-10-27T10:00:00Z")

  it("records the current time when no date or time is given", () => {
    expect(collectionInstant(undefined, undefined, now)).toEqual(now)
    expect(collectionInstant("2026-10-27", undefined, now)).toEqual(now)
  })

  it("records an earlier day at noon IST unless a time is typed", () => {
    expect(collectionInstant("2026-10-20", undefined, now).toISOString()).toBe("2026-10-20T06:30:00.000Z")
    expect(collectionInstant("2026-10-20", "17:45", now).toISOString()).toBe("2026-10-20T12:15:00.000Z")
  })

  it("takes a typed time today as IST", () => {
    expect(collectionInstant("2026-10-27", "11:05", now).toISOString()).toBe("2026-10-27T05:35:00.000Z")
  })

  it("refuses a future day or a time later today", () => {
    expect(() => collectionInstant("2026-10-28", undefined, now)).toThrow(
      expect.objectContaining({ code: "COLLECTION_DATE_IN_FUTURE" })
    )
    expect(() => collectionInstant("2026-10-27", "16:00", now)).toThrow(
      expect.objectContaining({ code: "COLLECTION_TIME_IN_FUTURE" })
    )
    // Within a minute of now is accepted (clock drift).
    expect(collectionInstant("2026-10-27", "15:31", now).toISOString()).toBe("2026-10-27T10:01:00.000Z")
  })
})
