"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, FilePlus2, Pencil } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import {
  AdminPageHeader,
  CalcSteps,
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  Notice,
  Panel,
  StatusBadge,
  formatInr,
  selectClass,
  type PreviewStep,
} from "@/components/admin/admin-ui"
import { AuditHistory } from "@/components/admin/audit-history"
import { useCan } from "@/hooks/use-permission"
import { api } from "@/lib/api"
import { formatApiError } from "@/lib/format-api-error"

type Kind = "rebates" | "penalties"
type TaxSlug = "property" | "water" | "drainage"
type TaxCategory = "PROPERTY_TAX" | "WATER_TAX" | "DRAINAGE_TAX"

const TAX: Record<TaxSlug, { category: TaxCategory; en: string; hi: string }> = {
  property: { category: "PROPERTY_TAX", en: "Property tax", hi: "संपत्ति कर" },
  water: { category: "WATER_TAX", en: "Water tax", hi: "जल कर" },
  drainage: { category: "DRAINAGE_TAX", en: "Drainage tax", hi: "नाली कर" },
}

type Policy = {
  id: string
  name: string
  taxCategory: "COMBINED" | TaxCategory
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED"
  rebateType?: "PERCENTAGE" | "FIXED_AMOUNT"
  penaltyType?: "PERCENT_OF_PROPERTY_TAX" | "PERCENT_OF_ELIGIBLE_BASE" | "FIXED_AMOUNT"
  rate: string | null
  fixedAmount: string | null
  maxAmount: string | null
  includePropertyTax: boolean
  includeWaterTax: boolean
  includeDrainageTax: boolean
  includeArrears: boolean
  includePenalty?: boolean
  applyAfterRebate?: boolean
  trigger?: "ON_ASSESSMENT" | "DUE_DATE_PASSED"
  dueDate?: string | null
  graceDays?: number
  startsOn: string | null
  endsOn: string | null
  paymentDeadline?: string | null
  approvedAt: string | null
}

type YearRow = { id: string; name: string; code: string; profile: { status: string; startsOn: string; endsOn: string } | null }

type ChargePreview = {
  eligibleBase: string
  eligibleExplanation: string
  ruleAmount: string
  applies: boolean
  reason: string
  steps: PreviewStep[]
  totals: {
    originalDemand: string
    previousArrears: string
    rebate: string
    penalty: string
    payableBeforePayment: string
    alreadyPaid: string
    outstanding: string
  }
  roundingRule: string
}

const isFixed = (p: Policy) => p.rebateType === "FIXED_AMOUNT" || p.penaltyType === "FIXED_AMOUNT"
const amountLabel = (p: Policy) => (isFixed(p) ? `${formatInr(p.fixedAmount)} fixed` : `${p.rate ?? "0"}%`)

function scopeLabel(p: Policy) {
  if (p.taxCategory !== "COMBINED") {
    const tax = Object.values(TAX).find((t) => t.category === p.taxCategory)
    return `${tax?.en ?? p.taxCategory} only${p.includeArrears ? " + its previous-year arrears" : " (current year)"}`
  }
  const parts = [p.includePropertyTax && "property", p.includeWaterTax && "water", p.includeDrainageTax && "drainage"].filter(Boolean)
  return `Combined: ${parts.join(" + ") || "none"}${p.includeArrears ? " + arrears" : ""}`
}

type FormState = {
  id: string | null
  name: string
  mode: "PERCENT" | "FIXED"
  rate: string
  fixedAmount: string
  maxAmount: string
  includeArrears: boolean
  includePenalty: boolean
  applyAfterRebate: boolean
  trigger: "ON_ASSESSMENT" | "DUE_DATE_PASSED"
  dueDate: string
  graceDays: string
  startsOn: string
  endsOn: string
  paymentDeadline: string
}

const EMPTY: FormState = {
  id: null,
  name: "",
  mode: "PERCENT",
  rate: "",
  fixedAmount: "",
  maxAmount: "",
  includeArrears: false,
  includePenalty: false,
  applyAfterRebate: false,
  trigger: "ON_ASSESSMENT",
  dueDate: "",
  graceDays: "0",
  startsOn: "",
  endsOn: "",
  paymentDeadline: "",
}

