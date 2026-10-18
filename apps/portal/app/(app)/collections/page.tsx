"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { usePermission } from "@/hooks/use-permission"
import { api } from "@/lib/api"
import { inr, StatusBadge, useCollectionLookups, useSelectedAssessmentYear } from "./collection-shared"

type Summary = {
  municipality: string
  currentYearDemand: string
  previousArrears: string
  totalPayable: string
  totalCollected: string
  totalOutstanding: string
  propertiesWithDues: number
  fullyPaid: number
  partialPayments: number
  todayOfflineAmount: string
  todayOfflineCount: number
}

type PropertyRow = {
  surveyId: string
  propertyId: string
  ownerName: string | null
  wardName: string
  currentYearDemand: string
  previousArrears: string
  payable: string
  collected: string
  outstanding: string
  status: string
}

type Quote = {
  property: {
    surveyId: string
    propertyId: string
    ownerName: string | null
    wardName: string
    address: string
    mobile: string | null
  }
  assessmentYear: { name: string }
  demandReference: string | null
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
  previousDues: string
  rebate: string
  totalPayable: string
  netOutstanding: string
  authoritative: boolean
  warning: string | null
  receipts: Array<{
    id: string
    receiptNumber: string | null
    amount: string
    status: string
    paymentMode: string
  }>
}

const CARDS: Array<{ key: keyof Summary; label: string; money?: boolean }> = [
  { key: "currentYearDemand", label: "Current-year demand / चालू वर्ष", money: true },
  { key: "previousArrears", label: "Previous arrears / पूर्व बकाया", money: true },
  { key: "totalPayable", label: "Total payable / कुल देय", money: true },
  { key: "totalCollected", label: "Collected / संग्रहीत", money: true },
  { key: "totalOutstanding", label: "Outstanding / बकाया", money: true },
  { key: "propertiesWithDues", label: "Properties with dues" },
  { key: "fullyPaid", label: "Fully paid / पूर्ण भुगतान" },
  { key: "partialPayments", label: "Partial payments / आंशिक" },
  { key: "todayOfflineAmount", label: "Today's offline collection", money: true },
]

