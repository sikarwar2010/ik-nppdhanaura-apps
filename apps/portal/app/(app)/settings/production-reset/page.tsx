"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Download, ShieldCheck } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

import { ErrorBlock, Field, formatInr, LoadingBlock, Notice, Panel } from "@/components/admin/admin-ui"
import { usePermission } from "@/hooks/use-permission"
import { api } from "@/lib/api"
import { downloadAuthenticatedExport } from "@/lib/download-blob"
import { formatApiError } from "@/lib/format-api-error"

type PaymentRow = {
  id: string
  receiptNumber: string | null
  amount: string
  status: string
  paymentMode: string
  gateway: string | null
  date: string
  propertyId: string | null
  ownerName: string | null
  reasons: string[]
  gatewayConfirmed: boolean
}

type Counts = {
  onlineTransactions: number
  offlineTransactions: number
  paymentAllocations: number
  receipts: number
  ledgerEntries: number
  gatewayCallbacks: number
  gatewayTransactions: number
  refunds: number
  reconciliationRecords: number
  consumersAffected: number
  amount: string
  totalRecords: number
}

type Preview = {
  enabled: boolean
  secondApprovalRequired: boolean
  confirmationPhrase: string
  autoIncluded: PaymentRow[]
  needsReview: PaymentRow[]
  selected: Counts & { paymentIds: string[] }
  preserved: Record<string, number>
}

type Run = {
  id: string
  status: string
  counts: Counts
  backupSha256: string | null
  backupBytes: number | null
  report: { checks: Record<string, boolean>; deleted: Record<string, number>; note: string } | null
}

const COUNT_LABELS: Array<[keyof Counts, string]> = [
  ["onlineTransactions", "Online transactions"],
  ["offlineTransactions", "Offline transactions"],
  ["paymentAllocations", "Payment allocations"],
  ["receipts", "Receipts"],
  ["ledgerEntries", "Ledger entries"],
  ["reconciliationRecords", "Reconciliation records"],
  ["gatewayCallbacks", "Gateway callbacks"],
  ["consumersAffected", "Consumers affected"],
  ["totalRecords", "Total records"],
]

const PRESERVED_LABELS: Record<string, string> = {
  surveys: "Property records",
  wards: "Wards",
  demands: "Published demands",
  assessmentYears: "Assessment years",
  taxConfigs: "Tax rates",
  rebatePolicies: "Rebate rules",
  penaltyPolicies: "Penalty rules",
  users: "Users",
  roles: "Roles",
  auditLogs: "Audit records",
}

const CHECK_LABELS: Record<string, string> = {
  selectedPaymentsCleared: "Selected payments cleared",
  noOrphanAllocations: "No orphan allocations",
  noDuplicateAllocations: "No duplicate ledger entries",
  masterDataPreserved: "Master data unchanged",
  auditTrailRetained: "Audit trail retained",
}

