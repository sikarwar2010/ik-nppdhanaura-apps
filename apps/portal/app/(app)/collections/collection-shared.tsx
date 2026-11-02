"use client"

import { useQuery } from "@tanstack/react-query"
import { Download, Printer } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { api } from "@/lib/api"
import { downloadAuthenticatedExport } from "@/lib/download-blob"
import { formatApiError } from "@/lib/format-api-error"
import { formatInr } from "@/components/admin/admin-ui"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export type YearOption = { id: string; name: string; code: string }
export type WardOption = { id: string; name: string; number: number }
export type ReceiptCopy = "consumer" | "office" | "both"

/** Latest assessment year by default (codes sort chronologically). */
export function useSelectedAssessmentYear(years: YearOption[]) {
  const [picked, setPicked] = useState("")
  const latest = [...years].sort((a, b) => b.code.localeCompare(a.code))[0]?.id ?? ""
  return [picked || latest, setPicked] as const
}

/** ₹ with Indian grouping from the server's decimal string (no floating point). */
export function inr(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—"
  return formatInr(typeof value === "number" ? value.toFixed(2) : value)
}

/** Paise as BigInt for comparisons in the browser; null when not a valid amount. */
export function toPaise(value: string): bigint | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!match) return null
  return BigInt(match[1]!) * 100n + BigInt(((match[2] ?? "") + "00").slice(0, 2))
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  UNPAID: { label: "Unpaid / अवैतनिक", variant: "outline" },
  PARTIAL: { label: "Partially paid / आंशिक", variant: "secondary" },
  PARTIALLY_PAID: { label: "Partially paid / आंशिक", variant: "secondary" },
  PAID: { label: "Paid / भुगतान", variant: "default" },
  PENDING: { label: "Pending / लंबित", variant: "secondary" },
  SUCCESS: { label: "Settled / जमा", variant: "default" },
  SENT: { label: "Sent / भेजा गया", variant: "default" },
  POSTED: { label: "Posted / दर्ज", variant: "default" },
  REVERSED: { label: "Reversed / निरस्त", variant: "destructive" },
  REFUNDED: { label: "Reversed / निरस्त", variant: "destructive" },
  FAILED: { label: "Failed / विफल", variant: "destructive" },
  CANCELLED: { label: "Cancelled / रद्द", variant: "destructive" },
  UNVERIFIED: { label: "Unverified / असत्यापित", variant: "outline" },
}

/** Text label on every status, so colour is never the only signal. */
export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS_LABELS[status] ?? { label: status, variant: "outline" as const }
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}

/**
 * Prints the stored receipt through a hidden frame (no pop-up needed). The
 * server records who printed which copy.
 */
export async function printReceipt(paymentId: string, copy: ReceiptCopy) {
  const res = await api.get<{ html: string }>(
    `/api/v1/collections/receipts/${paymentId}?copy=${copy}`
  )
  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;"
  frame.srcdoc = res.data.html
  frame.onload = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    setTimeout(() => frame.remove(), 60_000)
  }
  document.body.appendChild(frame)
}

export async function downloadReceiptPdf(paymentId: string, receiptNumber: string | null, copy: ReceiptCopy) {
  await downloadAuthenticatedExport(
    `/api/v1/collections/receipts/${paymentId}/pdf?copy=${copy}`,
    `receipt-${receiptNumber ?? paymentId}-${copy}.pdf`
  )
}

