"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Loader2, Plus, Search } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

import {
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  Notice,
  Panel,
  selectClass,
} from "@/components/admin/admin-ui"
import { usePermission } from "@/hooks/use-permission"
import { api } from "@/lib/api"
import {
  acceptPaymentStep,
  collectionAdvance,
  demandPublishOffer,
  quoteDemandPublished,
} from "@/lib/collection-eligibility"
import { formatApiError } from "@/lib/format-api-error"
import {
  AllocationTable,
  inr,
  ReceiptActions,
  StatusBadge,
  toPaise,
  useCollectionLookups,
  useSelectedAssessmentYear,
  type AllocationLine,
} from "./collection-shared"

type Summary = {
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
  payable: string
  collected: string
  outstanding: string
  status: string
}

type SearchHit = {
  surveyId: string
  propertyId: string
  ownerName: string | null
  wardName: string
  wardNumber: number
  houseNo: string | null
  address: string
}

type Quote = {
  property: {
    surveyId: string
    propertyId: string
    ownerName: string | null
    fatherName: string | null
    wardName: string
    wardNumber: number
    houseNo: string | null
    address: string
    mobile: string | null
  }
  assessmentYear: { id: string; name: string }
  demandReference: string | null
  /** Set by the quote API from the published demand row. Absent on older responses. */
  demandPublished?: boolean
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
  previousDues: string
  rebate: string
  approvedCredits: string
  approvedDebits: string
  totalPayable: string
  netOutstanding: string
  paymentsAllocated: string
  authoritative: boolean
  warning: string | null
  years: Array<{
    assessmentYearId: string
    assessmentYearName: string
    outstanding: string
    verificationStatus: string
  }>
}

type Preview = {
  amount: string
  outstandingBefore: string
  outstandingAfter: string
  paymentStatus: "PARTIALLY_PAID" | "PAID"
  lines: AllocationLine[]
  rule: string
}

type Posted = {
  paymentId: string
  status: string
  amount: string
  receiptNumber: string | null
  paymentMode: string
  remaining: string | null
  outstandingBefore: string | null
  allocations: AllocationLine[] | null
  created: boolean
}

const MODES = [
  { value: "CASH", label: "Cash / नकद" },
  { value: "CHEQUE", label: "Cheque / चेक" },
  { value: "DD", label: "Demand draft / डिमांड ड्राफ्ट" },
  { value: "UPI_MANUAL", label: "UPI at counter (manual) / यूपीआई" },
  { value: "OTHER", label: "Bank transfer / बैंक अंतरण" },
] as const

const STEPS = ["Find property", "Confirm dues", "Enter payment", "Review & post", "Receipt"] as const

function istToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())
}

/** HH:mm now in IST, for comparing with a typed payment time. */
function istNowTime(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date())
}

/** Taxes that make up the amount due, in the words used on the demand notice. */
function taxCategories(quote: Quote): string[] {
  const has = (...values: string[]) => values.some((value) => (toPaise(value.replace("-", "")) ?? 0n) > 0n)
  return [
    has(quote.propertyTax) && "Property tax / गृहकर",
    has(quote.waterTax) && "Water tax / जलकर",
    has(quote.drainageTax) && "Drainage tax / जल निकासी कर",
    has(quote.penalty, quote.interest, quote.approvedDebits) && "Penalty & interest / शास्ति व ब्याज",
    has(quote.previousDues) && "Previous-year arrears / पूर्व बकाया",
  ].filter((label): label is string => Boolean(label))
}

