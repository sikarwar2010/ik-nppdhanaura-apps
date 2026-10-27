"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Lock, XCircle } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  ConfirmDialog,
  ErrorBlock,
  Field,
  LoadingBlock,
  Notice,
  Panel,
  StatusBadge,
  selectClass,
} from "@/components/admin/admin-ui"
import { usePermission } from "@/hooks/use-permission"
import { api } from "@/lib/api"
import { formatApiError } from "@/lib/format-api-error"
import { inr, useCollectionLookups, useSelectedAssessmentYear } from "../collection-shared"

type Row = {
  yearCode: string
  properties: number
  openingArrears: string
  demand: string
  rebateAndCredits: string
  payments: string
  ownOutstanding: string
  closingBalance: string
  chainOk: boolean
}

type Preview = {
  assessmentYear: { id: string; code: string; name: string }
  nextYear: { id: string; code: string; name: string } | null
  status: string
  canClose: boolean
  lastClose: { at: string; by: string | null; reason: string | null } | null
  report: {
    rows: Row[]
    openingArrears: string
    demand: string
    rebateAndCredits: string
    payments: string
    ownOutstanding: string
    closingCarryForward: string
    propertiesWithArrears: number
    chainOk: boolean
    nextYear: {
      yearCode: string
      demandsPublished: number
      storedOpeningArrears: string
      currentCarryForward: string
      difference: string
      mismatchedProperties: number
      explanation: string
    } | null
    flags: {
      unverifiedDemands: number
      unverifiedAmount: string
      pendingInstruments: number
      pendingAmount: string
      paymentsWithoutDemand: number
      unassignedPayments: number
      gapProperties: number
    }
    blockingIssues: string[]
  }
}

