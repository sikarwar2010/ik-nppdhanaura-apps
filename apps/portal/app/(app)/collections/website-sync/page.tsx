"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RefreshCw, Scale } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"

import { ErrorBlock, Field, LoadingBlock, Notice, Panel, selectClass } from "@/components/admin/admin-ui"
import { usePermission } from "@/hooks/use-permission"
import { api } from "@/lib/api"
import { formatApiError } from "@/lib/format-api-error"
import { inr, StatusBadge, useCollectionLookups, useSelectedAssessmentYear } from "../collection-shared"

type Status = {
  pending: number
  failed: number
  sent: number
  websiteRefreshConfigured: boolean
  recent: Array<{
    id: string
    eventType: string
    status: string
    attempts: number
    lastError: string | null
    createdAt: string
    sentAt: string | null
    nextAttemptAt: string
  }>
}

type Reconcile = {
  assessmentYear: { name: string } | null
  ledgerCollected: string
  publicCollected: string
  byTax: { propertyTax: string; waterTax: string; drainageTax: string }
  collectionsDisclosedOnWebsite: boolean
  matches: boolean
}

const EVENT_LABEL: Record<string, string> = {
  PAYMENT_POSTED: "Payment posted",
  PAYMENT_REVERSED: "Payment reversed",
  PRODUCTION_RESET: "Production reset",
  MANUAL_RECONCILE: "Manual check",
}

export default function WebsiteSyncPage() {
  const { hasPermission } = usePermission()
  const canAct = hasPermission("settings:update")
  const { years } = useCollectionLookups()
  const [yearId, setYearId] = useSelectedAssessmentYear(years)
  const queryClient = useQueryClient()
  const [result, setResult] = React.useState<Reconcile | null>(null)

  const status = useQuery({
    queryKey: ["public-sync-status"],
    refetchInterval: 30_000,
    queryFn: () => api.get<Status>("/api/v1/public-sync/status").then((res) => res.data),
  })
  const retry = useMutation({
    mutationFn: () => api.post<{ retried: number; sent: number; failed: number }>("/api/v1/public-sync/retry", {}),
    onSuccess: (res) => {
      toast.success(`${res.data.sent} sent, ${res.data.failed} still failing`)
      void queryClient.invalidateQueries({ queryKey: ["public-sync-status"] })
    },
    onError: (error) => toast.error(formatApiError(error, "Retry failed")),
  })
  const reconcile = useMutation({
    mutationFn: () => api.post<Reconcile>("/api/v1/public-sync/reconcile", { assessmentYearId: yearId || undefined }),
    onSuccess: (res) => {
      setResult(res.data)
      void queryClient.invalidateQueries({ queryKey: ["public-sync-status"] })
    },
    onError: (error) => toast.error(formatApiError(error, "The check could not run")),
  })

  const data = status.data
  return (
    <div className="space-y-6">
      <Panel
        title="Website synchronisation / वेबसाइट समन्वय"
        description="Public totals are always read from the ledger, so a repeat can refresh a page but never count a payment twice. No consumer or payment detail is sent to the website."
      >
        {status.isLoading ? <LoadingBlock rows={3} /> : null}
        {status.isError ? <ErrorBlock error={status.error} onRetry={() => void status.refetch()} /> : null}
        {data ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-3 gap-2">
              {[
                ["Waiting", data.pending],
                ["Failed, will retry", data.failed],
                ["Sent", data.sent],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-lg font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            {!data.websiteRefreshConfigured ? (
              <Notice tone="warning">
                Instant website refresh is not configured on this server (WEB_REVALIDATE_URL). The website still updates within about a minute.
              </Notice>
            ) : null}
            {canAct ? (
              <Button type="button" variant="outline" className="cursor-pointer" disabled={retry.isPending || data.failed === 0} onClick={() => retry.mutate()}>
                <RefreshCw aria-hidden className="size-4" /> Retry failed now
              </Button>
            ) : null}
            <div className="relative overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">Recent synchronisation events</caption>
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    {["When", "Event", "Status", "Attempts", "Last problem"].map((label) => (
                      <th key={label} scope="col" className="p-2 text-left font-medium">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="p-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString("en-IN")}</td>
                      <td className="p-2">{EVENT_LABEL[row.eventType] ?? row.eventType}</td>
                      <td className="p-2"><StatusBadge status={row.status} /></td>
                      <td className="p-2 tabular-nums">{row.attempts}</td>
                      <td className="p-2 break-words text-muted-foreground">{row.lastError ?? "—"}</td>
                    </tr>
                  ))}
                  {data.recent.length === 0 ? (
                    <tr><td colSpan={5} className="p-3 text-muted-foreground">No events yet.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Panel>

      {canAct ? (
        <Panel
          title="Reconcile / मिलान"
          description="Compares the figure the website reads with a direct sum of the ledger, then refreshes the website."
          actions={
            <Field id="sync-year" label="Assessment year">
              {(props) => (
                <select {...props} className={selectClass} value={yearId} onChange={(e) => { setYearId(e.target.value); setResult(null) }}>
                  {[...years].sort((a, b) => b.code.localeCompare(a.code)).map((year) => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              )}
            </Field>
          }
        >
          <div className="space-y-3">
            <Button type="button" className="cursor-pointer" disabled={reconcile.isPending} onClick={() => reconcile.mutate()}>
              <Scale aria-hidden className="size-4" /> {reconcile.isPending ? "Checking…" : "Run check"}
            </Button>
            {reconcile.isError ? (
              <Notice tone="warning">No published, verified demands were found for this year, so there is nothing to compare.</Notice>
            ) : null}
            {result ? (
              <div className="space-y-3">
                <Notice tone={result.matches ? "success" : "warning"}>
                  {result.matches
                    ? `The website figure matches the ledger for ${result.assessmentYear?.name ?? "this year"}.`
                    : "The website figure does not match the ledger. Do not publish figures until this is explained."}
                </Notice>
                <dl className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                  {[
                    ["Ledger total", result.ledgerCollected],
                    ["Website total", result.publicCollected],
                    ["Property tax", result.byTax.propertyTax],
                    ["Water tax", result.byTax.waterTax],
                    ["Drainage tax", result.byTax.drainageTax],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border p-3">
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="font-semibold tabular-nums">{inr(value)}</dd>
                    </div>
                  ))}
                </dl>
                {!result.collectionsDisclosedOnWebsite ? (
                  <Notice>
                    Collections are not shown on the public website yet. They appear only after the department approves it and
                    PUBLIC_DISCLOSE_COLLECTIONS=true is set.
                  </Notice>
                ) : null}
              </div>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </div>
  )
}
