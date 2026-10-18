import { BadRequestException } from "@nestjs/common"
import ExcelJS from "exceljs"

import { money, moneyString } from "./money"
import { componentsFromParts, ownOutstanding } from "./outstanding"

const MONEY = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/

export type HistoricalRow = {
  propertyId: string
  assessmentYear: string
  balanceKind: "COMPONENTS" | "CLOSING_ONLY"
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
  paymentsReceived: string
  creditAmount: string
  creditReason: string
  verifiedClosing: string
  sourceReference: string
  remarks: string
}

const REQUIRED_HEADERS = ["propertyId", "assessmentYear"] as const

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return ""
  if (typeof value === "string" || typeof value === "number") return String(value).trim()
  if (typeof value === "object" && "text" in value && value.text) return String(value.text).trim()
  if (typeof value === "object" && "result" in value && value.result != null) {
    return String(value.result).trim()
  }
  return ""
}

function moneyCell(value: string): string {
  if (!value) return "0.00"
  if (MONEY.test(value)) return moneyString(value)
  const numeric = Number(value)
  if (Number.isFinite(numeric)) return moneyString(numeric)
  return value
}

export async function rowsFromWorkbook(buffer: Buffer): Promise<HistoricalRow[]> {
  const workbook = new ExcelJS.Workbook()
  const bytes = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  )
  await workbook.xlsx.load(bytes as ArrayBuffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []
  const header = sheet.getRow(1)
  const index = new Map<string, number>()
  header.eachCell((cell, col) => {
    index.set(cellText(cell.value), col)
  })
  if (REQUIRED_HEADERS.some((name) => !index.has(name))) {
    throw new BadRequestException({
      code: "IMPORT_HEADERS_REQUIRED",
      message: "The workbook must include propertyId and assessmentYear columns",
    })
  }
  const rows: HistoricalRow[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
  const read = (name: string) => {
      const col = index.get(name)
      return col ? cellText(row.getCell(col).value) : ""
    }
    if (!read("propertyId") && !read("assessmentYear")) return
    rows.push({
      propertyId: read("propertyId"),
      assessmentYear: read("assessmentYear"),
      balanceKind: read("balanceKind") === "CLOSING_ONLY" ? "CLOSING_ONLY" : "COMPONENTS",
      propertyTax: moneyCell(read("propertyTax")),
      waterTax: moneyCell(read("waterTax")),
      drainageTax: moneyCell(read("drainageTax")),
      penalty: moneyCell(read("penalty")),
      interest: moneyCell(read("interest")),
      paymentsReceived: moneyCell(read("paymentsReceived")),
      creditAmount: moneyCell(read("creditAmount")),
      creditReason: read("creditReason"),
      verifiedClosing: read("verifiedClosing") ? moneyCell(read("verifiedClosing")) : "",
      sourceReference: read("sourceReference"),
      remarks: read("remarks"),
    })
  })
  return rows
}

export function normalizeHistoricalRow(input: Partial<HistoricalRow>): HistoricalRow {
  const row: HistoricalRow = {
    propertyId: input.propertyId?.trim() ?? "",
    assessmentYear: input.assessmentYear?.trim() ?? "",
    balanceKind: input.balanceKind === "CLOSING_ONLY" ? "CLOSING_ONLY" : "COMPONENTS",
    propertyTax: moneyCell(input.propertyTax ?? ""),
    waterTax: moneyCell(input.waterTax ?? ""),
    drainageTax: moneyCell(input.drainageTax ?? ""),
    penalty: moneyCell(input.penalty ?? ""),
    interest: moneyCell(input.interest ?? ""),
    paymentsReceived: moneyCell(input.paymentsReceived ?? ""),
    creditAmount: moneyCell(input.creditAmount ?? ""),
    creditReason: input.creditReason?.trim() ?? "",
    verifiedClosing: input.verifiedClosing ? moneyCell(input.verifiedClosing) : "",
    sourceReference: input.sourceReference?.trim() ?? "",
    remarks: input.remarks?.trim() ?? "",
  }
  const componentsEmpty = [
    row.propertyTax,
    row.waterTax,
    row.drainageTax,
    row.penalty,
    row.interest,
    row.paymentsReceived,
    row.creditAmount,
  ].every((amount) => money(amount).eq(0))
  if (row.balanceKind === "COMPONENTS" && row.verifiedClosing && componentsEmpty) {
    row.balanceKind = "CLOSING_ONLY"
  }
  if (row.balanceKind === "CLOSING_ONLY" && !row.remarks) {
    row.remarks = "Historical opening balance"
  }
  return row
}

export async function workbookHeaders(buffer: Buffer): Promise<string[]> {
  const workbook = new ExcelJS.Workbook()
  const bytes = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  )
  await workbook.xlsx.load(bytes as ArrayBuffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []
  const headers: string[] = []
  sheet.getRow(1).eachCell((cell) => {
    const text = cellText(cell.value)
    if (text) headers.push(text)
  })
  return headers
}

export async function historicalTemplateBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Opening balances")
  sheet.addRow([
    "propertyId",
    "assessmentYear",
    "balanceKind",
    "propertyTax",
    "waterTax",
    "drainageTax",
    "penalty",
    "interest",
    "paymentsReceived",
    "creditAmount",
    "creditReason",
    "verifiedClosing",
    "sourceReference",
    "remarks",
  ])
  sheet.addRow([
    "P-0001",
    "2024-2025",
    "CLOSING_ONLY",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "2000.00",
    "legacy-register",
    "Historical opening balance",
  ])
  const bytes = await workbook.xlsx.writeBuffer()
  return Buffer.from(bytes)
}

export function historicalRowError(row: HistoricalRow): string | null {
  if (!row.propertyId) return "Property ID is required"
  if (!row.assessmentYear) return "Assessment year is required"
  const amounts = [
    row.propertyTax,
    row.waterTax,
    row.drainageTax,
    row.penalty,
    row.interest,
    row.paymentsReceived,
    row.creditAmount,
  ]
  if (amounts.some((amount) => !MONEY.test(amount) && amount !== "0.00")) {
    return "Money values must be non-negative amounts with up to two decimal places"
  }
  if (row.verifiedClosing && !MONEY.test(row.verifiedClosing)) {
    return "Verified closing balance is not a valid amount"
  }
  if (money(row.creditAmount).gt(0) && row.creditReason.length < 3) {
    return "A credit needs a reason"
  }
  if (row.balanceKind === "CLOSING_ONLY") {
    if (
      money(row.waterTax).gt(0) ||
      money(row.drainageTax).gt(0) ||
      money(row.penalty).gt(0) ||
      money(row.interest).gt(0) ||
      money(row.paymentsReceived).gt(0) ||
      money(row.creditAmount).gt(0)
    ) {
      return "A closing-only balance cannot include other charges, payments, or credits"
    }
    if (!row.verifiedClosing && !money(row.propertyTax).gte(0)) {
      return "A closing-only balance needs an amount"
    }
  }
  if (row.balanceKind === "COMPONENTS" && row.verifiedClosing) {
    const components = componentsFromParts(row)
    const closing = ownOutstanding({
      currentYearDemand: components.currentYearDemand,
      interest: components.interest,
      credits: row.creditAmount,
      debits: "0.00",
      payments: row.paymentsReceived,
      rebate: "0.00",
    })
    if (!money(closing).eq(money(row.verifiedClosing))) {
      return "Verified closing balance does not match the component amounts"
    }
  }
  return null
}