export default function YearEndPage() {
  const { years } = useCollectionLookups()
  const [yearId, setYearId] = useSelectedAssessmentYear(years)
  const { hasPermission } = usePermission()
  const canClose = hasPermission("settings:update")
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = React.useState(false)
  const [acknowledged, setAcknowledged] = React.useState(false)

  const preview = useQuery({
    queryKey: ["year-end", yearId],
    enabled: Boolean(yearId),
    queryFn: () => api.get<Preview>(`/api/v1/collections/year-end?assessmentYearId=${yearId}`).then((res) => res.data),
  })

  const close = useMutation({
    mutationFn: (reason: string) =>
      api.post<Preview>("/api/v1/collections/year-end/close", {
        assessmentYearId: yearId,
        reason,
        acknowledgeIssues: acknowledged || undefined,
      }),
    onSuccess: (res) => {
      toast.success(`${res.data.assessmentYear.name} closed. Balances were not changed.`)
      setConfirming(false)
      setAcknowledged(false)
      queryClient.setQueryData(["year-end", yearId], res.data)
      void queryClient.invalidateQueries({ queryKey: ["assessment-years-admin"] })
    },
    onError: (error) => toast.error(formatApiError(error, "The year was not closed")),
  })

  const data = preview.data
  const report = data?.report
  const issues = report?.blockingIssues ?? []

  return (
    <div className="space-y-6">
      <Panel
        title="Year-end carry-forward / वर्षांत अग्रेषण"
        description="Unpaid balances are never copied into the next year. Each new year's arrears are calculated from the verified closing balances below, so running this check again cannot duplicate arrears."
        actions={
          <Field id="ye-year" label="Assessment year">
            {(props) => (
              <select {...props} className={cn(selectClass, "sm:w-48")} value={yearId} onChange={(e) => setYearId(e.target.value)}>
                {[...years]
                  .sort((a, b) => b.code.localeCompare(a.code))
                  .map((year) => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
              </select>
            )}
          </Field>
        }
      >
        {preview.isLoading ? <LoadingBlock rows={5} /> : null}
        {preview.isError ? <ErrorBlock error={preview.error} onRetry={() => void preview.refetch()} /> : null}
        {data && report ? (
          <div className="space-y-4">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              Status: <StatusBadge status={data.status} />
              {data.lastClose ? (
                <span className="text-muted-foreground">
                  Closed {new Date(data.lastClose.at).toLocaleString("en-IN")} by {data.lastClose.by ?? "—"}
                  {data.lastClose.reason ? ` · ${data.lastClose.reason}` : ""}
                </span>
              ) : null}
            </p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Opening arrears", report.openingArrears],
                ["Demand (tax, penalty, charges)", report.demand],
                ["Rebates & credits", report.rebateAndCredits],
                ["Payments", report.payments],
                ["This year still unpaid", report.ownOutstanding],
                [`Carries into ${data.nextYear?.name ?? "next year"}`, report.closingCarryForward],
              ].map(([label, value], i) => (
                <div key={label} className={cn("rounded-lg border p-3", i === 5 && "bg-muted/50")}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums sm:text-lg">{inr(value)}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm">{report.propertiesWithArrears} propert{report.propertiesWithArrears === 1 ? "y has" : "ies have"} an unpaid verified balance.</p>

            <div className="relative overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[760px] text-sm">
                <caption className="px-3 pt-2 text-left text-sm font-medium">Opening = previous closing; closing = opening + demand − rebates/credits − payments</caption>
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    {["Year", "Properties", "Opening", "Demand", "Rebates & credits", "Payments", "Closing", "Check"].map((label, i) => (
                      <th key={label} scope="col" className={cn("p-2 font-medium", i === 0 || i === 7 ? "text-left" : "text-right")}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => (
                    <tr key={row.yearCode} className="border-t">
                      <th scope="row" className="p-2 text-left font-medium">{row.yearCode}</th>
                      <td className="p-2 text-right tabular-nums">{row.properties}</td>
                      <td className="p-2 text-right tabular-nums">{inr(row.openingArrears)}</td>
                      <td className="p-2 text-right tabular-nums">{inr(row.demand)}</td>
                      <td className="p-2 text-right tabular-nums">{inr(row.rebateAndCredits)}</td>
                      <td className="p-2 text-right tabular-nums">{inr(row.payments)}</td>
                      <td className="p-2 text-right font-semibold tabular-nums">{inr(row.closingBalance)}</td>
                      <td className="p-2">
                        {row.chainOk ? (
                          <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 aria-hidden className="size-4" /> Reconciles</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-destructive"><XCircle aria-hidden className="size-4" /> Does not reconcile</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {report.rows.length === 0 ? (
                    <tr><td colSpan={8} className="p-3 text-muted-foreground">No verified published demands up to this year.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {report.nextYear ? (
              <Notice tone={report.nextYear.mismatchedProperties ? "info" : "success"}>
                <strong>{report.nextYear.yearCode}:</strong> {report.nextYear.demandsPublished} demand(s) already published with{" "}
                {inr(report.nextYear.storedOpeningArrears)} opening arrears at publication; today the same properties carry{" "}
                {inr(report.nextYear.currentCarryForward)}. {report.nextYear.explanation}
              </Notice>
            ) : null}

            {issues.length > 0 ? (
              <Notice tone="warning">
                <p className="font-medium">Review before closing:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {issues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              </Notice>
            ) : (
              <Notice tone="success">No open reconciliation issues for this year.</Notice>
            )}

            {canClose ? (
              <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm">
                  <p>Closing stops new demands and historical entries for this year. Payments against its arrears are still accepted and reduce this year&apos;s balance.</p>
                  {issues.length > 0 && data.canClose ? (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="size-4 cursor-pointer" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
                      I have reviewed the issues listed above
                    </label>
                  ) : null}
                </div>
                <Button
                  className="shrink-0 cursor-pointer"
                  disabled={!data.canClose || (issues.length > 0 && !acknowledged)}
                  onClick={() => setConfirming(true)}
                >
                  <Lock aria-hidden className="size-4" /> Close {data.assessmentYear.name}…
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Closing a year needs the “Update settings” permission.</p>
            )}
          </div>
        ) : null}
      </Panel>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Close ${data?.assessmentYear.name ?? "year"}?`}
        description={
          <span>
            The closing figures ({inr(report?.closingCarryForward)} carried forward) are recorded in the audit log with your reason.
            No balance, demand or payment is changed, and the year cannot be closed twice.
          </span>
        }
        confirmLabel="Close year"
        requireReason
        reasonLabel="Approval reference / reason"
        pending={close.isPending}
        onConfirm={(reason) => close.mutate(reason)}
      />
    </div>
  )
}