export default function OfflineCollectionPage() {
  const { years, wards } = useCollectionLookups()
  const { hasPermission, user } = usePermission()
  const canCollect = hasPermission("payment:collect")
  const queryClient = useQueryClient()
  const [assessmentYearId, setAssessmentYearId] = useSelectedAssessmentYear(years)
  const [wardId, setWardId] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [receiptNumber, setReceiptNumber] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [quoteFor, setQuoteFor] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState(false)
  const idempotencyKey = React.useRef("")
  const [amountOverride, setAmountOverride] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    paymentMode: "CASH",
    paymentDate: "",
    reference: "",
    remarks: "",
    counterCode: "",
  })

  const params = new URLSearchParams({
    assessmentYearId,
    page: String(page),
    pageSize: "20",
  })
  if (wardId) params.set("wardId", wardId)
  if (search.trim()) params.set("search", search.trim())
  if (status) params.set("status", status)
  if (dateFrom) params.set("dateFrom", dateFrom)
  if (dateTo) params.set("dateTo", dateTo)
  if (receiptNumber.trim()) params.set("receiptNumber", receiptNumber.trim())

  const summary = useQuery({
    queryKey: ["collection-summary", assessmentYearId, wardId, dateFrom, dateTo],
    enabled: Boolean(assessmentYearId),
    queryFn: () => {
      const qs = new URLSearchParams({ assessmentYearId })
      if (wardId) qs.set("wardId", wardId)
      if (dateFrom) qs.set("dateFrom", dateFrom)
      if (dateTo) qs.set("dateTo", dateTo)
      return api.get<Summary>(`/api/v1/collections/summary?${qs}`).then((res) => res.data)
    },
  })
  const list = useQuery({
    queryKey: ["collection-properties", params.toString()],
    enabled: Boolean(assessmentYearId),
    queryFn: () =>
      api
        .get<{ items: PropertyRow[]; meta: { page: number; totalPages: number; total: number } }>(
          `/api/v1/collections/properties?${params}`
        )
        .then((res) => res.data),
  })
  const quote = useQuery({
    queryKey: ["collection-quote", quoteFor, assessmentYearId],
    enabled: Boolean(quoteFor && assessmentYearId),
    queryFn: () =>
      api
        .get<Quote>(
          `/api/v1/collections/quote?surveyId=${quoteFor}&assessmentYearId=${assessmentYearId}`
        )
        .then((res) => res.data),
  })
  const amount = amountOverride ?? quote.data?.netOutstanding ?? ""

  const collect = useMutation({
    mutationFn: () =>
      api.post<{
        paymentId: string
        status: string
        receiptNumber: string | null
        remaining: string | null
        created: boolean
      }>("/api/v1/collections", {
        surveyId: quoteFor,
        assessmentYearId,
        amount,
        paymentMode: form.paymentMode,
        paymentDate: form.paymentDate || undefined,
        reference: form.reference || undefined,
        remarks: form.remarks || undefined,
        counterCode: form.counterCode || undefined,
        idempotencyKey: idempotencyKey.current,
      }),
    onSuccess: async (res) => {
      toast.success(
        res.data.status === "SUCCESS"
          ? `Collected. Receipt ${res.data.receiptNumber}`
          : "Recorded as pending. Confirm it when the instrument clears."
      )
      setConfirming(false)
      setQuoteFor(null)
      void queryClient.invalidateQueries({ queryKey: ["collection-summary"] })
      void queryClient.invalidateQueries({ queryKey: ["collection-properties"] })
      if (res.data.status === "SUCCESS" && res.data.paymentId) {
        const printed = await api.get<{ html: string }>(
          `/api/v1/collections/receipts/${res.data.paymentId}`
        )
        const popup = window.open("", "_blank", "noopener,noreferrer")
        if (popup) {
          popup.document.write(printed.data.html)
          popup.document.close()
          popup.focus()
          popup.print()
        }
      }
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const remaining = quote.data
    ? (Number(quote.data.netOutstanding) - Number(amount || 0)).toFixed(2)
    : "0.00"

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span>Assessment year / निर्धारण वर्ष</span>
          <select
            className="flex h-9 w-full rounded-md border bg-background px-2"
            value={assessmentYearId}
            onChange={(event) => {
              setAssessmentYearId(event.target.value)
              setPage(1)
            }}
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Ward / वार्ड</span>
          <select
            className="flex h-9 w-full rounded-md border bg-background px-2"
            value={wardId}
            onChange={(event) => {
              setWardId(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All wards</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Property or owner</span>
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Property ID, owner, house, parcel"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Payment status</span>
          <select
            className="flex h-9 w-full rounded-md border bg-background px-2"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending instrument</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>From</span>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span>To</span>
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Receipt number</span>
          <Input
            value={receiptNumber}
            onChange={(event) => setReceiptNumber(event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <Card key={card.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold tabular-nums">
              {summary.isLoading
                ? "…"
                : card.money
                  ? inr(summary.data?.[card.key] as string)
                  : String(summary.data?.[card.key] ?? "—")}
            </CardContent>
          </Card>
        ))}
      </div>
      {summary.data ? (
        <p className="text-sm text-muted-foreground">
          Today: {summary.data.todayOfflineCount} offline receipt
          {summary.data.todayOfflineCount === 1 ? "" : "s"}.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Property</th>
              <th className="p-2 text-left">Owner</th>
              <th className="p-2 text-left">Ward</th>
              <th className="p-2 text-right">Payable</th>
              <th className="p-2 text-right">Outstanding</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <tr>
                <td className="p-3" colSpan={7}>
                  Loading ledger…
                </td>
              </tr>
            ) : null}
            {list.isError ? (
              <tr>
                <td className="p-3 text-destructive" colSpan={7}>
                  {(list.error as Error).message}
                </td>
              </tr>
            ) : null}
            {list.data?.items.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={7}>
                  No published demands match these filters.
                </td>
              </tr>
            ) : null}
            {list.data?.items.map((row) => (
              <tr key={row.surveyId} className="border-t">
                <td className="p-2">{row.propertyId}</td>
                <td className="p-2">{row.ownerName ?? "—"}</td>
                <td className="p-2">{row.wardName}</td>
                <td className="p-2 text-right tabular-nums">{inr(row.payable)}</td>
                <td className="p-2 text-right tabular-nums">{inr(row.outstanding)}</td>
                <td className="p-2">
                  <StatusBadge status={row.status} />
                </td>
                <td className="p-2">
                  {canCollect ? (
                    <Button
                      type="button"
                      className="cursor-pointer"
                      size="sm"
                      onClick={() => {
                        idempotencyKey.current = crypto.randomUUID()
                        setAmountOverride(null)
                        setQuoteFor(row.surveyId)
                      }}
                    >
                      Collect Tax / कर जमा करें
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Previous
        </Button>
        <span>
          Page {list.data?.meta.page ?? page} of {list.data?.meta.totalPages ?? 1}
        </span>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          disabled={!list.data || page >= list.data.meta.totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </div>

      <Dialog open={Boolean(quoteFor)} onOpenChange={(open) => !open && setQuoteFor(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Collect Tax / कर जमा करें</DialogTitle>
          </DialogHeader>
          {quote.isLoading ? <p>Loading the authoritative demand…</p> : null}
          {quote.isError ? <p className="text-destructive">{(quote.error as Error).message}</p> : null}
          {quote.data ? (
            <div className="space-y-3 text-sm">
              {!quote.data.authoritative ? (
                <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2">
                  {quote.data.warning}
                </p>
              ) : null}
              <dl className="grid grid-cols-2 gap-2">
                <div>Property ID</div>
                <div>{quote.data.property.propertyId}</div>
                <div>Owner</div>
                <div>{quote.data.property.ownerName ?? "—"}</div>
                <div>Ward</div>
                <div>{quote.data.property.wardName}</div>
                <div>Address</div>
                <div>{quote.data.property.address}</div>
                <div>Year</div>
                <div>{quote.data.assessmentYear.name}</div>
                <div>Demand</div>
                <div>{quote.data.demandReference ?? "Not published"}</div>
                <div>Property tax</div>
                <div>{inr(quote.data.propertyTax)}</div>
                <div>Water tax</div>
                <div>{inr(quote.data.waterTax)}</div>
                <div>Drainage tax</div>
                <div>{inr(quote.data.drainageTax)}</div>
                <div>Previous dues</div>
                <div>{inr(quote.data.previousDues)}</div>
                <div>Rebate</div>
                <div>{inr(quote.data.rebate)}</div>
                <div>Penalty</div>
                <div>{inr(quote.data.penalty)}</div>
                <div>Interest</div>
                <div>{inr(quote.data.interest)}</div>
                <div>Total payable</div>
                <div>{inr(quote.data.totalPayable)}</div>
                <div>Outstanding</div>
                <div className="font-semibold">{inr(quote.data.netOutstanding)}</div>
              </dl>
              {quote.data.receipts.length > 0 ? (
                <div>
                  <p className="font-medium">Previous receipts</p>
                  <ul className="space-y-1">
                    {quote.data.receipts.map((receipt) => (
                      <li key={receipt.id}>
                        {receipt.receiptNumber ?? "Pending"} · {inr(receipt.amount)} · {receipt.status}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1">
                  <Label htmlFor="collect-amount">Amount being collected</Label>
                  <Input
                    id="collect-amount"
                    value={amount}
                    onChange={(event) => setAmountOverride(event.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <Label htmlFor="collect-mode">Payment method</Label>
                  <select
                    id="collect-mode"
                    className="flex h-9 w-full rounded-md border bg-background px-2"
                    value={form.paymentMode}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, paymentMode: event.target.value }))
                    }
                  >
                    <option value="CASH">Cash / नकद</option>
                    <option value="CHEQUE">Cheque / चेक</option>
                    <option value="DD">Demand draft</option>
                    <option value="UPI_MANUAL">Manual UPI</option>
                    <option value="OTHER">Bank transfer / बैंक अंतरण</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <Label htmlFor="collect-date">Payment date</Label>
                  <Input
                    id="collect-date"
                    type="date"
                    value={form.paymentDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, paymentDate: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1">
                  <Label htmlFor="collect-ref">Reference</Label>
                  <Input
                    id="collect-ref"
                    value={form.reference}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, reference: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1">
                  <Label htmlFor="collect-counter">Counter</Label>
                  <Input
                    id="collect-counter"
                    value={form.counterCode}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, counterCode: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <Label htmlFor="collect-remarks">Remarks</Label>
                  <Input
                    id="collect-remarks"
                    value={form.remarks}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, remarks: event.target.value }))
                    }
                  />
                </label>
              </div>
              <p className="text-muted-foreground">Cashier: {user?.name ?? "—"}</p>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setQuoteFor(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={!quote.data?.authoritative || collect.isPending}
              onClick={() => setConfirming(true)}
            >
              Review collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm collection</DialogTitle>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>Amount due</div>
            <div>{inr(quote.data?.netOutstanding)}</div>
            <div>Amount collected</div>
            <div>{inr(amount)}</div>
            <div>Remaining</div>
            <div>{inr(remaining)}</div>
            <div>Method</div>
            <div>{form.paymentMode}</div>
            <div>Year</div>
            <div>{quote.data?.assessmentYear.name}</div>
          </dl>
          <p className="text-sm text-muted-foreground">
            Cash and manual UPI settle immediately. Cheque, draft, and bank transfer stay pending until confirmed.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setConfirming(false)}>
              Back
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={collect.isPending}
              onClick={() => collect.mutate()}
            >
              {collect.isPending ? "Saving…" : "Confirm and save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
