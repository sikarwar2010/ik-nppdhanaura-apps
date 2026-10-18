"use client"

import { useQuery } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { api } from "@/lib/api"
import { inr, StatusBadge, useCollectionLookups, useSelectedAssessmentYear } from "../collection-shared"

type SearchHit = {
  surveyId: string
  propertyId: string
  ownerName: string | null
  wardName: string
  address: string
}

type Quote = {
  property: SearchHit & { mobile: string | null }
  assessmentYear: { name: string }
  demandReference: string | null
  propertyTax: string
  waterTax: string
  drainageTax: string
  previousDues: string
  rebate: string
  penalty: string
  interest: string
  totalPayable: string
  netOutstanding: string
  paymentsAllocated: string
  authoritative: boolean
  warning: string | null
  years: Array<{
    assessmentYearName: string
    balanceKind: string
    propertyTax: string
    currentYearDemand: string
    openingArrears: string
    rebate: string
    penalty: string
    interest: string
    payments: string
    credits: string
    outstanding: string
    verificationStatus: string
  }>
  receipts: Array<{
    id: string
    receiptNumber: string | null
    amount: string
    status: string
    paymentMode: string
    collectionDate: string | null
    cashierName: string | null
  }>
}

export default function LedgerPage() {
  const { years } = useCollectionLookups()
  const [term, setTerm] = React.useState("")
  const [surveyId, setSurveyId] = React.useState("")
  const [assessmentYearId, setAssessmentYearId] = useSelectedAssessmentYear(years)

  const hits = useQuery({
    queryKey: ["collection-search", term],
    enabled: term.trim().length >= 2,
    queryFn: () =>
      api.get<SearchHit[]>(`/api/v1/collections/properties/search?q=${encodeURIComponent(term.trim())}`).then((res) => res.data),
  })
  const quote = useQuery({
    queryKey: ["collection-ledger", surveyId, assessmentYearId],
    enabled: Boolean(surveyId && assessmentYearId),
    queryFn: () =>
      api
        .get<Quote>(`/api/v1/collections/quote?surveyId=${surveyId}&assessmentYearId=${assessmentYearId}`)
        .then((res) => res.data),
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Property search</span>
          <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Property ID, owner, house, parcel, mobile" />
        </label>
        <label className="space-y-1 text-sm">
          <span>Assessment year</span>
          <select className="flex h-9 w-full rounded-md border bg-background px-2" value={assessmentYearId} onChange={(event) => setAssessmentYearId(event.target.value)}>
            {years.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
        </label>
      </div>
      {hits.data && hits.data.length > 0 ? (
        <ul className="divide-y rounded-md border text-sm">
          {hits.data.map((hit) => (
            <li key={hit.surveyId}>
              <button type="button" className="w-full cursor-pointer px-3 py-2 text-left hover:bg-muted" onClick={() => setSurveyId(hit.surveyId)}>
                {hit.propertyId} · {hit.ownerName ?? "—"} · {hit.wardName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {quote.isError ? <p className="text-sm text-destructive">{(quote.error as Error).message}</p> : null}
      {quote.data ? (
        <div className="space-y-4">
          {!quote.data.authoritative ? (
            <p className="rounded-md border p-3 text-sm">{quote.data.warning}</p>
          ) : null}
          <p className="text-sm">
            {quote.data.property.propertyId} · {quote.data.property.ownerName ?? "—"} · {quote.data.property.address}
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left">Year</th>
                  <th className="p-2 text-right">Current demand</th>
                  <th className="p-2 text-right">Rebate</th>
                  <th className="p-2 text-right">Penalty</th>
                  <th className="p-2 text-right">Payments</th>
                  <th className="p-2 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {quote.data.years.map((year) => (
                  <tr key={year.assessmentYearName} className="border-t">
                    <td className="p-2">
                      {year.assessmentYearName}
                      {year.balanceKind === "CLOSING_ONLY" ? " · Historical opening balance" : ""}
                      {year.verificationStatus === "UNVERIFIED" ? " · Unverified" : ""}
                    </td>
                    <td className="p-2 text-right tabular-nums">{inr(year.currentYearDemand)}</td>
                    <td className="p-2 text-right tabular-nums">{inr(year.rebate)}</td>
                    <td className="p-2 text-right tabular-nums">{inr(year.penalty)}</td>
                    <td className="p-2 text-right tabular-nums">{inr(year.payments)}</td>
                    <td className="p-2 text-right tabular-nums">{inr(year.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm">
            Payable {inr(quote.data.totalPayable)} · Collected {inr(quote.data.paymentsAllocated)} · Outstanding {inr(quote.data.netOutstanding)}
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Receipt</th>
                  <th className="p-2 text-left">Method</th>
                  <th className="p-2 text-right">Paid</th>
                  <th className="p-2 text-left">Cashier</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {quote.data.receipts.length === 0 ? (
                  <tr><td className="p-3 text-muted-foreground" colSpan={7}>No offline receipts for this property.</td></tr>
                ) : null}
                {quote.data.receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-t">
                    <td className="p-2">{receipt.collectionDate ? new Date(receipt.collectionDate).toLocaleString("en-IN") : "—"}</td>
                    <td className="p-2">{receipt.receiptNumber ?? "—"}</td>
                    <td className="p-2">{receipt.paymentMode}</td>
                    <td className="p-2 text-right tabular-nums">{inr(receipt.amount)}</td>
                    <td className="p-2">{receipt.cashierName ?? "—"}</td>
                    <td className="p-2"><StatusBadge status={receipt.status} /></td>
                    <td className="p-2">
                      {receipt.receiptNumber ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => {
                            void api
                              .get<{ html: string }>(`/api/v1/collections/receipts/${receipt.id}`)
                              .then((res) => {
                                const popup = window.open("", "_blank", "noopener,noreferrer")
                                if (!popup) return
                                popup.document.write(res.data.html)
                                popup.document.close()
                                popup.print()
                              })
                              .catch((error: Error) => toast.error(error.message))
                          }}
                        >
                          Print
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