function Stepper({ current }: { current: number }) {
  return (
    <ol aria-label="Collection progress" className="grid grid-cols-5 gap-1.5">
      {STEPS.map((label, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo"
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "flex min-w-0 flex-col gap-1 rounded-md border px-2 py-1.5 text-xs",
              state === "current" && "border-primary bg-primary/5 font-semibold text-foreground",
              state === "done" && "text-foreground",
              state === "todo" && "text-muted-foreground"
            )}
          >
            <span className="tabular-nums">
              {state === "done" ? <CheckCircle2 aria-hidden className="inline size-3.5 text-success" /> : null}{" "}
              Step {index + 1}
              <span className="sr-only">{state === "done" ? " (done)" : state === "current" ? " (current)" : ""}</span>
            </span>
            <span className="hidden truncate sm:block">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Figure({ label, value, emphasis }: { label: string; value: string; emphasis?: "due" | "paid" | "total" }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        emphasis === "due" && "border-warning/50 bg-warning-soft",
        emphasis === "paid" && "border-success/40 bg-success-soft",
        emphasis === "total" && "bg-muted/50"
      )}
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

export default function OfflineCollectionPage() {
  const { years, wards } = useCollectionLookups()
  const { hasPermission, user } = usePermission()
  const canCollect = hasPermission("payment:collect")
  const queryClient = useQueryClient()
  const [assessmentYearId, setAssessmentYearId] = useSelectedAssessmentYear(years)

  // Guided flow state
  const [step, setStep] = React.useState(0)
  const [term, setTerm] = React.useState("")
  const [searchWard, setSearchWard] = React.useState("")
  const [debouncedTerm, setDebouncedTerm] = React.useState("")
  const [surveyId, setSurveyId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    amount: "",
    paymentMode: "CASH",
    paymentDate: istToday(),
    paymentTime: "",
    reference: "",
    remarks: "",
    counterCode: "",
  })
  const [confirming, setConfirming] = React.useState(false)
  const [touched, setTouched] = React.useState(false)
  const idempotencyKey = React.useRef("")
  const [posted, setPosted] = React.useState<Posted | null>(null)
  const headingRef = React.useRef<HTMLHeadingElement>(null)

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(term.trim()), 300)
    return () => clearTimeout(t)
  }, [term])

  // Move focus to the step heading so keyboard and screen-reader users follow along.
  React.useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  // Inside a ward one character is enough, so a house number like "7" finds the property.
  const searchReady = searchWard ? true : debouncedTerm.length >= 2
  const hits = useQuery({
    queryKey: ["collection-search", debouncedTerm, searchWard],
    enabled: searchReady,
    queryFn: () =>
      api
        .get<SearchHit[]>(
          `/api/v1/collections/properties/search?q=${encodeURIComponent(debouncedTerm)}${searchWard ? `&wardId=${searchWard}` : ""}`
        )
        .then((res) => res.data),
  })

  const quote = useQuery({
    queryKey: ["collection-quote", surveyId, assessmentYearId],
    enabled: Boolean(surveyId && assessmentYearId),
    queryFn: () =>
      api
        .get<Quote>(`/api/v1/collections/quote?surveyId=${surveyId}&assessmentYearId=${assessmentYearId}`)
        .then((res) => res.data),
  })
  const paymentStepPending = React.useRef(false)
  React.useEffect(() => {
    paymentStepPending.current = false
  }, [step])
  const advance = quote.data
    ? collectionAdvance({
        demandPublished: quoteDemandPublished(quote.data),
        authoritative: quote.data.authoritative,
        netOutstandingPaise: toPaise(quote.data.netOutstanding),
        assessmentYearName: quote.data.assessmentYear.name,
        warning: quote.data.warning,
      })
    : null
  const publishOffer = demandPublishOffer({
    canPublish: hasPermission("demand:publish"),
    canOpenLedger: hasPermission("report:read"),
  })

  const outstanding = quote.data?.netOutstanding ?? "0.00"
  const amountPaise = toPaise(form.amount)
  const outstandingPaise = toPaise(outstanding) ?? 0n
  const errors = {
    amount:
      amountPaise === null
        ? "Enter the amount received, e.g. 3000 or 3000.50"
        : amountPaise <= 0n
          ? "The amount must be more than zero"
          : amountPaise > outstandingPaise
            ? `Above the outstanding ${inr(outstanding)}. Advance payment is not configured.`
            : null,
    reference:
      form.paymentMode !== "CASH" && !form.reference.trim()
        ? "A cheque, draft, UPI or transfer reference is required"
        : null,
    paymentDate: !form.paymentDate
      ? "Choose the payment date"
      : form.paymentDate > istToday()
        ? "The payment date cannot be in the future"
        : null,
    paymentTime:
      form.paymentTime && form.paymentDate === istToday() && form.paymentTime > istNowTime()
        ? "The payment time cannot be later than now"
        : null,
  }
  const formValid = !errors.amount && !errors.reference && !errors.paymentDate && !errors.paymentTime

  const preview = useQuery({
    queryKey: ["collection-preview", surveyId, assessmentYearId, form.amount],
    enabled: step === 3 && Boolean(surveyId) && formValid,
    queryFn: () =>
      api
        .post<Preview>("/api/v1/collections/preview", {
          surveyId,
          assessmentYearId,
          amount: form.amount.trim(),
        })
        .then((res) => res.data),
  })

  const collect = useMutation({
    mutationFn: () =>
      api.post<Posted>("/api/v1/collections", {
        surveyId,
        assessmentYearId,
        amount: form.amount.trim(),
        paymentMode: form.paymentMode,
        paymentDate: form.paymentDate || undefined,
        paymentTime: form.paymentTime || undefined,
        reference: form.reference.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
        counterCode: form.counterCode.trim() || undefined,
        idempotencyKey: idempotencyKey.current,
      }),
    onSuccess: (res) => {
      setPosted(res.data)
      setConfirming(false)
      setStep(4)
      toast.success(
        res.data.status === "SUCCESS"
          ? `Payment posted. Receipt ${res.data.receiptNumber}`
          : "Instrument recorded as pending. Confirm it on the Receipts tab when it clears."
      )
      for (const key of ["collection-summary", "collection-properties", "collection-quote", "collection-receipts", "collection-ledger"]) {
        void queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
    onError: (error) => {
      setConfirming(false)
      toast.error(formatApiError(error, "The payment was not posted"))
    },
  })

  function startNew() {
    setStep(0)
    setSurveyId(null)
    setPosted(null)
    setTouched(false)
    setTerm("")
    setForm({ amount: "", paymentMode: "CASH", paymentDate: istToday(), paymentTime: "", reference: "", remarks: "", counterCode: form.counterCode })
  }

  function pickProperty(id: string) {
    setSurveyId(id)
    setPosted(null)
    setTouched(false)
    setForm((current) => ({ ...current, amount: "", paymentTime: "", reference: "", remarks: "" }))
    setStep(1)
  }

  const publishDemand = useMutation({
    mutationFn: () => {
      if (!surveyId || !assessmentYearId) {
        throw new Error("Select a property and assessment year before publishing")
      }
      return api.post("/api/v1/demands/publish", { surveyId, assessmentYearId })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["collection-quote", surveyId, assessmentYearId] })
      toast.success("Demand published. Confirm the dues, then enter the payment.")
    },
    onError: (error) => {
      toast.error(formatApiError(error, "The demand was not published"))
    },
  })

  function continueToPayment() {
    if (!advance || !acceptPaymentStep({ decision: advance, transitionPending: paymentStepPending.current })) {
      return
    }
    paymentStepPending.current = true
    setStep(2)
  }

  function goToReview() {
    setTouched(true)
    if (!formValid || !advance?.ok || paymentStepPending.current) return
    paymentStepPending.current = true
    // One key per reviewed request: a retry after a network error cannot post twice.
    idempotencyKey.current = crypto.randomUUID()
    setStep(3)
  }

  const yearSelect = (
    <Field id="collect-year" label="Assessment year / निर्धारण वर्ष">
      {(props) => (
        <select
          {...props}
          className={cn(selectClass, "sm:w-48")}
          value={assessmentYearId}
          disabled={step >= 3}
          onChange={(event) => setAssessmentYearId(event.target.value)}
        >
          {[...years]
            .sort((a, b) => b.code.localeCompare(a.code))
            .map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
        </select>
      )}
    </Field>
  )

  return (
    <div className="space-y-6">
      {canCollect ? (
        <Panel
          title={
            <span ref={headingRef} tabIndex={-1} className="outline-none">
              Counter collection / काउंटर संग्रह — {STEPS[step]}
            </span>
          }
          description="Amounts come from the published demand ledger. Nothing is saved until you post the payment."
          actions={yearSelect}
        >
          <div className="space-y-5">
            <Stepper current={step} />

            {step === 0 ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
                  <Field
                    id="collect-search"
                    label="Search property / संपत्ति खोजें"
                    hint="Property ID / PIN, owner name, house number or parcel number. Pick a ward to search by house number alone."
                  >
                    {(props) => (
                      <div className="relative">
                        <Search aria-hidden className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                        <Input
                          {...props}
                          className="pl-8"
                          value={term}
                          autoComplete="off"
                          onChange={(event) => setTerm(event.target.value)}
                          placeholder="e.g. 249044-001-000001 or owner name"
                        />
                      </div>
                    )}
                  </Field>
                  <Field id="collect-ward" label="Search in ward / वार्ड में खोजें">
                    {(props) => (
                      <select {...props} className={selectClass} value={searchWard} onChange={(event) => setSearchWard(event.target.value)}>
                        <option value="">All wards</option>
                        {[...wards]
                          .sort((a, b) => a.number - b.number)
                          .map((ward) => (
                            <option key={ward.id} value={ward.id}>
                              {ward.number} — {ward.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </Field>
                </div>
                {hits.isFetching && !hits.data ? <LoadingBlock rows={2} /> : null}
                {hits.isError ? <ErrorBlock error={hits.error} onRetry={() => void hits.refetch()} /> : null}
                {searchReady && hits.data?.length === 0 ? (
                  <EmptyBlock title="No property matches">Check the property ID or try the owner&apos;s name.</EmptyBlock>
                ) : null}
                {hits.data && hits.data.length > 0 ? (
                  <ul className="divide-y rounded-lg border" aria-label="Matching properties">
                    {hits.data.map((hit) => (
                      <li key={hit.surveyId}>
                        <button
                          type="button"
                          className="flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
                          onClick={() => pickProperty(hit.surveyId)}
                        >
                          <span className="min-w-0">
                            <span className="font-mono text-xs">{hit.propertyId}</span>{" "}
                            <span className="font-medium">{hit.ownerName ?? "—"}</span>
                            <span className="block truncate text-xs text-muted-foreground">{hit.address}</span>
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            Ward {hit.wardNumber} — {hit.wardName}
                            {hit.houseNo ? ` · House ${hit.houseNo}` : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {step >= 1 && step <= 3 && quote.isLoading ? <LoadingBlock rows={4} /> : null}
            {step >= 1 && step <= 3 && quote.isError ? (
              <ErrorBlock error={quote.error} onRetry={() => void quote.refetch()} />
            ) : null}

            {step >= 1 && step <= 3 && quote.data ? (
              <PropertySummary quote={quote.data} compact={step > 1} />
            ) : null}

            {step === 1 && quote.data && advance ? (
              <div className="space-y-3">
                {advance.ok ? null : (
                  <Notice tone={advance.code === "NOTHING_OUTSTANDING" ? "success" : "warning"}>
                    <p id="collect-step-block">{advance.message}</p>
                    {advance.code === "DEMAND_NOT_PUBLISHED" ? (
                      <p className="mt-1 text-muted-foreground">
                        The amounts above are calculated from the published rate table and active rebate rules. They are not a demand on the ledger, so they cannot be collected.
                      </p>
                    ) : null}
                  </Notice>
                )}
                {!advance.ok && advance.code === "DEMAND_NOT_PUBLISHED" && publishOffer === "publish" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      className="cursor-pointer"
                      disabled={publishDemand.isPending}
                      onClick={() => {
                        if (publishDemand.isPending) return
                        publishDemand.mutate()
                      }}
                    >
                      {publishDemand.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                      Publish this property&apos;s demand
                    </Button>
                    {hasPermission("report:read") ? (
                      <Link href="/reports/tax-rates" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                        Open Demand Ledger
                      </Link>
                    ) : null}
                  </div>
                ) : null}
                {!advance.ok && advance.code === "DEMAND_NOT_PUBLISHED" && publishOffer === "ledger" ? (
                  <Link href="/reports/tax-rates" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                    Open Demand Ledger
                  </Link>
                ) : null}
                {!advance.ok && advance.code === "DEMAND_NOT_PUBLISHED" && publishOffer === "none" ? (
                  <p className="text-sm text-muted-foreground">
                    A user who is allowed to publish demands must publish this property before collection can continue.
                  </p>
                ) : null}
                {!advance.ok && advance.code === "QUOTE_INVALID" ? (
                  <Button type="button" variant="outline" className="cursor-pointer" onClick={() => void quote.refetch()}>
                    Retry loading dues
                  </Button>
                ) : null}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setStep(0)}>
                    <ArrowLeft aria-hidden className="size-4" /> Different property
                  </Button>
                  <Button
                    type="button"
                    className="cursor-pointer"
                    disabled={!advance.ok}
                    aria-describedby={advance.ok ? undefined : "collect-step-block"}
                    onClick={continueToPayment}
                  >
                    Details are correct — enter payment <ArrowRight aria-hidden className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 2 && quote.data ? (
              <form
                className="space-y-4"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault()
                  goToReview()
                }}
              >
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">
                    Tax categories due up to {quote.data.assessmentYear.name}. The amount is applied in the approved order shown on the
                    next step.
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Tax categories due">
                    {taxCategories(quote.data).map((label) => (
                      <li key={label} className="rounded-md border bg-background px-2 py-0.5 text-xs font-medium">
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="collect-amount"
                    label="Amount received (₹) / प्राप्त राशि"
                    required
                    hint={`Outstanding up to ${quote.data.assessmentYear.name}: ${inr(outstanding)}. Part payment is allowed.`}
                    error={touched ? errors.amount : null}
                  >
                    {(props) => (
                      <div className="flex gap-2">
                        <Input
                          {...props}
                          inputMode="decimal"
                          autoComplete="off"
                          value={form.amount}
                          onChange={(event) => setForm((c) => ({ ...c, amount: event.target.value }))}
                          placeholder="0.00"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0 cursor-pointer"
                          onClick={() => setForm((c) => ({ ...c, amount: outstanding }))}
                        >
                          Full amount
                        </Button>
                      </div>
                    )}
                  </Field>
                  <Field id="collect-mode" label="Payment mode / भुगतान का प्रकार" required>
                    {(props) => (
                      <select
                        {...props}
                        className={selectClass}
                        value={form.paymentMode}
                        onChange={(event) => setForm((c) => ({ ...c, paymentMode: event.target.value }))}
                      >
                        {MODES.map((mode) => (
                          <option key={mode.value} value={mode.value}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <Field
                    id="collect-date"
                    label="Payment date / भुगतान दिनांक"
                    required
                    error={touched ? errors.paymentDate : null}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        type="date"
                        max={istToday()}
                        value={form.paymentDate}
                        onChange={(event) => setForm((c) => ({ ...c, paymentDate: event.target.value }))}
                      />
                    )}
                  </Field>
                  <Field
                    id="collect-time"
                    label="Payment time / समय"
                    hint="Optional. Blank records the current time today, or 12:00 noon for an earlier date."
                    error={touched ? errors.paymentTime : null}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        type="time"
                        value={form.paymentTime}
                        onChange={(event) => setForm((c) => ({ ...c, paymentTime: event.target.value }))}
                      />
                    )}
                  </Field>
                  <Field
                    id="collect-ref"
                    label="Cheque / draft / UPI / transfer reference"
                    required={form.paymentMode !== "CASH"}
                    error={touched ? errors.reference : null}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        autoComplete="off"
                        value={form.reference}
                        onChange={(event) => setForm((c) => ({ ...c, reference: event.target.value }))}
                      />
                    )}
                  </Field>
                  <Field id="collect-counter" label="Counter / काउंटर" hint="Optional. Printed on the office copy.">
                    {(props) => (
                      <Input
                        {...props}
                        value={form.counterCode}
                        onChange={(event) => setForm((c) => ({ ...c, counterCode: event.target.value }))}
                      />
                    )}
                  </Field>
                  <Field id="collect-collector" label="Collector / संग्रहकर्ता" hint="Recorded from your sign-in.">
                    {(props) => <Input {...props} value={user?.name ?? "—"} readOnly disabled />}
                  </Field>
                  <div className="sm:col-span-2">
                    <Field id="collect-remarks" label="Remarks / टिप्पणी" hint="Optional. Kept with the payment record.">
                      {(props) => (
                        <Textarea
                          {...props}
                          rows={2}
                          value={form.remarks}
                          onChange={(event) => setForm((c) => ({ ...c, remarks: event.target.value }))}
                        />
                      )}
                    </Field>
                  </div>
                </div>
                {form.paymentMode !== "CASH" && form.paymentMode !== "UPI_MANUAL" ? (
                  <Notice>
                    A cheque, draft or bank transfer is recorded as <strong>pending</strong>. The balance and the receipt
                    change only after it is confirmed as cleared.
                  </Notice>
                ) : null}
                {advance && !advance.ok ? (
                  <Notice tone="warning">
                    <p>{advance.message}</p>
                  </Notice>
                ) : null}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setStep(1)}>
                    <ArrowLeft aria-hidden className="size-4" /> Back
                  </Button>
                  <Button type="submit" className="cursor-pointer" disabled={Boolean(advance && !advance.ok)}>
                    Review allocation <ArrowRight aria-hidden className="size-4" />
                  </Button>
                </div>
              </form>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                {preview.isLoading ? <LoadingBlock rows={3} /> : null}
                {preview.isError ? <ErrorBlock error={preview.error} onRetry={() => void preview.refetch()} /> : null}
                {preview.data ? (
                  <>
                    <dl className="grid gap-2 sm:grid-cols-3">
                      <Figure label="Outstanding before payment" value={inr(preview.data.outstandingBefore)} emphasis="total" />
                      <Figure label="Amount received" value={inr(preview.data.amount)} emphasis="paid" />
                      <Figure label="Remaining after payment" value={inr(preview.data.outstandingAfter)} emphasis={preview.data.paymentStatus === "PAID" ? "total" : "due"} />
                    </dl>
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      Result: <StatusBadge status={preview.data.paymentStatus} />
                      <span className="text-muted-foreground">
                        {MODES.find((mode) => mode.value === form.paymentMode)?.label}
                        {form.reference ? ` · Ref ${form.reference}` : ""} · {form.paymentDate}
                        {form.paymentTime ? ` ${form.paymentTime}` : ""}
                      </span>
                    </p>
                    <AllocationTable lines={preview.data.lines} caption="How the amount will be applied" />
                    <p className="text-xs text-muted-foreground">Allocation order: {preview.data.rule}</p>
                  </>
                ) : null}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="outline" className="cursor-pointer" disabled={collect.isPending} onClick={() => setStep(2)}>
                    <ArrowLeft aria-hidden className="size-4" /> Change payment
                  </Button>
                  <Button
                    type="button"
                    className="cursor-pointer"
                    disabled={!preview.data || collect.isPending}
                    onClick={() => setConfirming(true)}
                  >
                    {collect.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                    {collect.isPending ? "Posting…" : `Post payment of ${preview.data ? inr(preview.data.amount) : ""}…`}
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 4 && posted ? (
              <div className="space-y-4" aria-live="polite">
                {posted.status === "SUCCESS" ? (
                  <Notice tone="success">
                    Payment posted{posted.created ? "" : " (this request was already posted; showing the original receipt)"}. Receipt{" "}
                    <strong className="font-mono">{posted.receiptNumber}</strong>.
                  </Notice>
                ) : (
                  <Notice tone="warning">
                    The instrument is recorded as <strong>pending</strong>. No receipt is issued and the balance is unchanged until it is
                    confirmed on the Receipts tab.
                  </Notice>
                )}
                <dl className="grid gap-2 sm:grid-cols-3">
                  <Figure label="Payable before this payment" value={inr(posted.outstandingBefore ?? quote.data?.netOutstanding)} emphasis="total" />
                  <Figure label="Amount received" value={inr(posted.amount)} emphasis="paid" />
                  <Figure
                    label="Remaining outstanding"
                    value={inr(posted.remaining ?? quote.data?.netOutstanding)}
                    emphasis={posted.remaining && toPaise(posted.remaining)! > 0n ? "due" : "total"}
                  />
                </dl>
                {posted.allocations?.length ? (
                  <AllocationTable lines={posted.allocations} caption="How the payment was applied" />
                ) : null}
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                  {posted.status === "SUCCESS" ? (
                    <ReceiptActions paymentId={posted.paymentId} receiptNumber={posted.receiptNumber} />
                  ) : (
                    <span className="text-sm text-muted-foreground">Receipt is printed after confirmation.</span>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/collections/ledger?surveyId=${surveyId}`}
                      className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}
                    >
                      <BookOpen aria-hidden className="size-4" /> View ledger
                    </Link>
                    <Button className="cursor-pointer" onClick={startNew}>
                      <Plus aria-hidden className="size-4" /> New collection
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>
      ) : (
        <Notice>You can view collections and ledgers. Posting payments needs the “Collect offline tax” permission.</Notice>
      )}

      {preview.data && quote.data ? (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={`Post ${inr(preview.data.amount)} for ${quote.data.property.ownerName ?? quote.data.property.propertyId}?`}
          description={
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm text-foreground">
              <dt className="text-muted-foreground">Consumer</dt>
              <dd className="font-medium">
                {quote.data.property.ownerName ?? "—"} · <span className="font-mono text-xs">{quote.data.property.propertyId}</span>
              </dd>
              <dt className="text-muted-foreground">Assessment year</dt>
              <dd>{quote.data.assessmentYear.name}</dd>
              <dt className="text-muted-foreground">Tax categories</dt>
              <dd>{taxCategories(quote.data).map((label) => label.split(" / ")[0]).join(", ")}</dd>
              <dt className="text-muted-foreground">Applied to</dt>
              <dd>{preview.data.lines.map((line) => `${line.assessmentYearName} ${inr(line.amount)}`).join(" · ")}</dd>
              <dt className="text-muted-foreground">Mode</dt>
              <dd>
                {MODES.find((mode) => mode.value === form.paymentMode)?.label}
                {form.reference ? ` · Ref ${form.reference}` : ""}
              </dd>
              <dt className="text-muted-foreground">Amount received</dt>
              <dd className="font-semibold tabular-nums">{inr(preview.data.amount)}</dd>
              <dt className="text-muted-foreground">Remaining after</dt>
              <dd className="flex flex-wrap items-center gap-1.5 font-semibold tabular-nums">
                {inr(preview.data.outstandingAfter)} <StatusBadge status={preview.data.paymentStatus} />
              </dd>
            </dl>
          }
          confirmLabel={`Confirm and post ${inr(preview.data.amount)}`}
          pending={collect.isPending}
          onConfirm={() => collect.mutate()}
        />
      ) : null}

      <WardOverview
        assessmentYearId={assessmentYearId}
        wards={wards}
        canCollect={canCollect}
        onCollect={(id) => {
          pickProperty(id)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }}
      />
    </div>
  )
}

function PropertySummary({ quote, compact }: { quote: Quote; compact: boolean }) {
  const arrearsYears = quote.years.filter(
    (year) => year.verificationStatus === "VERIFIED" && (toPaise(year.outstanding) ?? 0n) > 0n
  )
  return (
    <div className="space-y-3 rounded-lg border p-3 sm:p-4">
      <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Property ID / PIN", <span key="id" className="font-mono">{quote.property.propertyId}</span>],
          ["Owner / स्वामी", quote.property.ownerName ?? "—"],
          ["Father / husband", quote.property.fatherName ?? "—"],
          ["Ward / House no.", `${quote.property.wardNumber} — ${quote.property.wardName} · ${quote.property.houseNo ?? "—"}`],
          ["Address", quote.property.address],
          ["Demand", quote.demandReference ? `${quote.assessmentYear.name} · ${quote.demandReference}` : "Not published"],
        ].map(([label, value]) => (
          <div key={String(label)} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {!compact ? (
        <>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Figure label="Property tax (current)" value={inr(quote.propertyTax)} />
            <Figure label="Water tax (current)" value={inr(quote.waterTax)} />
            <Figure label="Drainage tax (current)" value={inr(quote.drainageTax)} />
            <Figure label="Previous-year arrears" value={inr(quote.previousDues)} />
            <Figure label="Penalty & interest" value={inr(String(addMoneyStrings(quote.penalty, quote.interest, quote.approvedDebits)))} />
            <Figure label="Rebate & credits (less)" value={inr(String(addMoneyStrings(quote.rebate, quote.approvedCredits)))} />
            <Figure label="Posted payments (this year)" value={inr(quote.paymentsAllocated)} emphasis="paid" />
            <Figure label="Outstanding now" value={inr(quote.netOutstanding)} emphasis="due" />
          </dl>
          {arrearsYears.length > 0 ? (
            <p className="text-sm">
              <span className="font-medium">Years with unpaid balance:</span>{" "}
              {arrearsYears.map((year) => `${year.assessmentYearName} (${inr(year.outstanding)})`).join(" · ")}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm">
          Outstanding up to {quote.assessmentYear.name}: <strong className="tabular-nums">{inr(quote.netOutstanding)}</strong>
        </p>
      )}
    </div>
  )
}

function addMoneyStrings(...values: string[]): string {
  const total = values.reduce((sum, value) => sum + (toPaise(value) ?? 0n), 0n)
  return `${total / 100n}.${String(total % 100n).padStart(2, "0")}`
}

const CARDS: Array<{ key: keyof Summary; label: string; money?: boolean }> = [
  { key: "currentYearDemand", label: "Current-year demand / चालू वर्ष", money: true },
  { key: "previousArrears", label: "Previous arrears / पूर्व बकाया", money: true },
  { key: "totalPayable", label: "Total payable / कुल देय", money: true },
  { key: "totalCollected", label: "Collected / संग्रहीत", money: true },
  { key: "totalOutstanding", label: "Outstanding / बकाया", money: true },
  { key: "todayOfflineAmount", label: "Today's counter collection", money: true },
  { key: "propertiesWithDues", label: "Properties with dues" },
  { key: "partialPayments", label: "Partially paid / आंशिक" },
  { key: "fullyPaid", label: "Fully paid / पूर्ण भुगतान" },
]

function WardOverview({
  assessmentYearId,
  wards,
  canCollect,
  onCollect,
}: {
  assessmentYearId: string
  wards: Array<{ id: string; name: string }>
  canCollect: boolean
  onCollect: (surveyId: string) => void
}) {
  const [wardId, setWardId] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [page, setPage] = React.useState(1)
  const params = new URLSearchParams({ assessmentYearId, page: String(page), pageSize: "20" })
  if (wardId) params.set("wardId", wardId)
  if (search.trim()) params.set("search", search.trim())
  if (status) params.set("status", status)

  const summary = useQuery({
    queryKey: ["collection-summary", assessmentYearId, wardId],
    enabled: Boolean(assessmentYearId),
    queryFn: () => {
      const qs = new URLSearchParams({ assessmentYearId })
      if (wardId) qs.set("wardId", wardId)
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

  return (
    <Panel title="Collection overview / संग्रह सारांश" description="Totals from posted payments and published demands for the selected year.">
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {CARDS.map((card) => (
            <div key={card.key} className="rounded-lg border p-3">
              <dt className="text-xs text-muted-foreground">{card.label}</dt>
              <dd className="mt-0.5 text-base font-semibold tabular-nums sm:text-lg">
                {summary.isLoading
                  ? "…"
                  : card.money
                    ? inr(summary.data?.[card.key] as string)
                    : String(summary.data?.[card.key] ?? "—")}
              </dd>
            </div>
          ))}
        </dl>
        {summary.isError ? <ErrorBlock error={summary.error} onRetry={() => void summary.refetch()} /> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field id="overview-ward" label="Ward / वार्ड">
            {(props) => (
              <select {...props} className={selectClass} value={wardId} onChange={(e) => { setWardId(e.target.value); setPage(1) }}>
                <option value="">All wards</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>{ward.name}</option>
                ))}
              </select>
            )}
          </Field>
          <Field id="overview-search" label="Property or owner">
            {(props) => (
              <Input {...props} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Property ID, owner, house" />
            )}
          </Field>
          <Field id="overview-status" label="Payment status">
            {(props) => (
              <select {...props} className={selectClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
                <option value="">All</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partially paid</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending instrument</option>
              </select>
            )}
          </Field>
        </div>
        {list.isLoading ? <LoadingBlock rows={4} /> : null}
        {list.isError ? <ErrorBlock error={list.error} onRetry={() => void list.refetch()} /> : null}
        {list.data && list.data.items.length === 0 ? (
          <EmptyBlock title="No published demands match these filters" />
        ) : null}
        {list.data && list.data.items.length > 0 ? (
          <div className="relative overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Properties with published demands</caption>
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="p-2 text-left font-medium">Property</th>
                  <th scope="col" className="p-2 text-left font-medium">Owner</th>
                  <th scope="col" className="p-2 text-left font-medium">Ward</th>
                  <th scope="col" className="p-2 text-right font-medium">Payable</th>
                  <th scope="col" className="p-2 text-right font-medium">Paid</th>
                  <th scope="col" className="p-2 text-right font-medium">Outstanding</th>
                  <th scope="col" className="p-2 text-left font-medium">Status</th>
                  <th scope="col" className="p-2 text-left font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((row) => (
                  <tr key={row.surveyId} className="border-t">
                    <td className="p-2 font-mono text-xs">{row.propertyId}</td>
                    <td className="p-2">{row.ownerName ?? "—"}</td>
                    <td className="p-2">{row.wardName}</td>
                    <td className="p-2 text-right tabular-nums">{inr(row.payable)}</td>
                    <td className="p-2 text-right tabular-nums">{inr(row.collected)}</td>
                    <td className="p-2 text-right font-medium tabular-nums">{inr(row.outstanding)}</td>
                    <td className="p-2"><StatusBadge status={row.status} /></td>
                    <td className="p-2">
                      <div className="flex gap-1.5">
                        {canCollect && row.status !== "PAID" ? (
                          <Button type="button" size="sm" className="cursor-pointer" onClick={() => onCollect(row.surveyId)}>
                            Collect
                          </Button>
                        ) : null}
                        <Link
                          href={`/collections/ledger?surveyId=${row.surveyId}`}
                          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "cursor-pointer")}
                          aria-label={`Ledger for ${row.propertyId}`}
                        >
                          Ledger
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button type="button" variant="outline" size="sm" className="cursor-pointer" disabled={page <= 1} onClick={() => setPage((c) => c - 1)}>
            Previous
          </Button>
          <span>
            Page {list.data?.meta.page ?? page} of {list.data?.meta.totalPages ?? 1}
            {list.data ? ` · ${list.data.meta.total} properties` : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={!list.data || page >= list.data.meta.totalPages}
            onClick={() => setPage((c) => c + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Panel>
  )
}
