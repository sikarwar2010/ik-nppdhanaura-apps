"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { api } from "@/lib/api"
import { usePermission } from "@/hooks/use-permission"
import { inr, StatusBadge, useCollectionLookups } from "../collection-shared"

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
}

async function printReceipt(id: string) {
  const printed = await api.get<{ html: string }>(`/api/v1/collections/receipts/${id}`)
  const popup = window.open("", "_blank", "noopener,noreferrer")
  if (!popup) {
    toast.error("Allow pop-ups to print the receipt")
    return
  }
  popup.document.write(printed.data.html)
  popup.document.close()
  popup.focus()
  popup.print()
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
      api.post(`/api/v1/payments/${id}/reversals`, { reason }),
    onSuccess: () => {
      toast.success("Payment reversed. The outstanding balance is restored.")
      setReason("")
      void queryClient.invalidateQueries({ queryKey: ["collection-receipts"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Property or payer" />
        <Input value={receiptNumber} onChange={(event) => setReceiptNumber(event.target.value)} placeholder="Receipt number" />
        <select className="h-9 rounded-md border bg-background px-2" value={assessmentYearId} onChange={(event) => setAssessmentYearId(event.target.value)}>
          <option value="">All years</option>
          {years.map((year) => (
            <option key={year.id} value={year.id}>{year.name}</option>
          ))}
        </select>
        <select className="h-9 rounded-md border bg-background px-2" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="SUCCESS">Settled</option>
          <option value="PENDING">Pending</option>
          <option value="REFUNDED">Reversed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
      </div>
      {hasPermission("payment:reverse") ? (
        <label className="block max-w-md space-y-1 text-sm">
          <span>Reversal reason</span>
          <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required to reverse a settled receipt" />
        </label>
      ) : null}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
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
                <td className="p-2"><StatusBadge status={row.status} /></td>
                <td className="p-2 space-x-2">
                  {row.receiptNumber ? (
                    <Button type="button" size="sm" variant="outline" className="cursor-pointer" onClick={() => void printReceipt(row.id).catch((error: Error) => toast.error(error.message))}>
                      Reprint
                    </Button>
                  ) : null}
                  {row.status === "PENDING" && hasPermission("payment:collect") ? (
                    <Button type="button" size="sm" className="cursor-pointer" disabled={confirm.isPending} onClick={() => confirm.mutate(row.id)}>
                      Confirm
                    </Button>
                  ) : null}
                  {row.status === "SUCCESS" && hasPermission("payment:reverse") ? (
                    <Button type="button" size="sm" variant="outline" className="cursor-pointer" disabled={reason.trim().length < 3 || reverse.isPending} onClick={() => reverse.mutate(row.id)}>
                      Reverse
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 text-sm">
        <Button type="button" variant="outline" className="cursor-pointer" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
        <span>Page {receipts.data?.meta.page ?? page} of {receipts.data?.meta.totalPages ?? 1}</span>
        <Button type="button" variant="outline" className="cursor-pointer" disabled={!receipts.data || page >= receipts.data.meta.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
      </div>
    </div>
  )
}