function PaymentTable({
  rows,
  caption,
  selectable,
  approved,
  onToggle,
}: {
  rows: PaymentRow[]
  caption: string
  selectable?: boolean
  approved?: Set<string>
  onToggle?: (id: string) => void
}) {
  return (
    <div className="relative max-h-96 overflow-auto rounded-lg border">
      <table className="w-full min-w-[820px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
          <tr>
            {selectable ? <th scope="col" className="p-2 text-left font-medium">Clear?</th> : null}
            {["Date", "Property", "Amount", "Mode", "Receipt", "Why"].map((label) => (
              <th key={label} scope="col" className="p-2 text-left font-medium">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t align-top">
              {selectable ? (
                <td className="p-2">
                  <input
                    type="checkbox"
                    className="size-4 cursor-pointer"
                    aria-label={`Clear payment ${row.receiptNumber ?? row.id}`}
                    checked={approved?.has(row.id) ?? false}
                    onChange={() => onToggle?.(row.id)}
                  />
                </td>
              ) : null}
              <td className="p-2 whitespace-nowrap">{new Date(row.date).toLocaleDateString("en-IN")}</td>
              <td className="p-2">
                <span className="font-mono text-xs">{row.propertyId ?? "—"}</span>
                <span className="block">{row.ownerName ?? "—"}</span>
              </td>
              <td className="p-2 tabular-nums">{formatInr(row.amount)}</td>
              <td className="p-2">{row.paymentMode}{row.gateway ? ` · ${row.gateway}` : ""}</td>
              <td className="p-2 font-mono text-xs break-all">{row.receiptNumber ?? "—"}</td>
              <td className={row.gatewayConfirmed ? "p-2 font-medium text-destructive" : "p-2 text-muted-foreground"}>
                {row.reasons.join(" ")}
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr><td colSpan={selectable ? 7 : 6} className="p-3 text-muted-foreground">None.</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

export default function ProductionResetPage() {
  const { user } = usePermission()
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") ?? false
  const queryClient = useQueryClient()
  const [approved, setApproved] = React.useState<Set<string>>(new Set())
  const [run, setRun] = React.useState<Run | null>(null)
  const [phrase, setPhrase] = React.useState("")
  const [reason, setReason] = React.useState("")

  const approvedIds = [...approved].sort()
  const preview = useQuery({
    queryKey: ["production-reset-preview", approvedIds],
    enabled: isSuperAdmin,
    queryFn: () =>
      api.post<Preview>("/api/v1/production-reset/preview", { approvedPaymentIds: approvedIds }).then((res) => res.data),
  })

  const onError = (fallback: string) => (error: unknown) => toast.error(formatApiError(error, fallback))
  const prepare = useMutation({
    mutationFn: () => api.post<Run>("/api/v1/production-reset/runs", { approvedPaymentIds: approvedIds }),
    onSuccess: (res) => setRun(res.data),
    onError: onError("The reset could not be prepared"),
  })
  const backup = useMutation({
    mutationFn: () => api.post<Run>(`/api/v1/production-reset/runs/${run?.id}/backup`, {}),
    onSuccess: (res) => {
      setRun(res.data)
      toast.success("Backup written, read back and verified")
    },
    onError: onError("The backup failed. Nothing was changed."),
  })
  const requestApproval = useMutation({
    mutationFn: () => api.post<Run>(`/api/v1/production-reset/runs/${run?.id}/request-approval`, { reason }),
    onSuccess: (res) => setRun(res.data),
    onError: onError("Approval could not be requested"),
  })
  const execute = useMutation({
    mutationFn: () =>
      api.post<Run>(`/api/v1/production-reset/runs/${run?.id}/execute`, { confirmationPhrase: phrase, reason }),
    onSuccess: (res) => {
      setRun(res.data)
      setPhrase("")
      setApproved(new Set())
      toast.success("Test transactions cleared")
      void queryClient.invalidateQueries({ queryKey: ["production-reset-preview"] })
    },
    onError: onError("Nothing was cleared"),
  })
  const cancel = useMutation({
    mutationFn: () => api.post<Run>(`/api/v1/production-reset/runs/${run?.id}/cancel`, {}),
    onSuccess: () => setRun(null),
    onError: onError("The reset could not be cancelled"),
  })

  if (!isSuperAdmin) {
    return <Notice tone="warning">Only a Super Admin can open production reset.</Notice>
  }

  const data = preview.data
  const toggle = (id: string) =>
    setApproved((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const reasonOk = reason.trim().length >= 10
  const canExecute = phrase === data?.confirmationPhrase && reasonOk

  return (
    <div className="space-y-6">
      <Panel
        title="Production reset / उत्पादन रीसेट"
        description="Clears approved test transactions before the department starts real operations. It never runs on its own."
      >
        <div className="space-y-4">
          <Notice tone="warning">
            This permanently removes the selected payments, their allocations and their receipts from the live tables. Property records,
            demands, tax rates, rebates, penalties, users, roles and the audit trail are not touched. Take a full database backup with your
            hosting provider before starting.
          </Notice>
          {preview.isLoading ? <LoadingBlock rows={4} /> : null}
          {preview.isError ? <ErrorBlock error={preview.error} onRetry={() => void preview.refetch()} /> : null}
          {data && !data.enabled ? (
            <Notice>
              The final step is switched off on this server. You can review and back up now. Set PRODUCTION_RESET_ENABLED=true only for the
              planned window, and switch it off afterwards.
            </Notice>
          ) : null}
          {data ? (
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {COUNT_LABELS.map(([key, label]) => (
                <div key={key} className="rounded-lg border p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-lg font-semibold tabular-nums">{data.selected[key]}</dd>
                </div>
              ))}
              <div className="rounded-lg border bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">Amount on these payments</dt>
                <dd className="text-lg font-semibold tabular-nums">{formatInr(data.selected.amount)}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      </Panel>

      {data ? (
        <>
          <Panel
            title={`Marked as test (${data.autoIncluded.length})`}
            description="Included automatically: the sandbox gateway, or remarks or a counter code that begin with test, demo, sample, dummy or UAT."
          >
            <PaymentTable rows={data.autoIncluded} caption="Payments marked as test" />
          </Panel>
          <Panel
            title={`Needs your decision (${data.needsReview.length})`}
            description="These cannot be told apart from genuine citizen payments. They stay unless you tick them one by one. Payments confirmed by the live gateway are shown in red."
          >
            <PaymentTable rows={data.needsReview} caption="Payments needing review" selectable approved={approved} onToggle={toggle} />
          </Panel>
          <Panel title="Preserved / सुरक्षित" description="Counts of records this reset does not touch.">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {Object.entries(data.preserved).map(([key, value]) => (
                <div key={key} className="rounded-lg border p-3">
                  <dt className="text-xs text-muted-foreground">{PRESERVED_LABELS[key] ?? key}</dt>
                  <dd className="font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Run the reset / रीसेट चलाएँ" description="Each step is checked again on the server.">
            <ol className="space-y-5">
              <li className="space-y-2">
                <p className="text-sm font-medium">1. Freeze this list</p>
                <p className="text-sm text-muted-foreground">If any listed payment changes after this, the reset stops and nothing is cleared.</p>
                <Button
                  type="button"
                  className="cursor-pointer"
                  disabled={Boolean(run) || prepare.isPending || data.selected.paymentIds.length === 0}
                  onClick={() => prepare.mutate()}
                >
                  {run ? "List frozen" : `Freeze ${data.selected.paymentIds.length} payment(s)`}
                </Button>
              </li>
              <li className="space-y-2">
                <p className="text-sm font-medium">2. Create and verify the backup</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={!run || run.status !== "PREPARED" || backup.isPending}
                    onClick={() => backup.mutate()}
                  >
                    <ShieldCheck aria-hidden className="size-4" /> {backup.isPending ? "Working…" : "Create backup"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={!run?.backupSha256}
                    onClick={() =>
                      void downloadAuthenticatedExport(
                        `/api/v1/production-reset/runs/${run?.id}/backup`,
                        `production-reset-${run?.id}.json`
                      ).catch(onError("The backup could not be downloaded"))
                    }
                  >
                    <Download aria-hidden className="size-4" /> Download backup
                  </Button>
                </div>
                {run?.backupSha256 ? (
                  <p className="text-xs break-all text-muted-foreground">
                    Verified. {run.backupBytes?.toLocaleString("en-IN")} bytes. SHA-256 <span className="font-mono">{run.backupSha256}</span>
                  </p>
                ) : null}
              </li>
              <li className="space-y-3">
                <p className="text-sm font-medium">3. Confirm</p>
                <Notice tone="warning">
                  <span className="inline-flex items-start gap-2">
                    <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                    This cannot be undone from the portal. Restoring needs the backup and a database administrator.
                  </span>
                </Notice>
                <Field id="reset-reason" label="Reason (recorded permanently)" required hint="At least 10 characters.">
                  {(props) => <Textarea {...props} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />}
                </Field>
                <Field id="reset-phrase" label={`Type exactly: ${data.confirmationPhrase}`} required>
                  {(props) => <Input {...props} autoComplete="off" value={phrase} onChange={(e) => setPhrase(e.target.value)} />}
                </Field>
                <div className="flex flex-wrap gap-2">
                  {data.secondApprovalRequired && run?.status === "BACKUP_VERIFIED" ? (
                    <Button type="button" variant="outline" className="cursor-pointer" disabled={!reasonOk} onClick={() => requestApproval.mutate()}>
                      Ask a second Super Admin to approve
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    className="cursor-pointer"
                    disabled={!run || !data.enabled || !canExecute || execute.isPending || !["BACKUP_VERIFIED", "APPROVED"].includes(run.status)}
                    onClick={() => execute.mutate()}
                  >
                    {execute.isPending ? "Clearing…" : "Clear these test transactions"}
                  </Button>
                  {run && run.status !== "EXECUTED" ? (
                    <Button type="button" variant="ghost" className="cursor-pointer" onClick={() => cancel.mutate()}>
                      Cancel this reset
                    </Button>
                  ) : null}
                </div>
              </li>
            </ol>
          </Panel>

          {run?.report ? (
            <Panel title="Verification report / सत्यापन रिपोर्ट" description={run.report.note}>
              <ul className="space-y-1 text-sm">
                {Object.entries(run.report.checks).map(([key, ok]) => (
                  <li key={key} className={ok ? "text-success" : "font-medium text-destructive"}>
                    {ok ? "Passed" : "FAILED"}: {CHECK_LABELS[key] ?? key}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
