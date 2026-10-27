"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarPlus, Lock, Pencil, Search } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import {
  AdminPageHeader,
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  Notice,
  Panel,
  StatusBadge,
  selectClass,
} from "@/components/admin/admin-ui"
import { AuditHistory } from "@/components/admin/audit-history"
import { useCan } from "@/hooks/use-permission"
import { api } from "@/lib/api"
import { formatApiError } from "@/lib/format-api-error"

type YearStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
type Year = {
  id: string
  code: string
  name: string
  profile: {
    id: string
    startsOn: string
    endsOn: string
    status: YearStatus
    createdAt?: string
    updatedAt?: string
  } | null
  usage?: {
    publishedDemands: number
    successfulPayments: number
    taxConfigsPublished: number
    taxConfigsDraft: number
    activeRebateRules: string[]
    activePenaltyRules: string[]
    locked: boolean
  }
  lastChange?: { action: string; at: string; by: string | null } | null
}

const TAX_SHORT: Record<string, string> = {
  PROPERTY_TAX: "Property",
  WATER_TAX: "Water",
  DRAINAGE_TAX: "Drainage",
  COMBINED: "Combined",
}

function fmtDate(day?: string | null) {
  if (!day) return "—"
  const [y, m, d] = day.split("-").map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

type FormState = { mode: "create" | "edit"; year?: Year; label: string; startsOn: string; endsOn: string; status: YearStatus }

export default function AssessmentYearsPage() {
  const canEdit = useCan("settings:update").allowed
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [form, setForm] = React.useState<FormState | null>(null)
  const [confirm, setConfirm] = React.useState(false)
  const [selected, setSelected] = React.useState<string | null>(null)

  const years = useQuery({
    queryKey: ["assessment-years-admin"],
    queryFn: () => api.get<Year[]>("/api/v1/assessment-years").then((r) => r.data ?? []),
  })

  const rows = (years.data ?? [])
    .filter((y) => !search.trim() || y.name.includes(search.trim()) || y.code.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((y) => !statusFilter || (y.profile?.status ?? "NOT_CONFIGURED") === statusFilter)
    .sort((a, b) => b.code.localeCompare(a.code))

  const errors = React.useMemo(() => {
    if (!form) return {}
    const e: Record<string, string> = {}
    if (form.mode === "create") {
      const m = /^(\d{4})-(\d{4})$/.exec(form.label.trim())
      if (!m) e.label = "Use the form 2027-2028."
      else if (Number(m[2]) !== Number(m[1]) + 1) e.label = "The second year must follow the first."
      else if ((years.data ?? []).some((y) => y.name === form.label.trim())) e.label = "This assessment year already exists."
    }
    if (!form.startsOn) e.startsOn = "Choose the first day of the year."
    if (!form.endsOn) e.endsOn = "Choose the last day of the year."
    if (form.startsOn && form.endsOn && form.endsOn < form.startsOn) e.endsOn = "The end date is before the start date."
    return e
  }, [form, years.data])
  const formValid = form !== null && Object.keys(errors).length === 0

  const save = useMutation({
    mutationFn: async (reason: string) => {
      if (!form) return
      if (form.mode === "create") {
        return api.post("/api/v1/assessment-years/new", {
          label: form.label.trim(),
          startsOn: form.startsOn,
          endsOn: form.endsOn,
          status: form.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
        })
      }
      const year = form.year!
      if (!year.profile) {
        return api.post("/api/v1/assessment-years", {
          referenceEntryId: year.id,
          startsOn: form.startsOn,
          endsOn: form.endsOn,
          status: form.status,
          reason,
        })
      }
      return api.patch(`/api/v1/assessment-years/${year.id}`, {
        startsOn: form.startsOn,
        endsOn: form.endsOn,
        status: form.status,
        reason,
      })
    },
    onSuccess: () => {
      toast.success(form?.mode === "create" ? "Assessment year created" : "Assessment year saved")
      setConfirm(false)
      setForm(null)
      void qc.invalidateQueries({ queryKey: ["assessment-years-admin"] })
      void qc.invalidateQueries({ queryKey: ["assessment-year-profiles"] })
      void qc.invalidateQueries({ queryKey: ["assessment-years"] })
      void qc.invalidateQueries({ queryKey: ["audit"] })
    },
    onError: (error) => {
      setConfirm(false)
      toast.error(formatApiError(error, "Could not save the assessment year"))
    },
  })

  const openEdit = (year: Year) =>
    setForm({
      mode: "edit",
      year,
      label: year.name,
      startsOn: year.profile?.startsOn ?? "",
      endsOn: year.profile?.endsOn ?? "",
      // A year that already has demands or payments starts as Active.
      status: year.profile?.status ?? (year.usage?.locked ? "ACTIVE" : "DRAFT"),
    })

  // Dates lock once they are set and financial records exist; a year with
  // records but no dates yet must still be able to get its dates.
  const locked = form?.mode === "edit" && Boolean(form.year?.profile) && Boolean(form.year?.usage?.locked)
  const draftBlocked = form?.mode === "edit" && Boolean(form.year?.usage?.locked)
  const selectedYear = (years.data ?? []).find((y) => y.id === selected) ?? null

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Assessment Years / निर्धारण वर्ष"
        description="Each financial year that demands, rates, rebates and penalties belong to. A year needs start and end dates before rules can be added to it. Years with demands or payments are never deleted: close or archive them instead."
        actions={
          canEdit ? (
            <Button
              className="cursor-pointer"
              onClick={() => setForm({ mode: "create", label: "", startsOn: "", endsOn: "", status: "DRAFT" })}
            >
              <CalendarPlus aria-hidden className="size-4" /> New assessment year
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_26rem] [&>*]:min-w-0">
        <Panel
          title="All assessment years"
          description="Newest first. Click a year to see its history."
          actions={
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                <Input
                  aria-label="Search assessment years"
                  placeholder="Search e.g. 2026"
                  className="w-40 pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select aria-label="Filter by status" className={`${selectClass} w-40`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="CLOSED">Closed</option>
                <option value="ARCHIVED">Archived</option>
                <option value="NOT_CONFIGURED">Dates not set</option>
              </select>
            </div>
          }
        >
          {years.isLoading ? (
            <LoadingBlock />
          ) : years.isError ? (
            <ErrorBlock error={years.error} onRetry={() => void years.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyBlock title="No assessment years match">Clear the search or filter.</EmptyBlock>
          ) : (
            <div className="-mx-4 relative overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="border-b bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th scope="col" className="px-3 py-2">Year</th>
                    <th scope="col" className="px-3 py-2">Period</th>
                    <th scope="col" className="px-3 py-2">Status</th>
                    <th scope="col" className="px-3 py-2">Tax rates</th>
                    <th scope="col" className="px-3 py-2">Active rules</th>
                    <th scope="col" className="px-3 py-2">Records</th>
                    <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((y) => (
                    <tr
                      key={y.id}
                      className={`align-top hover:bg-muted/40 ${selected === y.id ? "bg-primary/5" : ""}`}
                    >
                      <th scope="row" className="px-3 py-2.5 text-left">
                        <button type="button" className="cursor-pointer font-semibold hover:underline" onClick={() => setSelected(y.id)}>
                          {y.name}
                        </button>
                        <span className="block text-xs font-normal text-muted-foreground">{y.code}</span>
                      </th>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {y.profile ? `${fmtDate(y.profile.startsOn)} – ${fmtDate(y.profile.endsOn)}` : "—"}
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={y.profile?.status ?? "NOT_CONFIGURED"} /></td>
                      <td className="px-3 py-2.5 text-xs">
                        {y.usage ? (
                          <>
                            {y.usage.taxConfigsPublished} ward(s) published
                            {y.usage.taxConfigsDraft ? <span className="block text-muted-foreground">{y.usage.taxConfigsDraft} draft</span> : null}
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {y.usage && (y.usage.activeRebateRules.length || y.usage.activePenaltyRules.length) ? (
                          <span className="flex flex-wrap gap-1">
                            {y.usage.activeRebateRules.map((c) => <Badge key={`r${c}`} variant="secondary">{TAX_SHORT[c]} rebate</Badge>)}
                            {y.usage.activePenaltyRules.map((c) => <Badge key={`p${c}`} variant="outline">{TAX_SHORT[c]} penalty</Badge>)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        {y.usage ? `${y.usage.publishedDemands} demands · ${y.usage.successfulPayments} payments` : "—"}
                        {y.usage?.locked ? (
                          <span className="mt-0.5 flex items-center gap-1 text-muted-foreground"><Lock aria-hidden className="size-3" /> dates locked</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {canEdit ? (
                          <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => openEdit(y)}>
                            <Pencil aria-hidden className="size-3.5" /> {y.profile ? "Edit" : "Set dates"}
                            <span className="sr-only"> {y.name}</span>
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

        <div className="space-y-6">
          {form ? (
            <Panel
              title={form.mode === "create" ? "New assessment year" : `Edit ${form.year?.name}`}
              description={form.mode === "create" ? "Creates the year and its dates together." : "Changes are recorded in the audit trail."}
            >
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (formValid) setConfirm(true)
                }}
                noValidate
              >
                {form.mode === "create" ? (
                  <Field id="ay-label" label="Year" hint="As printed on notices, e.g. 2027-2028." error={form.label ? errors.label : null} required>
                    {(p) => <Input {...p} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="2027-2028" />}
                  </Field>
                ) : null}
                {draftBlocked && !locked ? (
                  <Notice tone="info">
                    This year already has {form.year?.usage?.publishedDemands} published demand(s). Set the dates approved for it; once saved they are locked.
                  </Notice>
                ) : null}
                {locked ? (
                  <Notice tone="warning">
                    This year has {form.year?.usage?.publishedDemands} published demand(s) and {form.year?.usage?.successfulPayments} payment(s).
                    Its dates cannot change and it cannot go back to draft. You can still close or archive it.
                  </Notice>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="ay-start" label="Starts on" error={errors.startsOn && form.startsOn !== "" ? errors.startsOn : null} required>
                    {(p) => <Input {...p} type="date" disabled={locked} value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} />}
                  </Field>
                  <Field id="ay-end" label="Ends on" error={form.endsOn ? errors.endsOn : null} required>
                    {(p) => <Input {...p} type="date" disabled={locked} value={form.endsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })} />}
                  </Field>
                </div>
                <Field
                  id="ay-status"
                  label="Status"
                  hint="Draft: being set up. Active: in use. Closed: no new demands or rule changes. Archived: kept for history only."
                >
                  {(p) => (
                    <select {...p} className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as YearStatus })}>
                      {(form.mode === "create" ? ["DRAFT", "ACTIVE"] : ["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]).map((s) => (
                        <option key={s} value={s} disabled={draftBlocked && s === "DRAFT"}>
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <p className="text-xs text-muted-foreground">
                  Dates are not assumed: enter the period approved by the municipality. Years may not overlap.
                </p>
                <div className="flex gap-2">
                  <Button type="submit" className="cursor-pointer" disabled={!formValid || save.isPending}>
                    {form.mode === "create" ? "Create year…" : "Save changes…"}
                  </Button>
                  <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setForm(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Panel>
          ) : null}

          <Panel title="Next steps" description="Set up a year in this order.">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">
              <li>Create the year and set its dates (this page).</li>
              <li>
                Publish ward rates on <Link className="underline" href="/tax-admin/tax-rates">Tax Rates</Link>.
              </li>
              <li>
                Add approved <Link className="underline" href="/tax-admin/rebates/property">rebates</Link> and{" "}
                <Link className="underline" href="/tax-admin/penalties/property">penalties</Link>, if any.
              </li>
              <li>Mark the year Active, then publish demands from the Demand Ledger.</li>
            </ol>
          </Panel>

          <Panel title="History" description={selectedYear ? selectedYear.name : "Select a year in the table."}>
            <AuditHistory entity="AssessmentYearProfile" entityId={selectedYear?.profile?.id ?? null} />
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={form?.mode === "create" ? `Create assessment year ${form.label}?` : `Save changes to ${form?.year?.name}?`}
        description={
          form ? (
            <span>
              {fmtDate(form.startsOn)} – {fmtDate(form.endsOn)}, status {form.status.toLowerCase()}.{" "}
              {form.status === "CLOSED" || form.status === "ARCHIVED"
                ? "No new demands or rule changes will be accepted for this year. Existing records are kept."
                : "Your name and the time are recorded."}
            </span>
          ) : null
        }
        confirmLabel={form?.mode === "create" ? "Create year" : "Save"}
        requireReason={form?.mode === "edit" && (form.status === "CLOSED" || form.status === "ARCHIVED")}
        pending={save.isPending}
        onConfirm={(reason) => save.mutate(reason)}
      />
    </div>
  )
}
