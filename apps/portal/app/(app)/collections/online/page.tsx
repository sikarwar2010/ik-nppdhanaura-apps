"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import {
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  Notice,
  Panel,
  selectClass,
} from "@/components/admin/admin-ui"
import { api } from "@/lib/api"
import { inr, ReceiptActions, StatusBadge, toPaise } from "../collection-shared"

type Row = {
  id: string
  merchTxnId: string | null
  atomTxnId: string | null
  receiptNumber: string | null
  amount: string
  status: string
  gateway: string | null
  taxKind: "PROPERTY_TAX" | "WATER_TAX" | "COMBINED" | null
  propertyId: string | null
  ownerName: string | null
  assessmentYear: string | null
  createdAt: string
  callbacks: number
  allocated: string
  unallocated: string
  hasReceipt: boolean
}

const KIND_LABEL: Record<NonNullable<Row["taxKind"]>, string> = {
  PROPERTY_TAX: "Property tax",
  WATER_TAX: "Water tax",
  COMBINED: "Combined",
}

export default function OnlineTransactionsPage() {
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [page, setPage] = React.useState(1)
  const params = new URLSearchParams({ page: String(page), pageSize: "20" })
  if (search.trim()) params.set("search", search.trim())
  if (status) params.set("status", status)
  const query = useQuery({
    queryKey: ["collection-online", params.toString()],
    placeholderData: keepPreviousData,
    queryFn: () =>
      api
        .get<{ items: Row[]; meta: { total: number; totalPages: number } }>(`/api/v1/collections/online?${params.toString()}`)
        .then((res) => res.data),
  })
  const items = query.data?.items ?? []
  const meta = query.data?.meta
  const held = items.filter((row) => (toPaise(row.unallocated) ?? 0n) > 0n)

  return (
    <Panel
      title="Online transactions / ऑनलाइन लेन-देन"
      description="Balances change only after the payment gateway confirms a payment. Failed and pending payments never reduce any tax."
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <Field id="online-search" label="Property ID or gateway reference">
            {(props) => (
              <Input {...props} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            )}
          </Field>
          <Field id="online-status" label="Status">
            {(props) => (
              <select {...props} className={selectClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
                <option value="">All</option>
                <option value="SUCCESS">Settled</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Reversed</option>
              </select>
            )}
          </Field>
        </div>
        {held.length > 0 ? (
          <Notice tone="warning">
            {held.length} payment(s) on this page hold money that no longer fits the chosen tax, usually because the same tax was paid at
            the counter first. That money has not been moved to another tax. Decide with the Accounts section whether to refund it.
          </Notice>
        ) : null}
        {query.isLoading ? <LoadingBlock rows={5} /> : null}
        {query.isError ? <ErrorBlock error={query.error} onRetry={() => void query.refetch()} /> : null}
        {!query.isLoading && items.length === 0 ? <EmptyBlock title="No online transactions match" /> : null}
        {items.length > 0 ? (
          <div className="relative overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[980px] text-sm">
              <caption className="sr-only">Online transactions</caption>
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  {["Date", "Property", "Payment for", "Amount", "On ledger", "Status", "Gateway reference", "Receipt"].map((label) => (
                    <th key={label} scope="col" className={cn("p-2 font-medium", label === "Amount" || label === "On ledger" ? "text-right" : "text-left")}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t align-top">
                    <td className="p-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString("en-IN")}</td>
                    <td className="p-2">
                      <span className="font-mono text-xs">{row.propertyId ?? "—"}</span>
                      <span className="block">{row.ownerName ?? "—"}</span>
                    </td>
                    <td className="p-2">
                      {row.taxKind ? KIND_LABEL[row.taxKind] : "Not recorded"}
                      <span className="block text-xs text-muted-foreground">{row.assessmentYear ?? "—"}</span>
                    </td>
                    <td className="p-2 text-right tabular-nums">{inr(row.amount)}</td>
                    <td className="p-2 text-right tabular-nums">
                      {inr(row.allocated)}
                      {(toPaise(row.unallocated) ?? 0n) > 0n ? (
                        <span className="block text-xs font-medium text-destructive">{inr(row.unallocated)} held</span>
                      ) : null}
                    </td>
                    <td className="p-2"><StatusBadge status={row.status} /></td>
                    <td className="p-2 font-mono text-xs break-all">
                      {row.atomTxnId ?? row.merchTxnId ?? "—"}
                      <span className="block font-sans text-muted-foreground">{row.callbacks} callback(s)</span>
                    </td>
                    <td className="p-2">
                      {row.hasReceipt ? <ReceiptActions paymentId={row.id} receiptNumber={row.receiptNumber} /> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {meta && meta.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{meta.total} transactions</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((c) => c - 1)}>Previous</Button>
              <Button type="button" variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((c) => c + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  )
}
