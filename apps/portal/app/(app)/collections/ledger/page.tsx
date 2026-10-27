"use client"

import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import { EmptyBlock, ErrorBlock, Field, LoadingBlock, Notice, Panel, selectClass } from "@/components/admin/admin-ui"
import { api } from "@/lib/api"
import { inr, ReceiptActions, StatusBadge, toPaise } from "../collection-shared"

type SearchHit = {
  surveyId: string
  propertyId: string
  ownerName: string | null
  wardName: string
  address: string
}

type Parts = { propertyTax: string; waterTax: string; drainageTax: string; penalty: string; interest: string }

type Entry = {
  id: string
  at: string
  type: string
  status: "POSTED" | "REVERSED" | "PENDING" | "UNVERIFIED"
  assessmentYearCode: string | null
  assessmentYearName: string | null
  receiptNumber: string | null
  paymentId: string | null
  paymentMode: string | null
  reference: string | null
  collector: string | null
  description: string
  debit: string
  credit: string
  parts: Parts
  counted: boolean
  yearBalanceAfter: string | null
  balanceAfter: string
}

type YearRow = {
  assessmentYearId: string
  assessmentYearCode: string
  assessmentYearName: string
  verificationStatus: "VERIFIED" | "UNVERIFIED"
  balanceKind: "COMPONENTS" | "CLOSING_ONLY"
  openingBalance: string
  demand: string
  rebateAndCredits: string
  penaltyAndInterest: string
  payments: string
  outstanding: string
  closingBalance: string
}

type Ledger = {
  property: {
    surveyId: string
    propertyId: string
    ownerName: string | null
    fatherName: string | null
    wardName: string
    wardNumber: number
    houseNo: string | null
    address: string
  }
  header: {
    assessmentYearId: string
    assessmentYear: string
    openingBalance: string
    currentDemand: string
    penaltyAndInterest: string
    rebatesAndCredits: string
    totalPayments: string
    closingOutstanding: string
    authoritative: boolean
    warning: string | null
    unreconciledYears: Array<{ name: string; reason: string }>
  } | null
  years: YearRow[]
  yearsWithArrears: Array<{ name: string; outstanding: string }>
  entries: Entry[]
  totalEntries: number
  closingBalance: string
  reconciles: boolean
  engineOutstanding: string
}

const TYPE_LABEL: Record<string, string> = {
  DEMAND: "Demand / मांग",
  OPENING_BALANCE: "Historical balance / पुराना बकाया",
  REBATE: "Rebate / छूट",
  HISTORICAL_PAYMENTS: "Historical payments",
  CREDIT: "Credit / समायोजन",
  DEBIT: "Charge / शुल्क",
  PAYMENT: "Payment / भुगतान",
  PAYMENT_REVERSAL: "Reversal / निरस्तीकरण",
  PENDING_PAYMENT: "Pending instrument",
}

const MODE_LABEL: Record<string, string> = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  DD: "Demand draft",
  UPI_MANUAL: "UPI (manual)",
  OTHER: "Bank transfer",
  ONLINE: "Online",
}

function when(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
}

function abs(value: string): string {
  return value.startsWith("-") ? value.slice(1) : value
}

function partsText(parts: Parts): string {
  const names: Array<[keyof Parts, string]> = [
    ["propertyTax", "Property"],
    ["waterTax", "Water"],
    ["drainageTax", "Drainage"],
    ["penalty", "Penalty"],
    ["interest", "Interest/charges"],
  ]
  return names
    .filter(([key]) => (toPaise(abs(parts[key])) ?? 0n) > 0n)
    .map(([key, label]) => `${label} ${inr(abs(parts[key]))}`)
    .join(" · ")
}

export default function LedgerPageWrapper() {
  return (
    <React.Suspense fallback={<LoadingBlock rows={4} />}>
      <LedgerPage />
    </React.Suspense>
  )
}