/** Print consumer / office / both, plus PDF download, for one posted receipt. */
export function ReceiptActions({
  paymentId,
  receiptNumber,
  size = "sm",
}: {
  paymentId: string
  receiptNumber: string | null
  size?: "sm" | "default"
}) {
  const run = (task: Promise<void>) =>
    void task.catch((error: unknown) => toast.error(formatApiError(error, "Could not open the receipt")))
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button type="button" size={size} variant="outline" className="cursor-pointer" onClick={() => run(printReceipt(paymentId, "consumer"))}>
        <Printer aria-hidden className="size-3.5" /> Consumer copy
      </Button>
      <Button type="button" size={size} variant="outline" className="cursor-pointer" onClick={() => run(printReceipt(paymentId, "office"))}>
        <Printer aria-hidden className="size-3.5" /> Office copy
      </Button>
      <Button type="button" size={size} variant="outline" className="cursor-pointer" onClick={() => run(printReceipt(paymentId, "both"))}>
        <Printer aria-hidden className="size-3.5" /> Both
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        className="cursor-pointer"
        aria-label={`Download receipt ${receiptNumber ?? ""} as PDF`}
        onClick={() => run(downloadReceiptPdf(paymentId, receiptNumber, "both"))}
      >
        <Download aria-hidden className="size-3.5" /> PDF
      </Button>
    </div>
  )
}

export function useCollectionLookups() {
  const years = useQuery({
    queryKey: ["assessment-years"],
    queryFn: () =>
      api
        .get<YearOption[]>("/api/v1/reference-entries?category=ASSESSMENT_YEAR")
        .then((res) => res.data),
  })
  const wards = useQuery({
    queryKey: ["wards"],
    queryFn: () => api.get<WardOption[]>("/api/v1/wards").then((res) => res.data),
  })
  return { years: years.data ?? [], wards: wards.data ?? [] }
}

/** Tax-wise split of an amount, as returned by the server. */
export type ComponentParts = {
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
}

export type AllocationLine = {
  assessmentYearCode: string
  assessmentYearName: string
  closingBalanceOnly: boolean
  amount: string
  outstandingAfter: string
  parts: ComponentParts
}

function addParts(a: string, b: string): string {
  const pa = toPaise(a.replace("-", "")) ?? 0n
  const pb = toPaise(b.replace("-", "")) ?? 0n
  const total = pa + pb
  return `${total / 100n}.${String(total % 100n).padStart(2, "0")}`
}

export const TAX_BUCKETS = ["propertyTax", "waterTax", "drainageTax", "charges", "historical"] as const
export type TaxBucket = (typeof TAX_BUCKETS)[number]
export type BucketAmounts = Record<TaxBucket, string>

export const BUCKET_LABELS: Record<TaxBucket, string> = {
  propertyTax: "Property tax / संपत्ति कर",
  waterTax: "Water tax / जल कर",
  drainageTax: "Drainage tax / नाली कर",
  charges: "Interest & other charges / ब्याज व अन्य प्रभार",
  historical: "Earlier balance, no tax split / पूर्व शेष",
}

export type TaxPosition = {
  arrears: BucketAmounts
  current: BucketAmounts
  outstanding: BucketAmounts
  paid: BucketAmounts
  total: string
  years: Array<{
    assessmentYearCode: string
    assessmentYearName: string
    verified: boolean
    ledger: { demand: BucketAmounts; rebate: BucketAmounts; credits: BucketAmounts; debits: BucketAmounts; paid: BucketAmounts; balance: BucketAmounts; total: string }
  }>
}

export type TaxSummaryLine = {
  bucket: TaxBucket
  label: string
  labelHi: string
  before: string
  paid: string
  after: string
  status: "PAID" | "PARTIALLY_PAID" | "UNPAID"
}

/** Buckets worth showing: anything owed, due or paid. Empty rows would only add noise. */
export function activeBuckets(position: TaxPosition): TaxBucket[] {
  const nonZero = (value: string) => (toPaise(value.replace("-", "")) ?? 0n) > 0n
  return TAX_BUCKETS.filter(
    (key) =>
      key === "propertyTax" ||
      key === "waterTax" ||
      nonZero(position.outstanding[key]) ||
      nonZero(position.paid[key])
  )
}

