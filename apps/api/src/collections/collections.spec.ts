import { allocateOldestFirst, formatReceiptNumber, idempotencyDecision, propertyPosition, replayedReceipt } from "./collection-rules"
import { renderReceiptHtml, type ReceiptSnapshot } from "./receipt-html"
import { rupeesInWords } from "./rupees-in-words"
import { allocationCounts } from "../demands/outstanding"

const snapshot = {
  municipality: "Nagar Palika Parishad Dhanaura",
  receiptNumber: "RCP-20252026-000001",
  receiptAt: "19 Oct 2026, 10:00 am",
  propertyId: "P-1",
  ownerName: "Owner",
  address: "House 1",
  ward: "Ward 1",
  assessmentYear: "2025-2026",
  demandReference: "DM-1",
  propertyTax: "4000.00",
  waterTax: "0.00",
  drainageTax: "0.00",
  previousDues: "2000.00",
  rebate: "600.00",
  penalty: "540.00",
  interest: "0.00",
  totalPayable: "5940.00",
  amountReceived: "1000.00",
  paymentMode: "CASH",
  remaining: "4940.00",
  amountInWords: "",
  cashierName: "Cashier",
  counterCode: "Counter 1",
  allocationText: "2024-2025 ₹ 1000.00",
} satisfies ReceiptSnapshot

describe("offline collection rules", () => {
  const years = [
    { assessmentDemandId: "old", assessmentYearCode: "2024-2025", unpaid: "2000.00" },
    { assessmentDemandId: "new", assessmentYearCode: "2025-2026", unpaid: "3940.00" },
  ]

  it("allocates a partial payment to the oldest outstanding year", () => {
    expect(allocateOldestFirst("1000.00", years)).toEqual([
      { assessmentDemandId: "old", assessmentYearCode: "2024-2025", amount: "1000.00" },
    ])
  })

  it("settles the full outstanding balance across years", () => {
    const lines = allocateOldestFirst("5940.00", years)
    expect(lines.map((line) => line.amount)).toEqual(["2000.00", "3940.00"])
  })

  it("rejects an amount above the locked balance", () => {
    expect(() => allocateOldestFirst("5940.01", years)).toThrow(/outstanding balance/)
  })

  it("replays the same receipt number and does not create a payment", () => {
    expect(replayedReceipt({ receiptNumber: "RCP-20252026-000001" })).toEqual({
      created: false,
      receiptNumber: "RCP-20252026-000001",
    })
  })

  it("treats a repeated idempotency key as a replay and a changed payload as a conflict", () => {
    const existing = { amount: "100.00", surveyId: "s1" }
    expect(idempotencyDecision(existing, { amount: "100.00", surveyId: "s1" })).toBe("replay")
    expect(idempotencyDecision(existing, { amount: "90.00", surveyId: "s1" })).toBe("conflict")
    expect(idempotencyDecision(null, { amount: "100.00", surveyId: "s1" })).toBe("create")
  })

  it("keeps receipt numbers unique for a year", () => {
    const first = formatReceiptNumber("2025-2026", 1)
    const second = formatReceiptNumber("2025-2026", 2)
    expect(first).toBe("RCP-20252026-000001")
    expect(second).not.toBe(first)
  })

  it("restores outstanding when a payment is reversed", () => {
    expect(allocationCounts("ACTIVE", "SUCCESS")).toBe(true)
    expect(allocationCounts("REVERSED", "REFUNDED")).toBe(false)
    const open = propertyPosition("2025-2026", [
      {
        yearCode: "2024-2025",
        propertyTax: "2000.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
        currentYearDemand: "2000.00",
        rebate: "0.00",
        credits: "0.00",
        debits: "0.00",
        payments: "0.00",
      },
      {
        yearCode: "2025-2026",
        propertyTax: "4000.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "540.00",
        interest: "0.00",
        currentYearDemand: "4540.00",
        rebate: "600.00",
        credits: "0.00",
        debits: "0.00",
        payments: "1000.00",
      },
    ])
    expect(open.previousArrears).toBe("2000.00")
    expect(open.payable).toBe("5940.00")
    expect(open.outstanding).toBe("4940.00")
    expect(open.status).toBe("PARTIAL")
    const reversed = propertyPosition("2025-2026", [
      {
        yearCode: "2024-2025",
        propertyTax: "2000.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
        currentYearDemand: "2000.00",
        rebate: "0.00",
        credits: "0.00",
        debits: "0.00",
        payments: "0.00",
      },
      {
        yearCode: "2025-2026",
        propertyTax: "4000.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "540.00",
        interest: "0.00",
        currentYearDemand: "4540.00",
        rebate: "600.00",
        credits: "0.00",
        debits: "0.00",
        payments: "0.00",
      },
    ])
    expect(reversed.outstanding).toBe("5940.00")
    expect(reversed.status).toBe("UNPAID")
  })
})

describe("receipt document", () => {
  it("prints both copies with the same figures on one A4 page", () => {
    const html = renderReceiptHtml(snapshot)
    expect(html).toContain("OFFICE COPY / कार्यालय प्रति")
    expect(html).toContain("CUSTOMER COPY / ग्राहक प्रति")
    expect(html.match(/RCP-20252026-000001/g)).toHaveLength(3)
    expect(html.match(/4940\.00|4,940\.00/g)?.length).toBeGreaterThanOrEqual(2)
    expect(html).toContain("size: A4 portrait")
    expect(html.match(/class="sheet"/g)).toHaveLength(1)
    expect(html).not.toContain("page-break-after: always")
  })

  it("spells the example payable amount in rupees", () => {
    expect(rupeesInWords("5940.00")).toBe(
      "Rupees Five Thousand Nine Hundred Forty Only"
    )
  })
})