function LedgerPage() {
  const router = useRouter()
  const params = useSearchParams()
  const surveyId = params.get("surveyId") ?? ""
  const [term, setTerm] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  const [filters, setFilters] = React.useState({ assessmentYearId: "", dateFrom: "", dateTo: "", category: "", status: "" })

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 300)
    return () => clearTimeout(t)
  }, [term])

  const hits = useQuery({
    queryKey: ["collection-search", debounced],
    enabled: debounced.length >= 2,
    queryFn: () =>
      api.get<SearchHit[]>(`/api/v1/collections/properties/search?q=${encodeURIComponent(debounced)}`).then((res) => res.data),
  })

  const qs = new URLSearchParams({ surveyId })
  for (const [key, value] of Object.entries(filters)) if (value) qs.set(key, value)
  const ledger = useQuery({
    queryKey: ["collection-ledger", qs.toString()],
    enabled: Boolean(surveyId),
    queryFn: () => api.get<Ledger>(`/api/v1/collections/ledger?${qs}`).then((res) => res.data),
    placeholderData: (previous) => previous,
  })

  const select = (id: string) => {
    setTerm("")
    setFilters({ assessmentYearId: "", dateFrom: "", dateTo: "", category: "", status: "" })
    router.replace(`/collections/ledger?surveyId=${id}`)
  }

  const data = ledger.data
  const h = data?.header

  return (
    <div className="space-y-6">
      <Panel title="Consumer ledger / उपभोक्ता खाता" description="Every demand, rebate, payment and reversal in date order. Posted records are never edited; corrections appear as reversals or approved adjustments.">
        <div className="space-y-3">
          <Field id="ledger-search" label="Find property" hint="Property ID / PIN, owner, house or parcel number.">
            {(props) => (
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                <Input {...props} className="pl-8" autoComplete="off" value={term} onChange={(e) => setTerm(e.target.value)} />
              </div>
            )}
          </Field>
          {hits.isError ? <ErrorBlock error={hits.error} /> : null}
          {debounced.length >= 2 && hits.data?.length === 0 ? <EmptyBlock title="No property matches" /> : null}
          {term && hits.data && hits.data.length > 0 ? (
            <ul className="divide-y rounded-lg border" aria-label="Matching properties">
              {hits.data.map((hit) => (
                <li key={hit.surveyId}>
                  <button type="button" className="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none" onClick={() => select(hit.surveyId)}>
                    <span className="font-mono text-xs">{hit.propertyId}</span> <span className="font-medium">{hit.ownerName ?? "—"}</span>{" "}
                    <span className="text-muted-foreground">· {hit.wardName}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Panel>

      {!surveyId ? <EmptyBlock title="Search for a property to open its ledger" /> : null}
      {surveyId && ledger.isLoading ? <LoadingBlock rows={6} /> : null}
      {ledger.isError ? <ErrorBlock error={ledger.error} onRetry={() => void ledger.refetch()} /> : null}

      {data ? (
        <>
          <Panel
            title={`${data.property.propertyId} · ${data.property.ownerName ?? "—"}`}
            description={`${data.property.fatherName ? `Father/husband: ${data.property.fatherName} · ` : ""}Ward ${data.property.wardNumber} — ${data.property.wardName} · House ${data.property.houseNo ?? "—"} · ${data.property.address}`}
          >
            <div className="space-y-3">
              {h && !h.authoritative ? (
                <Notice tone="warning">
                  {h.warning}{" "}
                  {h.unreconciledYears.length ? `Needs reconciliation: ${h.unreconciledYears.map((y) => y.name).join(", ")}.` : ""}
                </Notice>
              ) : null}
              {h ? (
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    ["Opening balance (arrears)", h.openingBalance],
                    [`Current demand ${h.assessmentYear}`, h.currentDemand],
                    ["Penalty, interest & charges", h.penaltyAndInterest],
                    ["Rebates & credits", h.rebatesAndCredits],
                    ["Payments (this year)", h.totalPayments],
                    ["Closing outstanding", h.closingOutstanding],
                  ].map(([label, value], index) => (
                    <div key={label} className={cn("rounded-lg border p-3", index === 5 && "border-warning/50 bg-warning-soft", index === 4 && "border-success/40 bg-success-soft")}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 text-base font-semibold tabular-nums sm:text-lg">{inr(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <p className="flex flex-wrap items-center gap-2 text-sm">
                {data.reconciles ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 aria-hidden className="size-4" /> Ledger agrees with the outstanding calculation ({inr(data.engineOutstanding)}).
                  </span>
                ) : (
                  <span className="font-medium text-destructive">
                    Ledger balance {inr(data.closingBalance)} does not match the outstanding calculation {inr(data.engineOutstanding)}. Report this for reconciliation.
                  </span>
                )}
              </p>
              {data.yearsWithArrears.length > 0 ? (
                <p className="text-sm">
                  <span className="font-medium">Years still unpaid:</span>{" "}
                  {data.yearsWithArrears.map((year) => `${year.name} (${inr(year.outstanding)})`).join(" · ")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No verified year has an unpaid balance.</p>
              )}
            </div>
          </Panel>

          <Panel title="Year-wise balances / वर्षवार शेष" description="Each year opens with the verified closing balance of the year before.">
            <div className="relative overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[760px] text-sm">
                <caption className="sr-only">Year-wise balances</caption>
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    {["Year", "Opening", "Tax demand", "Penalty & interest", "Rebates & credits", "Payments", "Year unpaid", "Closing"].map((label, i) => (
                      <th key={label} scope="col" className={cn("p-2 font-medium", i === 0 ? "text-left" : "text-right")}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.years.map((year) => (
                    <tr key={year.assessmentYearId} className="border-t">
                      <th scope="row" className="p-2 text-left font-medium">
                        {year.assessmentYearName}
                        {year.verificationStatus === "UNVERIFIED" ? <span className="ml-1"><StatusBadge status="UNVERIFIED" /></span> : null}
                        {year.balanceKind === "CLOSING_ONLY" ? <span className="block text-xs font-normal text-muted-foreground">Historical closing balance</span> : null}
                      </th>
                      <td className="p-2 text-right tabular-nums">{inr(year.openingBalance)}</td>
                      <td className="p-2 text-right tabular-nums">{inr(year.demand)}</td>
                      <td className="p-2 text-right tabular-nums">{inr(year.penaltyAndInterest)}</td>
                      <td className="p-2 text-right tabular-nums">{inr(year.rebateAndCredits)}</td>
                      <td className="p-2 text-right tabular-nums">{inr(year.payments)}</td>
                      <td className="p-2 text-right font-medium tabular-nums">{inr(year.outstanding)}</td>
                      <td className="p-2 text-right font-semibold tabular-nums">{inr(year.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Transactions / लेन-देन" description={`${data.entries.length} of ${data.totalEntries} entries. Running balances are calculated before filtering.`}>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Field id="ledger-year" label="Assessment year">
                  {(props) => (
                    <select {...props} className={selectClass} value={filters.assessmentYearId} onChange={(e) => setFilters((f) => ({ ...f, assessmentYearId: e.target.value }))}>
                      <option value="">All years</option>
                      {data.years.map((year) => (
                        <option key={year.assessmentYearId} value={year.assessmentYearId}>{year.assessmentYearName}</option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field id="ledger-from" label="From">
                  {(props) => <Input {...props} type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />}
                </Field>
                <Field id="ledger-to" label="To">
                  {(props) => <Input {...props} type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />}
                </Field>
                <Field id="ledger-tax" label="Tax">
                  {(props) => (
                    <select {...props} className={selectClass} value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
                      <option value="">All taxes</option>
                      <option value="propertyTax">Property tax</option>
                      <option value="waterTax">Water tax</option>
                      <option value="drainageTax">Drainage tax</option>
                      <option value="penalty">Penalty</option>
                      <option value="interest">Interest &amp; charges</option>
                    </select>
                  )}
                </Field>
                <Field id="ledger-status" label="Status">
                  {(props) => (
                    <select {...props} className={selectClass} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                      <option value="">All</option>
                      <option value="POSTED">Posted</option>
                      <option value="REVERSED">Reversed</option>
                      <option value="PENDING">Pending</option>
                      <option value="UNVERIFIED">Unverified</option>
                    </select>
                  )}
                </Field>
              </div>
              {data.entries.length === 0 ? <EmptyBlock title="No transactions match these filters" /> : null}
              {data.entries.length > 0 ? (
                <div className="relative overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[1080px] text-sm">
                    <caption className="sr-only">Ledger transactions</caption>
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="p-2 text-left font-medium">Date</th>
                        <th scope="col" className="p-2 text-left font-medium">Entry</th>
                        <th scope="col" className="p-2 text-left font-medium">Year</th>
                        <th scope="col" className="p-2 text-right font-medium">Demand / charge</th>
                        <th scope="col" className="p-2 text-right font-medium">Received / credit</th>
                        <th scope="col" className="p-2 text-right font-medium">Balance after</th>
                        <th scope="col" className="p-2 text-left font-medium">Mode · collector</th>
                        <th scope="col" className="p-2 text-left font-medium">Status</th>
                        <th scope="col" className="p-2 text-left font-medium">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.entries.map((entry) => (
                        <tr key={entry.id} className={cn("border-t align-top", !entry.counted && "text-muted-foreground")}>
                          <td className="p-2 whitespace-nowrap">{when(entry.at)}</td>
                          <td className="p-2">
                            <span className="font-medium">{TYPE_LABEL[entry.type] ?? entry.type}</span>
                            <span className="block text-xs text-muted-foreground">{entry.description}</span>
                            {partsText(entry.parts) ? <span className="block text-xs">{partsText(entry.parts)}</span> : null}
                          </td>
                          <td className="p-2 whitespace-nowrap">{entry.assessmentYearName ?? "—"}</td>
                          <td className="p-2 text-right tabular-nums">{(toPaise(entry.debit) ?? 0n) > 0n ? inr(entry.debit) : ""}</td>
                          <td className="p-2 text-right tabular-nums">{(toPaise(entry.credit) ?? 0n) > 0n ? inr(entry.credit) : ""}</td>
                          <td className="p-2 text-right font-medium tabular-nums">
                            {inr(entry.balanceAfter)}
                            {!entry.counted ? <span className="block text-xs font-normal">not counted</span> : null}
                          </td>
                          <td className="p-2">
                            {entry.paymentMode ? MODE_LABEL[entry.paymentMode] ?? entry.paymentMode : "—"}
                            {entry.reference ? <span className="block font-mono text-xs">{entry.reference}</span> : null}
                            {entry.collector ? <span className="block text-xs text-muted-foreground">{entry.collector}</span> : null}
                          </td>
                          <td className="p-2"><StatusBadge status={entry.status} /></td>
                          <td className="p-2">
                            {entry.receiptNumber && entry.paymentId && entry.type === "PAYMENT" ? (
                              <div className="space-y-1">
                                <span className="block font-mono text-xs">{entry.receiptNumber}</span>
                                <ReceiptActions paymentId={entry.paymentId} receiptNumber={entry.receiptNumber} />
                              </div>
                            ) : entry.receiptNumber ? (
                              <span className="font-mono text-xs">{entry.receiptNumber}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  )
}
