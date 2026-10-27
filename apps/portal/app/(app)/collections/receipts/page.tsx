"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

import { api } from "@/lib/api"
import { usePermission } from "@/hooks/use-permission"
import { Field, selectClass } from "@/components/admin/admin-ui"
import { inr, ReceiptActions, StatusBadge, useCollectionLookups } from "../collection-shared"

type ReceiptRow = {
  id: string
  receiptNumber: string | null
  amount: string
  status: string
  paymentMode: string
  collectionDate: string | null
  propertyId: string | null
  ownerName: string | null
  assessmentYear: string | null
  cashierName: string | null
  remarks: string | null
  reversedAt?: string | null
  reversalReason?: string | null
}

export default function ReceiptsPage() {
  const { years } = useCollectionLookups()
  const { hasPermission } = usePermission()
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [receiptNumber, setReceiptNumber] = React.useState("")
  const [assessmentYearId, setAssessmentYearId] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [reason, setReason] = React.useState("")
  const [reversing, setReversing] = React.useState<ReceiptRow | null>(null)

  const params = new URLSearchParams({ page: String(page), pageSize: "20" })
  if (search.trim()) params.set("search", search.trim())
  if (receiptNumber.trim()) params.set("receiptNumber", receiptNumber.trim())
  if (assessmentYearId) params.set("assessmentYearId", assessmentYearId)
  if (status) params.set("status", status)
  if (dateFrom) params.set("dateFrom", dateFrom)
  if (dateTo) params.set("dateTo", dateTo)

  const receipts = useQuery({
    queryKey: ["collection-receipts", params.toString()],
    queryFn: () =>
      api
        .get<{ items: ReceiptRow[]; meta: { page: number; totalPages: number } }>(
          `/api/v1/collections/receipts?${params}`
        )
        .then((res) => res.data),
  })

  const confirm = useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/v1/collections/${id}/confirm`, {}),
    onSuccess: () => {
      toast.success("Instrument confirmed and receipt issued")
      void queryClient.invalidateQueries({ queryKey: ["collection-receipts"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const reverse = useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/v1/payments/${id}/reversals`, { reason: reason.trim() }),
    onSuccess: () => {
      toast.success(
        "Payment reversed. The original receipt is kept and now prints with a REVERSED stamp; the outstanding balance is restored."
      )
      setReason("")
      setReversing(null)
      void queryClient.invalidateQueries({ queryKey: ["collection-receipts"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field id="rcpt-search" label="Property, owner or payer">
          {(props) => <Input {...props} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />}
        </Field>
        <Field id="rcpt-number" label="Receipt number">
          {(props) => <Input {...props} value={receiptNumber} onChange={(event) => { setReceiptNumber(event.target.value); setPage(1) }} />}
        </Field>
        <Field id="rcpt-year" label="Assessment year">
          {(props) => (
            <select {...props} className={selectClass} value={assessmentYearId} onChange={(event) => { setAssessmentYearId(event.target.value); setPage(1) }}>
              <option value="">All years</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          )}
        </Field>
        <Field id="rcpt-status" label="Status">
          {(props) => (
            <select {...props} className={selectClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
              <option value="">All statuses</option>
              <option value="SUCCESS">Settled</option>
              <option value="PENDING">Pending</option>
              <option value="REFUNDED">Reversed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}
        </Field>
        <Field id="rcpt-from" label="From">
          {(props) => <Input {...props} type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1) }} />}
        </Field>
        <Field id="rcpt-to" label="To">
          {(props) => <Input {...props} type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1) }} />}
        </Field>
      </div>
      <div className="relative overflow-x-auto rounded-md border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Receipt</th>
              <th className="p-2 text-left">Property</th>
              <th className="p-2 text-left">Year</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-left">Method</th>
              <th className="p-2 text-left">Cashier</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {receipts.data?.items.length === 0 ? (
              <tr><td className="p-3 text-muted-foreground" colSpan={8}>No offline receipts.</td></tr>
            ) : null}
            {receipts.data?.items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.receiptNumber ?? "—"}</td>
                <td className="p-2">{row.propertyId} · {row.ownerName ?? "—"}</td>
                <td className="p-2">{row.assessmentYear ?? "—"}</td>
                <td className="p-2 text-right tabular-nums">{inr(row.amount)}</td>
                <td className="p-2">{row.paymentMode}</td>
                <td className="p-2">{row.cashierName ?? "—"}</td>
                <td className="p-2">
                  <StatusBadge status={row.status} />
                  {row.reversalReason ? (
                    <p className="mt-1 max-w-48 text-xs text-muted-foreground">Reason: {row.reversalReason}</p>
                  ) : null}
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1.5">
                  {row.receiptNumber ? (
                    <ReceiptActions paymentId={row.id} receiptNumber={row.receiptNumber} />
                  ) : null}
                  {row.status === "PENDING" && hasPermission("payment:collect") ? (
                    <Button type="button" size="sm" className="cursor-pointer" disabled={confirm.isPending} onClick={() => confirm.mutate(row.id)}>
                      Confirm
                    </Button>
                  ) : null}
                  {row.status === "SUCCESS" && hasPermission("payment:reverse") ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => {
                        setReason("")
                        setReversing(row)
                      }}
                    >
                      Reverse…
                    </Button>
                  ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog
        open={Boolean(reversing)}
        onOpenChange={(open) => {
          if (!open && !reverse.isPending) setReversing(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reverse receipt {reversing?.receiptNumber ?? ""}?</DialogTitle>
            <DialogDescription>
              The payment of {reversing ? inr(reversing.amount) : ""} for property{" "}
              {reversing?.propertyId ?? "—"} will stop counting towards the ledger. The receipt is not
              deleted: it stays on record and reprints with a REVERSED stamp, the reason, your name and
              the time. This cannot be undone from this screen.
            </DialogDescription>
          </DialogHeader>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Reason (required)</span>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Cheque dishonoured by bank on 25 Oct 2026"
              rows={3}
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" className="cursor-pointer" disabled={reverse.isPending} onClick={() => setReversing(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              disabled={!reversing || reason.trim().length < 3 || reverse.isPending}
              onClick={() => reversing && reverse.mutate(reversing.id)}
            >
              {reverse.isPending ? "Reversing…" : "Reverse payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex gap-2 text-sm">
        <Button type="button" variant="outline" className="cursor-pointer" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
        <span>Page {receipts.data?.meta.page ?? page} of {receipts.data?.meta.totalPages ?? 1}</span>
        <Button type="button" variant="outline" className="cursor-pointer" disabled={!receipts.data || page >= receipts.data.meta.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
      </div>
    </div>
  )
}
