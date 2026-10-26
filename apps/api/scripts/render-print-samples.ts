/**
 * Print check for official documents (receipt and demand notice).
 *
 *   pnpm --filter api exec tsx scripts/render-print-samples.ts <out-dir>
 *
 * Renders sample documents through the same Playwright PDF path the API uses,
 * saves PDFs and PNGs, and fails if any receipt copy or notice page overflows
 * its printable box (cut-off totals, signatures or disclaimers).
 */
import fs from "node:fs"
import path from "node:path"

import { chromium } from "playwright"

import { renderReceiptHtml, type ReceiptSnapshot } from "../src/collections/receipt-html"
import { calculateOutstanding } from "../src/demands/outstanding"
import { generateDemandNoticeDocumentHtml } from "../src/reports/demand-notice/demand-notice-html"
import { renderDemandNoticePdfFromHtml } from "../src/reports/demand-notice/demand-notice-pdf"
import {
  duesPayloadToNoticeViewModel,
  outstandingToNoticeLedger,
} from "../src/reports/demand-notice/demand-notice-view-model"

const out = path.resolve(process.argv[2] ?? "tmp/print-samples")
fs.mkdirSync(out, { recursive: true })

const receipt: ReceiptSnapshot = {
  municipality: "Nagar Palika Parishad Dhanaura",
  receiptNumber: "RCP-SAMPLE-000001",
  receiptAt: "26 Oct 2026, 10:30 am",
  propertyId: "249044-001-000001-001-R",
  ownerName: "राम कुमार अग्रवाल",
  address: "154, सुभाष नगर, Dhanaura",
  ward: "वार्ड नंबर 1 - सुभाषनगर (उत्तर-पश्चिम)",
  assessmentYear: "2025-2026",
  demandReference: "DMD-249044-001-000001-001-R-20252026",
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
  cashierName: "Sample Cashier",
  counterCode: "C1",
  allocationText: "2024-2025 ₹ 300.00; 2025-2026 ₹ 2200.00",
  fatherName: "श्याम लाल",
  wardNumber: "1",
  houseNo: "154",
  locality: "सुभाष नगर",
  mobileMasked: "98****3210",
}

function noticeHtml(): string {
  const breakdown = calculateOutstanding({
    selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
    demands: [],
    payments: [],
    calculatedCurrent: {
      propertyTax: "2400.00",
      waterTax: "1800.00",
      drainageTax: "0.00",
      penalty: "0.00",
      interest: "0.00",
      currentYearDemand: "4200.00",
    },
    lockedRebate: { amount: "420.00", scope: "property tax, water tax" },
  })
  const figures = outstandingToNoticeLedger(breakdown)
  const vm = duesPayloadToNoticeViewModel(
    {
      id: "sample",
      surveyId: "249044-001-000001-001-R",
      wardNumber: 1,
      wardName: "वार्ड नंबर 1 - सुभाषनगर (उत्तर-पश्चिम)",
      ownerName: "धर्मशाला",
      ownerFatherName: null,
      mobileMasked: null,
      propertyNo: "NEW",
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
      floors: [
        {
          floorLabel: "Ground Floor",
          usageType: "Residential",
          usageFactor: "Self Occupied",
          construction: "Pakka Building with R.C.C Roof or R.B. Roof",
          areaSqFt: 2500,
          rate: 1,
          alv: 24000,
          tax: 2400,
        },
      ],
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
        annualBaseRate: 12,
        configFound: true,
      },
    } as unknown as Parameters<typeof duesPayloadToNoticeViewModel>[0],
    { ledger: figures.ledger, snapshot: figures.snapshot }
  )
  return generateDemandNoticeDocumentHtml([vm], { forPdf: true })
}

async function main() {
  const docs: Array<[string, string, string]> = [
    ["receipt-partial", renderReceiptHtml(receipt), ".copy"],
    [
      "receipt-full",
      renderReceiptHtml({ ...receipt, amountReceived: "4500.00", remaining: "0.00" }),
      ".copy",
    ],
    [
      "receipt-reversed",
      renderReceiptHtml({
        ...receipt,
        paymentMode: "CHEQUE",
        paymentReference: "CHQ 004512",
        reversal: { at: "26 Oct 2026, 11:00 am", by: "Accounts Clerk", reason: "Cheque dishonoured by bank" },
      }),
      ".copy",
    ],
    ["demand-notice", noticeHtml(), "table, .card, section"],
  ]
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } })
  let failed = false
  for (const [name, html, selector] of docs) {
    fs.writeFileSync(path.join(out, `${name}.html`), html)
    const pdf = await renderDemandNoticePdfFromHtml(html)
    fs.writeFileSync(path.join(out, `${name}.pdf`), pdf)
    // Page-tree root of a Chromium PDF: "/Type /Pages ... /Count N".
    const pages = Number(/\/Count (\d+)/.exec(pdf.toString("latin1"))?.[1] ?? 0)
    if (pages !== 1) {
      console.log(`${name}: expected 1 A4 page, got ${pages}`)
      failed = true
    }
    await page.setContent(html, { waitUntil: "load" })
    await page.emulateMedia({ media: "print" })
    await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true })
    const overflow = await page.evaluate((sel) => {
      return [...document.querySelectorAll<HTMLElement>(sel)]
        .map((el) => el.scrollHeight - el.clientHeight)
        .filter((gap) => gap > 1)
    }, selector)
    console.log(`${name}: ${overflow.length ? `OVERFLOW ${overflow.join(",")}px` : "fits"}`)
    if (overflow.length) failed = true
  }
  await browser.close()
  console.log(`Wrote samples to ${out}`)
  if (failed) process.exitCode = 1
}

void main()