/** Arrears, current demand and balance for each tax, kept apart. */
export function TaxPositionTable({ position, caption }: { position: TaxPosition; caption: string }) {
  return (
    <div className="relative overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[560px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="p-2 text-left font-medium">Tax / कर</th>
            <th scope="col" className="p-2 text-right font-medium">Previous-year arrears</th>
            <th scope="col" className="p-2 text-right font-medium">Current year due</th>
            <th scope="col" className="p-2 text-right font-medium">Paid so far</th>
            <th scope="col" className="p-2 text-right font-medium">Outstanding now</th>
          </tr>
        </thead>
        <tbody>
          {activeBuckets(position).map((key) => (
            <tr key={key} className="border-t">
              <th scope="row" className="p-2 text-left font-medium">{BUCKET_LABELS[key]}</th>
              <td className="p-2 text-right tabular-nums">{inr(position.arrears[key])}</td>
              <td className="p-2 text-right tabular-nums">{inr(position.current[key])}</td>
              <td className="p-2 text-right tabular-nums">{inr(position.paid[key])}</td>
              <td className="p-2 text-right font-semibold tabular-nums">{inr(position.outstanding[key])}</td>
            </tr>
          ))}
          <tr className="border-t bg-muted/30">
            <th scope="row" colSpan={4} className="p-2 text-left font-semibold">Total outstanding / कुल बकाया</th>
            <td className="p-2 text-right font-semibold tabular-nums">{inr(position.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/** Each tax before and after one payment. */
export function TaxSummaryTable({ lines, caption }: { lines: TaxSummaryLine[]; caption: string }) {
  return (
    <div className="relative overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[520px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="p-2 text-left font-medium">Tax / कर</th>
            <th scope="col" className="p-2 text-right font-medium">Due before</th>
            <th scope="col" className="p-2 text-right font-medium">This payment</th>
            <th scope="col" className="p-2 text-right font-medium">Balance after</th>
            <th scope="col" className="p-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.bucket} className="border-t">
              <th scope="row" className="p-2 text-left font-medium">{line.label} / {line.labelHi}</th>
              <td className="p-2 text-right tabular-nums">{inr(line.before)}</td>
              <td className="p-2 text-right font-semibold tabular-nums">{inr(line.paid)}</td>
              <td className="p-2 text-right tabular-nums">{inr(line.after)}</td>
              <td className="p-2"><StatusBadge status={line.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Year-by-year, tax-by-tax table for a payment (preview or posted). */
export function AllocationTable({ lines, caption }: { lines: AllocationLine[]; caption: string }) {
  return (
    <div className="relative overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="p-2 text-left font-medium">Assessment year</th>
            <th scope="col" className="p-2 text-right font-medium">Property tax</th>
            <th scope="col" className="p-2 text-right font-medium">Water tax</th>
            <th scope="col" className="p-2 text-right font-medium">Drainage tax</th>
            <th scope="col" className="p-2 text-right font-medium">Penalty &amp; interest</th>
            <th scope="col" className="p-2 text-right font-medium">Applied</th>
            <th scope="col" className="p-2 text-right font-medium">Year balance after</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.assessmentYearCode} className="border-t">
              <th scope="row" className="p-2 text-left font-medium">
                {line.assessmentYearName}
                {line.closingBalanceOnly ? (
                  <span className="block text-xs font-normal text-muted-foreground">Historical balance</span>
                ) : null}
              </th>
              <td className="p-2 text-right tabular-nums">{line.closingBalanceOnly ? "—" : inr(line.parts.propertyTax)}</td>
              <td className="p-2 text-right tabular-nums">{line.closingBalanceOnly ? "—" : inr(line.parts.waterTax)}</td>
              <td className="p-2 text-right tabular-nums">{line.closingBalanceOnly ? "—" : inr(line.parts.drainageTax)}</td>
              <td className="p-2 text-right tabular-nums">
                {line.closingBalanceOnly ? "—" : inr(addParts(line.parts.penalty, line.parts.interest))}
              </td>
              <td className="p-2 text-right font-semibold tabular-nums">{inr(line.amount)}</td>
              <td className="p-2 text-right tabular-nums">{inr(line.outstandingAfter)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
