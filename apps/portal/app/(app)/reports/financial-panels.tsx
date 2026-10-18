"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { api } from "@/lib/api"
import { downloadAuthenticatedExport } from "@/lib/download-blob"

type Policy = {
  id: string
  name: string
  status: string
  rate: string | null
  fixedAmount: string | null
  includeArrears?: boolean
  includePenalty?: boolean
  startsOn: string | null
  endsOn: string | null
  rebateType?: string
  penaltyType?: string
  trigger?: string
}

export function FinancialAdminPanels(props: {
  assessmentYearId: string
  surveyId: string
  canAdjust: boolean
  canConfigure: boolean
  yearLocked: boolean
  publishedDemandId: string | null
  verificationStatus?: string
}) {
  const queryClient = useQueryClient()
  const [history, setHistory] = React.useState<string>("")
  const [form, setForm] = React.useState({
    propertyTax: "0.00",
    waterTax: "0.00",
    drainageTax: "0.00",
    penalty: "0.00",
    interest: "0.00",
    historicalPayments: "0.00",
    reason: "",
    sourceReference: "",
    balanceKind: "COMPONENTS" as "COMPONENTS" | "CLOSING_ONLY",
  })
  const [rebateName, setRebateName] = React.useState("Early payment rebate")
  const [rebateRate, setRebateRate] = React.useState("10")
  const [includeArrears, setIncludeArrears] = React.useState(true)
  const [penaltyName, setPenaltyName] = React.useState("Property tax penalty")
  const [penaltyRate, setPenaltyRate] = React.useState("0")
  const [applyAfterRebate, setApplyAfterRebate] = React.useState(false)
  const [importResult, setImportResult] = React.useState<{
    valid: number
    failed: number
    inserted?: number
    headers: string[]
    preview: Array<{
      propertyId: string
      assessmentYear: string
      balanceKind: string
      verifiedClosing: string
      remarks: string
    }>
    errors: Array<{ row: number; message: string }>
  } | null>(null)

  const rebates = useQuery({
    queryKey: ["rebate-policies", props.assessmentYearId],
    enabled: Boolean(props.assessmentYearId),
    queryFn: () =>
      api
        .get<Policy[]>(
          `/api/v1/rebate-policies?assessmentYearId=${props.assessmentYearId}`
        )
        .then((res) => res.data),
  })
  const penalties = useQuery({
    queryKey: ["penalty-policies", props.assessmentYearId],
    enabled: Boolean(props.assessmentYearId),
    queryFn: () =>
      api
        .get<Policy[]>(
          `/api/v1/penalty-policies?assessmentYearId=${props.assessmentYearId}`
        )
        .then((res) => res.data),
  })

  const refreshLedger = () => {
    void queryClient.invalidateQueries({ queryKey: ["demand-outstanding"] })
  }

  const saveHistory = useMutation({
    mutationFn: () =>
      api.post("/api/v1/demands/opening-balances", {
        surveyId: props.surveyId,
        assessmentYearId: props.assessmentYearId,
        propertyTax: form.propertyTax,
        waterTax: form.waterTax,
        drainageTax: form.drainageTax,
        penalty: form.penalty,
        interest: form.interest,
        historicalPayments: form.historicalPayments,
        reason: form.reason,
        sourceReference: form.sourceReference,
        balanceKind: form.balanceKind,
      }),
    onSuccess: () => {
      toast.success("Historical assessment recorded. Verify it before publishing later years.")
      refreshLedger()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const verify = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/demands/opening-balances/${props.publishedDemandId}/verify`, {}),
    onSuccess: () => {
      toast.success("Historical balance verified")
      refreshLedger()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const loadHistory = useMutation({
    mutationFn: () =>
      api
        .get<Array<{ type: string; action?: string; at: string }>>(
          `/api/v1/demands/${props.publishedDemandId}/history`
        )
        .then((res) => res.data),
    onSuccess: (rows) => {
      setHistory(
        rows
          .map((row) => `${row.at} ${row.type}${row.action ? ` ${row.action}` : ""}`)
          .join("\n") || "No audit rows"
      )
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const importFile = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      body.set("dryRun", "true")
      body.set("file", file)
      const preview = await api.postForm<{
        valid: number
        failed: number
        inserted?: number
        headers: string[]
        preview: Array<{
          propertyId: string
          assessmentYear: string
          balanceKind: string
          verifiedClosing: string
          remarks: string
        }>
        errors: Array<{ row: number; message: string }>
      }>("/api/v1/demands/opening-balances/import", body)
      if (preview.data.failed > 0) return preview.data
      const commit = new FormData()
      commit.set("file", file)
      const saved = await api.postForm<{
        valid: number
        failed: number
        inserted: number
        headers: string[]
        preview: Array<{
          propertyId: string
          assessmentYear: string
          balanceKind: string
          verifiedClosing: string
          remarks: string
        }>
        errors: Array<{ row: number; message: string }>
      }>("/api/v1/demands/opening-balances/import", commit)
      return saved.data
    },
    onSuccess: (result) => {
      setImportResult(result)
      if (result.failed > 0) {
        toast.error(`${result.failed} row(s) were rejected. Review the report before importing.`)
        return
      }
      toast.success(`Imported ${"inserted" in result ? result.inserted : result.valid} historical rows`)
      refreshLedger()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const createRebate = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>("/api/v1/rebate-policies", {
        name: rebateName,
        assessmentYearId: props.assessmentYearId,
        rebateType: "PERCENTAGE",
        rate: rebateRate,
        includePropertyTax: true,
        includeWaterTax: true,
        includeDrainageTax: true,
        includeArrears,
        includePenalty: false,
        includeInterest: false,
      }),
    onSuccess: async (res) => {
      await api.post(`/api/v1/rebate-policies/${res.data.id}/activate`, {})
      toast.success("Rebate policy activated. Published demands were not changed.")
      void queryClient.invalidateQueries({ queryKey: ["rebate-policies"] })
      refreshLedger()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const createPenalty = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>("/api/v1/penalty-policies", {
        name: penaltyName,
        assessmentYearId: props.assessmentYearId,
        penaltyType: applyAfterRebate
          ? "PERCENT_OF_ELIGIBLE_BASE"
          : "PERCENT_OF_PROPERTY_TAX",
        rate: penaltyRate,
        trigger: "ON_ASSESSMENT",
        includePropertyTax: true,
        includeWaterTax: applyAfterRebate,
        includeDrainageTax: applyAfterRebate,
        includeArrears: applyAfterRebate,
        applyAfterRebate,
      }),
    onSuccess: async (res) => {
      await api.post(`/api/v1/penalty-policies/${res.data.id}/activate`, {})
      toast.success("Penalty policy activated. Published demands were not changed.")
      void queryClient.invalidateQueries({ queryKey: ["penalty-policies"] })
      refreshLedger()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div className="space-y-4">
      {props.canAdjust && props.surveyId ? (
        <div className="space-y-2 rounded-md border p-3">
          <p className="font-medium">Add historical assessment / ऐतिहासिक आकलन</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["propertyTax", "Property tax"],
                ["waterTax", "Water tax"],
                ["drainageTax", "Drainage tax"],
                ["penalty", "Penalty"],
                ["interest", "Interest"],
                ["historicalPayments", "Payments received"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="space-y-1">
                <span className="text-muted-foreground">{label}</span>
                <Input
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: event.target.value }))
                  }
                />
              </label>
            ))}
          </div>
          <Input
            value={form.reason}
            placeholder="Source or reason"
            onChange={(event) =>
              setForm((current) => ({ ...current, reason: event.target.value }))
            }
          />
          <Input
            value={form.sourceReference}
            placeholder="Receipt or demand reference"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sourceReference: event.target.value,
              }))
            }
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={
                saveHistory.isPending ||
                props.yearLocked ||
                form.reason.trim().length < 3
              }
              onClick={() => saveHistory.mutate()}
            >
              Add historical assessment
            </Button>
            {props.publishedDemandId && props.verificationStatus === "UNVERIFIED" ? (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={verify.isPending}
                onClick={() => verify.mutate()}
              >
                Verify balance
              </Button>
            ) : null}
            {props.publishedDemandId ? (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={loadHistory.isPending}
                onClick={() => loadHistory.mutate()}
              >
                View audit history
              </Button>
            ) : null}
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Balance type</span>
              <select
                className="flex h-9 rounded-md border bg-background px-2"
                value={form.balanceKind}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    balanceKind: event.target.value as "COMPONENTS" | "CLOSING_ONLY",
                  }))
                }
              >
                <option value="COMPONENTS">Component amounts</option>
                <option value="CLOSING_ONLY">Closing balance only</option>
              </select>
            </label>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() =>
                void downloadAuthenticatedExport(
                  "/api/v1/demands/opening-balances/template",
                  "historical-opening-balances.xlsx"
                ).catch((error: Error) => toast.error(error.message))
              }
            >
              Download template
            </Button>
            <Label className="cursor-pointer">
              <Input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) importFile.mutate(file)
                }}
              />
              <span className="inline-flex h-9 items-center rounded-md border px-3 text-sm">
                Import historical data
              </span>
            </Label>
          </div>
          {importResult ? (
            <div className="space-y-2 text-sm">
              <p>
                {importResult.valid} accepted, {importResult.failed} rejected
                {importResult.inserted != null ? `, ${importResult.inserted} saved` : ""}.
                Existing published demands are not overwritten.
              </p>
              {importResult.headers.length > 0 ? (
                <p className="text-muted-foreground">
                  Columns: {importResult.headers.join(", ")}
                </p>
              ) : null}
              {importResult.preview.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="border p-1 text-left">Property</th>
                        <th className="border p-1 text-left">Year</th>
                        <th className="border p-1 text-left">Kind</th>
                        <th className="border p-1 text-left">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.preview.map((row) => (
                        <tr key={`${row.propertyId}-${row.assessmentYear}`}>
                          <td className="border p-1">{row.propertyId}</td>
                          <td className="border p-1">{row.assessmentYear}</td>
                          <td className="border p-1">{row.balanceKind}</td>
                          <td className="border p-1">{row.verifiedClosing || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {importResult.errors.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => {
                    const lines = [
                      "row,message",
                      ...importResult.errors.map(
                        (error) =>
                          `${error.row},"${error.message.replaceAll('"', '""')}"`
                      ),
                    ]
                    const blob = new Blob([lines.join("\n")], { type: "text/csv" })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement("a")
                    link.href = url
                    link.download = "historical-import-result.csv"
                    link.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  Download rejected rows
                </Button>
              ) : null}
            </div>
          ) : null}
          {history ? (
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{history}</pre>
          ) : null}
        </div>
      ) : null}

      {props.canConfigure ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card id="rebate">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rebate settings / छूट</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(rebates.data ?? []).map((policy) => (
                <p key={policy.id}>
                  {policy.name}: {policy.rate ?? policy.fixedAmount}% · {policy.status}
                  {policy.includeArrears ? " · includes arrears" : " · current-year taxes"}
                </p>
              ))}
              <Input value={rebateName} onChange={(event) => setRebateName(event.target.value)} />
              <Input value={rebateRate} onChange={(event) => setRebateRate(event.target.value)} />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeArrears}
                  onChange={(event) => setIncludeArrears(event.target.checked)}
                />
                Apply to previous-year arrears
              </label>
              <Button
                type="button"
                className="cursor-pointer"
                disabled={createRebate.isPending}
                onClick={() => createRebate.mutate()}
              >
                Save and activate rebate
              </Button>
            </CardContent>
          </Card>
          <Card id="penalty">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Penalty settings / शास्ति</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(penalties.data ?? []).map((policy) => (
                <p key={policy.id}>
                  {policy.name}: {policy.rate ?? policy.fixedAmount} · {policy.status} ·{" "}
                  {policy.trigger}
                </p>
              ))}
              <Input value={penaltyName} onChange={(event) => setPenaltyName(event.target.value)} />
              <Input
                value={penaltyRate}
                onChange={(event) => setPenaltyRate(event.target.value)}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={applyAfterRebate}
                  onChange={(event) => setApplyAfterRebate(event.target.checked)}
                />
                Apply after rebate, including arrears
              </label>
              <p className="text-muted-foreground">
                {applyAfterRebate
                  ? "Penalty is a percentage of the eligible base after rebate, including previous-year arrears. It is applied once when a demand is calculated."
                  : "Percentage of property tax, applied once when a demand is calculated. If no policy is active, the tax-rate penalty percent is used."}{" "}
                Published demands are not rewritten.
              </p>
              <Button
                type="button"
                className="cursor-pointer"
                disabled={createPenalty.isPending}
                onClick={() => createPenalty.mutate()}
              >
                Save and activate penalty
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