const fromPolicy = (p: Policy): FormState => ({
  id: p.id,
  name: p.name,
  mode: isFixed(p) ? "FIXED" : "PERCENT",
  rate: p.rate ?? "",
  fixedAmount: p.fixedAmount ?? "",
  maxAmount: p.maxAmount ?? "",
  includeArrears: p.includeArrears,
  includePenalty: Boolean(p.includePenalty),
  applyAfterRebate: Boolean(p.applyAfterRebate),
  trigger: p.trigger ?? "ON_ASSESSMENT",
  dueDate: p.dueDate ?? "",
  graceDays: String(p.graceDays ?? 0),
  startsOn: p.startsOn ?? "",
  endsOn: p.endsOn ?? "",
  paymentDeadline: p.paymentDeadline ?? "",
})

const RATE = /^\d{1,3}(\.\d{1,4})?$/
const MONEY = /^\d{1,12}(\.\d{1,2})?$/

function validate(form: FormState, isRebate: boolean) {
  const e: Partial<Record<keyof FormState, string>> = {}
  if (form.name.trim().length < 3) e.name = "Give the rule a name (at least 3 characters)."
  if (form.mode === "PERCENT") {
    if (!RATE.test(form.rate)) e.rate = "Enter a percentage such as 5 or 7.5."
    else if (Number(form.rate) <= 0 || Number(form.rate) > 100) e.rate = "Must be more than 0 and at most 100."
  } else if (!MONEY.test(form.fixedAmount) || Number(form.fixedAmount) <= 0) {
    e.fixedAmount = "Enter an amount in rupees greater than 0."
  }
  if (form.maxAmount && (!MONEY.test(form.maxAmount) || Number(form.maxAmount) <= 0)) e.maxAmount = "Enter an amount greater than 0, or leave blank."
  if (form.startsOn && form.endsOn && form.endsOn < form.startsOn) e.endsOn = "The end date is before the start date."
  if (!isRebate && form.trigger === "DUE_DATE_PASSED" && !form.dueDate) e.dueDate = "A due date is required for this option."
  return e
}

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function TaxPolicyPage({ params }: { params: Promise<{ kind: string; tax: string }> }) {
  const { kind: rawKind, tax: rawTax } = React.use(params)
  const validRoute = (rawKind === "rebates" || rawKind === "penalties") && rawTax in TAX
  const kind: Kind = rawKind === "penalties" ? "penalties" : "rebates"
  const tax = TAX[(rawTax in TAX ? rawTax : "property") as TaxSlug]
  const isRebate = kind === "rebates"
  const endpoint = isRebate ? "rebate-policies" : "penalty-policies"
  const noun = isRebate ? "rebate" : "penalty"
  const taxLower = tax.en.toLowerCase()

  const canConfigure = useCan("settings:update").allowed
  const qc = useQueryClient()
  const [yearId, setYearId] = React.useState("")
  const [form, setForm] = React.useState<FormState>(EMPTY)
  const [touched, setTouched] = React.useState(false)
  const [confirm, setConfirm] = React.useState<{ policy: Policy; action: "activate" | "archive" } | null>(null)
  const [selected, setSelected] = React.useState<string | null>(null)
  const [sample, setSample] = React.useState({
    current: tax.category === "WATER_TAX" ? "1500" : "2000",
    arrears: "0",
    otherTaxes: "0",
    paid: "0",
    asOf: new Date().toISOString().slice(0, 10),
  })

  const years = useQuery({
    queryKey: ["assessment-years-admin"],
    queryFn: () => api.get<YearRow[]>("/api/v1/assessment-years").then((r) => r.data ?? []),
  })
  const sortedYears = React.useMemo(() => [...(years.data ?? [])].sort((a, b) => b.code.localeCompare(a.code)), [years.data])
  const activeYear = yearId || sortedYears.find((y) => y.profile?.status === "ACTIVE")?.id || sortedYears[0]?.id || ""
  const year = sortedYears.find((y) => y.id === activeYear)
  const yearUsable = Boolean(year?.profile) && year?.profile?.status !== "CLOSED" && year?.profile?.status !== "ARCHIVED"

  const policies = useQuery({
    queryKey: [endpoint, activeYear],
    enabled: Boolean(activeYear),
    queryFn: () => api.get<Policy[]>(`/api/v1/${endpoint}?assessmentYearId=${activeYear}`).then((r) => r.data ?? []),
  })
  const rows = policies.data ?? []
  const own = rows.filter((p) => p.taxCategory === tax.category)
  const combinedActive = rows.filter((p) => p.taxCategory === "COMBINED" && p.status === "ACTIVE")
  const activeOwn = own.find((p) => p.status === "ACTIVE") ?? null
  const selectedPolicy = own.find((p) => p.id === selected) ?? null

  const errors = validate(form, isRebate)
  const formValid = Object.keys(errors).length === 0

  // Live server preview of the rule being edited. Debounce the (stable) form
  // and sample state, and judge validity on the same debounced values so the
  // request never runs ahead of what the user has finished typing.
  const f = useDebounced(form)
  const smp = useDebounced(sample)
  const previewValid = Object.keys(validate(f, isRebate)).length === 0
  const sampleValid = [smp.current, smp.arrears, smp.otherTaxes, smp.paid].every((v) => MONEY.test(v || "0")) && Boolean(smp.asOf)
  const previewBody = {
    kind: isRebate ? "rebate" : "penalty",
    taxCategory: tax.category,
    type: f.mode === "PERCENT" ? "PERCENTAGE" : "FIXED_AMOUNT",
    rate: f.mode === "PERCENT" ? f.rate : undefined,
    fixedAmount: f.mode === "FIXED" ? f.fixedAmount : undefined,
    maxAmount: f.maxAmount || undefined,
    includeArrears: f.includeArrears,
    includePenalty: isRebate ? f.includePenalty : undefined,
    applyAfterRebate: isRebate ? undefined : f.applyAfterRebate,
    trigger: isRebate ? undefined : f.trigger,
    dueDate: !isRebate && f.dueDate ? f.dueDate : undefined,
    graceDays: isRebate ? undefined : Number(f.graceDays || 0),
    sample: {
      propertyTax: tax.category === "PROPERTY_TAX" ? smp.current : smp.otherTaxes,
      waterTax: tax.category === "WATER_TAX" ? smp.current : tax.category === "PROPERTY_TAX" ? smp.otherTaxes : "0",
      drainageTax: tax.category === "DRAINAGE_TAX" ? smp.current : "0",
      previousPropertyTax: tax.category === "PROPERTY_TAX" ? smp.arrears : "0",
      previousWaterTax: tax.category === "WATER_TAX" ? smp.arrears : "0",
      previousDrainageTax: tax.category === "DRAINAGE_TAX" ? smp.arrears : "0",
      alreadyPaid: smp.paid,
      asOf: smp.asOf,
    },
  }
  const preview = useQuery({
    queryKey: ["charge-preview", previewBody],
    enabled: previewValid && sampleValid,
    queryFn: () => api.post<ChargePreview>("/api/v1/tax-admin/preview", previewBody).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: [endpoint] })
    void qc.invalidateQueries({ queryKey: ["demand-outstanding"] })
    void qc.invalidateQueries({ queryKey: ["audit"] })
    void qc.invalidateQueries({ queryKey: ["assessment-years-admin"] })
  }

  const save = useMutation({
    mutationFn: () => {
      const flags = {
        includePropertyTax: tax.category === "PROPERTY_TAX",
        includeWaterTax: tax.category === "WATER_TAX",
        includeDrainageTax: tax.category === "DRAINAGE_TAX",
        includeArrears: form.includeArrears,
      }
      const common = {
        name: form.name.trim(),
        assessmentYearId: activeYear,
        taxCategory: tax.category,
        rate: form.mode === "PERCENT" ? form.rate : undefined,
        fixedAmount: form.mode === "FIXED" ? form.fixedAmount : undefined,
        maxAmount: form.maxAmount || undefined,
        startsOn: form.startsOn || undefined,
        endsOn: form.endsOn || undefined,
        ...flags,
      }
      const body = isRebate
        ? {
            ...common,
            rebateType: form.mode === "PERCENT" ? "PERCENTAGE" : "FIXED_AMOUNT",
            includePenalty: form.includePenalty,
            includeInterest: false,
            paymentDeadline: form.paymentDeadline || undefined,
          }
        : {
            ...common,
            penaltyType: form.mode === "PERCENT" ? "PERCENT_OF_ELIGIBLE_BASE" : "FIXED_AMOUNT",
            trigger: form.trigger,
            dueDate: form.dueDate || undefined,
            graceDays: Number(form.graceDays || 0),
            applyAfterRebate: form.applyAfterRebate,
          }
      return form.id ? api.patch(`/api/v1/${endpoint}/${form.id}`, body) : api.post(`/api/v1/${endpoint}`, body)
    },
    onSuccess: () => {
      toast.success(form.id ? "Draft updated." : "Draft saved. It has no effect until it is approved and activated.")
      setForm(EMPTY)
      setTouched(false)
      refresh()
    },
    onError: (error) => toast.error(formatApiError(error, "Could not save the rule")),
  })

  const act = useMutation({
    mutationFn: ({ policy, action, reason }: { policy: Policy; action: "activate" | "archive"; reason: string }) =>
      api.post(`/api/v1/${endpoint}/${policy.id}/${action}`, { reason: reason || undefined }),
    onSuccess: (_res, vars) => {
      toast.success(
        vars.action === "activate"
          ? `${tax.en} ${noun} approved and active. Demands already published keep their original figures.`
          : `${tax.en} ${noun} archived. Demands already published keep their original figures.`
      )
      setConfirm(null)
      refresh()
    },
    onError: (error) => {
      setConfirm(null)
      toast.error(formatApiError(error, "Could not update the rule"))
    },
  })

  if (!validRoute) notFound()

  const tabs = (["property", "water"] as TaxSlug[]).flatMap((slug) => [
    { href: `/tax-admin/rebates/${slug}`, label: `${TAX[slug].en} rebates` },
    { href: `/tax-admin/penalties/${slug}`, label: `${TAX[slug].en} penalties` },
  ])
  const err = (key: keyof FormState) => (touched ? errors[key] ?? null : null)
  const formula = isRebate
    ? `${tax.en} rebate = eligible unpaid ${taxLower} × rate ÷ 100 (or a fixed amount), never more than the eligible amount or the maximum.`
    : `${tax.en} penalty = eligible overdue ${taxLower} × rate ÷ 100 (or a fixed amount), up to the maximum. Charged once per demand.`

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${tax.en} ${isRebate ? "Rebates" : "Penalties"} / ${tax.hi} ${isRebate ? "छूट" : "शास्ति"}`}
        description={
          <>
            {isRebate
              ? `Rules that reduce ${taxLower} only. They never reduce any other tax.`
              : `Rules that add a penalty on overdue ${taxLower} only.`}{" "}
            A rule is applied once, when a demand is calculated and published; published demands, receipts and notices never change.
            Enter only rates approved by the municipality.
          </>
        }
      />

      <nav aria-label="Rebate and penalty pages" className="-mb-px flex flex-wrap gap-1 relative overflow-x-auto border-b">
        {tabs.map((t) => {
          const active = t.href === `/tax-admin/${kind}/${rawTax}`
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap",
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-wrap items-end gap-4">
        <Field id="pol-year" label="Assessment year">
          {(p) => (
            <select {...p} className={`${selectClass} w-52`} value={activeYear} onChange={(e) => setYearId(e.target.value)}>
              {sortedYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}{y.profile ? ` (${y.profile.status.toLowerCase()})` : " (dates not set)"}</option>
              ))}
            </select>
          )}
        </Field>
        <p className="pb-2 text-sm text-muted-foreground">
          {activeOwn ? (
            <>Active: <strong className="text-foreground">{activeOwn.name}</strong> — {amountLabel(activeOwn)}, {scopeLabel(activeOwn)}</>
          ) : (
            `No active ${taxLower} ${noun} rule for this year.`
          )}
        </p>
      </div>

      {year && !yearUsable ? (
        <Notice tone="warning">
          {year.profile
            ? `${year.name} is ${year.profile.status.toLowerCase()}. Its rules cannot be changed.`
            : <>Set {year.name}&apos;s dates on the <Link className="underline" href="/tax-admin/assessment-years">Assessment Years</Link> page before adding rules.</>}
        </Notice>
      ) : null}
      {combinedActive.length > 0 ? (
        <Notice tone="warning">
          A combined {noun} rule is active for this year ({combinedActive.map((p) => `${p.name}: ${amountLabel(p)}, ${scopeLabel(p)}`).join("; ")}).
          Activating a {taxLower} rule archives it so no tax is counted twice. If it also covered other taxes, set up their own rules too.
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_28rem] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title={`${tax.en} ${noun} rules`} description="Click a rule to see its history.">
            {policies.isLoading || years.isLoading ? (
              <LoadingBlock />
            ) : policies.isError ? (
              <ErrorBlock error={policies.error} onRetry={() => void policies.refetch()} />
            ) : own.length === 0 ? (
              <EmptyBlock title={`No ${taxLower} ${noun} rules for this year`}>
                {isRebate
                  ? `No rebate is applied to ${taxLower}.`
                  : tax.category === "PROPERTY_TAX"
                    ? "Without a rule, the rate-table penalty percent (Tax Rates page) still applies to property tax."
                    : `No penalty is charged on ${taxLower}.`}
              </EmptyBlock>
            ) : (
              <div className="-mx-4 relative overflow-x-auto sm:mx-0">
                <table className="w-full min-w-[42rem] text-sm">
                  <thead className="border-b bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <tr>
                      <th scope="col" className="px-3 py-2">Rule</th>
                      <th scope="col" className="px-3 py-2">Amount</th>
                      <th scope="col" className="px-3 py-2">Applies to</th>
                      <th scope="col" className="px-3 py-2">Period</th>
                      <th scope="col" className="px-3 py-2">Status</th>
                      <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {own.map((p) => (
                      <tr key={p.id} className={cn("align-top", selected === p.id ? "bg-primary/5" : "hover:bg-muted/40")}>
                        <th scope="row" className="px-3 py-2.5 text-left font-medium">
                          <button type="button" className="cursor-pointer text-left hover:underline" onClick={() => setSelected(p.id)}>{p.name}</button>
                        </th>
                        <td className="px-3 py-2.5 tabular-nums">
                          {amountLabel(p)}
                          {p.maxAmount ? <span className="block text-xs text-muted-foreground">max {formatInr(p.maxAmount)}</span> : null}
                        </td>
                        <td className="px-3 py-2.5">
                          {scopeLabel(p)}
                          {p.trigger === "DUE_DATE_PASSED" ? (
                            <span className="block text-xs text-muted-foreground">after {p.dueDate} + {p.graceDays ?? 0} day(s) grace</span>
                          ) : null}
                          {p.applyAfterRebate ? <span className="block text-xs text-muted-foreground">on the balance after rebate</span> : null}
                          {p.includePenalty ? <span className="block text-xs text-muted-foreground">also reduces the {taxLower} penalty</span> : null}
                        </td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                          {p.startsOn ?? "—"} → {p.endsOn ?? "—"}
                          {p.paymentDeadline ? <span className="block">pay by {p.paymentDeadline}</span> : null}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={p.status} />
                          {p.approvedAt ? <span className="mt-1 block text-xs text-muted-foreground">approved {new Date(p.approvedAt).toLocaleDateString("en-IN")}</span> : null}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          {canConfigure && yearUsable && p.status === "DRAFT" ? (
                            <div className="flex justify-end gap-1.5">
                              <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => { setForm(fromPolicy(p)); setTouched(true) }}>
                                <Pencil aria-hidden className="size-3.5" /> Edit
                              </Button>
                              <Button size="sm" className="cursor-pointer" onClick={() => setConfirm({ policy: p, action: "activate" })}>
                                Approve…
                              </Button>
                            </div>
                          ) : null}
                          {canConfigure && p.status === "ACTIVE" ? (
                            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setConfirm({ policy: p, action: "archive" })}>
                              Archive…
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="How it is calculated">
            <p className="text-sm">{formula}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Previous-year {taxLower} is included only when a rule explicitly allows it.
              {tax.category === "PROPERTY_TAX" ? " Water tax is never included." : " Property tax is never included."} Amounts are rounded half-up to the nearest paisa.
            </p>
          </Panel>

          <Panel title="History" description={selectedPolicy ? selectedPolicy.name : "Select a rule in the table."}>
            <AuditHistory entity={isRebate ? "RebatePolicy" : "PenaltyPolicy"} entityId={selectedPolicy?.id ?? null} />
          </Panel>
        </div>

        <div className="space-y-6">
          {canConfigure ? (
            <Panel
              title={form.id ? "Edit draft rule" : "New draft rule"}
              description="Saved as a draft. It has no effect until approved."
              actions={form.id ? (
                <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => { setForm(EMPTY); setTouched(false) }}>
                  <FilePlus2 aria-hidden className="size-3.5" /> New instead
                </Button>
              ) : null}
            >
              <form
                className="space-y-4 text-sm"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault()
                  setTouched(true)
                  if (formValid && yearUsable && !save.isPending) save.mutate()
                }}
              >
                <Field id="f-name" label="Rule name" hint="As in the approved order, e.g. Early payment rebate 2026-27." error={err("name")} required>
                  {(p) => <Input {...p} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
                </Field>
                <fieldset className="space-y-1.5">
                  <legend className="text-sm font-medium">Calculation</legend>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2"><input type="radio" name="mode" checked={form.mode === "PERCENT"} onChange={() => setForm({ ...form, mode: "PERCENT" })} /> Percentage</label>
                    <label className="flex items-center gap-2"><input type="radio" name="mode" checked={form.mode === "FIXED"} onChange={() => setForm({ ...form, mode: "FIXED" })} /> Fixed amount</label>
                  </div>
                </fieldset>
                {form.mode === "PERCENT" ? (
                  <Field id="f-rate" label={`Rate (% of eligible ${taxLower})`} error={err("rate")} required>
                    {(p) => <Input {...p} inputMode="decimal" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value.trim() })} />}
                  </Field>
                ) : (
                  <Field id="f-fixed" label="Fixed amount (₹)" error={err("fixedAmount")} required>
                    {(p) => <Input {...p} inputMode="decimal" value={form.fixedAmount} onChange={(e) => setForm({ ...form, fixedAmount: e.target.value.trim() })} />}
                  </Field>
                )}
                <Field id="f-max" label="Maximum per property (₹)" hint="Optional. Only if the policy sets a limit." error={err("maxAmount")}>
                  {(p) => <Input {...p} inputMode="decimal" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value.trim() })} />}
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="f-start" label="Effective from">
                    {(p) => <Input {...p} type="date" value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} />}
                  </Field>
                  <Field id="f-end" label="Effective until" error={err("endsOn")}>
                    {(p) => <Input {...p} type="date" value={form.endsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })} />}
                  </Field>
                </div>
                {isRebate ? (
                  <Field id="f-deadline" label="Payment deadline" hint="Optional. The rebate stops applying after this date.">
                    {(p) => <Input {...p} type="date" value={form.paymentDeadline} onChange={(e) => setForm({ ...form, paymentDeadline: e.target.value })} />}
                  </Field>
                ) : (
                  <>
                    <Field id="f-trigger" label="When is it charged?">
                      {(p) => (
                        <select {...p} className={selectClass} value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value as FormState["trigger"] })}>
                          <option value="ON_ASSESSMENT">When the demand is calculated</option>
                          <option value="DUE_DATE_PASSED">Only after a due date</option>
                        </select>
                      )}
                    </Field>
                    {form.trigger === "DUE_DATE_PASSED" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Field id="f-due" label="Due date" error={err("dueDate")} required>
                          {(p) => <Input {...p} type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />}
                        </Field>
                        <Field id="f-grace" label="Grace days">
                          {(p) => <Input {...p} inputMode="numeric" value={form.graceDays} onChange={(e) => setForm({ ...form, graceDays: e.target.value.replace(/\D/g, "").slice(0, 3) })} />}
                        </Field>
                      </div>
                    ) : null}
                    <label className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" checked={form.applyAfterRebate} onChange={(e) => setForm({ ...form, applyAfterRebate: e.target.checked })} />
                      Charge on the {taxLower} balance after its rebate
                    </label>
                  </>
                )}
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={form.includeArrears} onChange={(e) => setForm({ ...form, includeArrears: e.target.checked })} />
                  <span>
                    Also apply to unpaid {taxLower} of previous years
                    <span className="block text-xs text-muted-foreground">Tick only if the approved policy explicitly allows it.</span>
                  </span>
                </label>
                {isRebate ? (
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" checked={form.includePenalty} onChange={(e) => setForm({ ...form, includePenalty: e.target.checked })} />
                    Also reduce the {taxLower} penalty
                  </label>
                ) : null}
                <Button type="submit" className="w-full cursor-pointer" disabled={!activeYear || !yearUsable || save.isPending}>
                  {save.isPending ? "Saving…" : form.id ? "Save draft changes" : "Save as draft"}
                </Button>
              </form>
            </Panel>
          ) : null}

          <Panel title="Preview" description="Try the rule on sample amounts before saving.">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field id="s-current" label={`Current ${taxLower} (₹)`}>
                {(p) => <Input {...p} inputMode="decimal" value={sample.current} onChange={(e) => setSample({ ...sample, current: e.target.value.trim() })} />}
              </Field>
              <Field id="s-arrears" label={`Unpaid previous ${taxLower} (₹)`}>
                {(p) => <Input {...p} inputMode="decimal" value={sample.arrears} onChange={(e) => setSample({ ...sample, arrears: e.target.value.trim() })} />}
              </Field>
              <Field id="s-other" label={tax.category === "PROPERTY_TAX" ? "Water tax (₹)" : "Property tax (₹)"} hint="Shown to prove it is not affected.">
                {(p) => <Input {...p} inputMode="decimal" value={sample.otherTaxes} onChange={(e) => setSample({ ...sample, otherTaxes: e.target.value.trim() })} />}
              </Field>
              <Field id="s-paid" label="Already paid (₹)">
                {(p) => <Input {...p} inputMode="decimal" value={sample.paid} onChange={(e) => setSample({ ...sample, paid: e.target.value.trim() })} />}
              </Field>
              <Field id="s-asof" label="Calculate as on">
                {(p) => <Input {...p} type="date" value={sample.asOf} onChange={(e) => setSample({ ...sample, asOf: e.target.value })} />}
              </Field>
            </div>
            <div className="mt-4">
              {!formValid ? (
                <p className="text-sm text-muted-foreground">Fill in the rule to see a preview.</p>
              ) : !sampleValid ? (
                <p className="text-sm text-destructive">Sample amounts must be rupees with up to 2 decimals.</p>
              ) : (
                <>
                  {preview.data ? (
                    <p className={cn("mb-3 flex items-start gap-2 text-sm", preview.data.applies ? "text-success" : "text-muted-foreground")}>
                      {preview.data.applies ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" /> : null}
                      {preview.data.reason}
                    </p>
                  ) : null}
                  <CalcSteps steps={preview.data?.steps ?? null} loading={preview.isFetching} error={preview.error} footnote={preview.data?.eligibleExplanation} />
                  {preview.data ? (
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-muted/50 p-3 text-sm">
                      <dt className="text-muted-foreground">{isRebate ? "Rebate" : "Penalty"}</dt>
                      <dd className="text-right font-semibold tabular-nums">{formatInr(preview.data.ruleAmount)}</dd>
                      <dt className="text-muted-foreground">Payable before payments</dt>
                      <dd className="text-right tabular-nums">{formatInr(preview.data.totals.payableBeforePayment)}</dd>
                      <dt className="text-muted-foreground">Outstanding after payments</dt>
                      <dd className="text-right font-semibold tabular-nums">{formatInr(preview.data.totals.outstanding)}</dd>
                    </dl>
                  ) : null}
                </>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`${confirm?.action === "activate" ? "Approve and activate" : "Archive"} “${confirm?.policy.name ?? ""}”?`}
        description={
          confirm?.action === "activate" ? (
            <span>
              {amountLabel(confirm.policy)} — {scopeLabel(confirm.policy)}. From now on it applies to {taxLower} in newly calculated demands for {year?.name}.
              {activeOwn ? ` The active rule “${activeOwn.name}” will be archived.` : ""}
              {combinedActive.length ? " The active combined rule will be archived." : ""} Your name, the time and the reason are recorded.
            </span>
          ) : (
            <span>It stops applying to newly calculated demands. Demands already published keep their figures.</span>
          )
        }
        confirmLabel={confirm?.action === "activate" ? "Approve & activate" : "Archive rule"}
        destructive={confirm?.action === "archive"}
        requireReason
        reasonLabel="Approval reference or reason"
        pending={act.isPending}
        onConfirm={(reason) => confirm && act.mutate({ ...confirm, reason })}
      />
    </div>
  )
}
