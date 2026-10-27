"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Copy, FilePlus2, Save, Send } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

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
  selectClass,
  type PreviewStep,
} from "@/components/admin/admin-ui"
import { AuditHistory } from "@/components/admin/audit-history"
import { useCan } from "@/hooks/use-permission"
import { ApiError, api } from "@/lib/api"
import { formatApiError } from "@/lib/format-api-error"

type RefEntry = { id: string; code: string; name: string }
type YearRow = { id: string; name: string; code: string; profile: { status: string } | null }
type Overview = {
  wardId: string
  wardNumber: number
  wardName: string
  configId: string | null
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | null
  version: number | null
  publishedAt: string | null
  changeReason: string | null
  propertyTaxPct: string | null
  waterTaxPct: string | null
  drainageTaxPct: string | null
  rateCells: number
}
type Config = {
  configured: true
  id: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  version: number
  propertyTaxPct: string | null
  waterTaxPct: string | null
  drainageTaxPct: string | null
  penaltyPct: string | null
  assessablePct: string | null
  commercialAssessablePct: string | null
  publishedAt?: string | null
  previouslyPublished?: boolean
  cells: Array<{ roadWidthEntryId: string; constructionEntryId: string; annualRatePerSqFt: string | null }>
}
type Preview = {
  configured: boolean
  rateMissing: boolean
  steps?: PreviewStep[]
  roundingRule?: string
}

const PARAMS = [
  ["propertyTaxPct", "Property tax", "% of assessable ALV"],
  ["waterTaxPct", "Water tax", "% of assessable ALV (not on open land)"],
  ["drainageTaxPct", "Drainage tax", "% of assessable ALV (0 if not levied)"],
  ["assessablePct", "Assessable share — residential", "% of gross ALV that is taxed"],
  ["commercialAssessablePct", "Assessable share — commercial", "% of gross ALV that is taxed"],
  ["penaltyPct", "Rate-table penalty", "% of property tax; used only when no penalty rule is active"],
] as const
type ParamKey = (typeof PARAMS)[number][0]

const USE_OPTIONS = [
  ["R", "Residential"],
  ["C", "Commercial (rate × 2)"],
  ["M", "Mixed"],
  ["P", "Open plot (no water/drainage)"],
] as const

const PCT = /^\d{1,3}(\.\d{1,4})?$/
const RATE = /^\d{1,6}(\.\d{1,4})?$/

export default function TaxRatesPage() {
  const canEdit = useCan("settings:update").allowed
  const qc = useQueryClient()
  const [yearId, setYearId] = React.useState("")
  const [wardId, setWardId] = React.useState("")
  const [params, setParams] = React.useState<Record<ParamKey, string> | null>(null)
  const [cells, setCells] = React.useState<Record<string, string>>({})
  const [loadedFor, setLoadedFor] = React.useState("")
  const [confirm, setConfirm] = React.useState<null | "publish" | "copy">(null)
  const [reasonFor, setReasonFor] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState({ area: "1000", road: "", construction: "", use: "R" })

  const years = useQuery({
    queryKey: ["assessment-years-admin"],
    queryFn: () => api.get<YearRow[]>("/api/v1/assessment-years").then((r) => r.data ?? []),
  })
  const sortedYears = React.useMemo(
    () => [...(years.data ?? [])].sort((a, b) => b.code.localeCompare(a.code)),
    [years.data]
  )
  const activeYear = yearId || sortedYears.find((y) => y.profile?.status === "ACTIVE")?.id || sortedYears[0]?.id || ""
  const year = sortedYears.find((y) => y.id === activeYear)
  const yearLocked = year?.profile?.status === "CLOSED" || year?.profile?.status === "ARCHIVED"

  const zones = useQuery({
    queryKey: ["ref", "TAX_RATE_ZONE"],
    queryFn: () => api.get<RefEntry[]>("/api/v1/reference-entries?category=TAX_RATE_ZONE").then((r) => r.data ?? []),
  })
  const constructions = useQuery({
    queryKey: ["ref", "CONSTRUCTION_TYPE"],
    queryFn: () => api.get<RefEntry[]>("/api/v1/reference-entries?category=CONSTRUCTION_TYPE").then((r) => r.data ?? []),
  })

  const overview = useQuery({
    queryKey: ["tax-config-overview", activeYear],
    enabled: Boolean(activeYear),
    queryFn: () => api.get<Overview[]>(`/api/v1/tax-configs/overview?assessmentYearId=${activeYear}`).then((r) => r.data ?? []),
  })
  const activeWard = wardId || overview.data?.[0]?.wardId || ""
  const ward = overview.data?.find((w) => w.wardId === activeWard)

  const config = useQuery({
    queryKey: ["tax-config", activeWard, activeYear],
    enabled: Boolean(activeWard && activeYear),
    queryFn: () =>
      api
        .get<Config | { configured: false }>(`/api/v1/tax-configs?wardId=${activeWard}&assessmentYearId=${activeYear}`)
        .then((r) => r.data),
  })
  const cfg = config.data && config.data.configured ? config.data : null

  // Load the editable copy whenever another config/version is shown.
  const identity = cfg ? `${cfg.id}:${cfg.version}:${cfg.status}` : ""
  if (cfg && identity !== loadedFor) {
    setLoadedFor(identity)
    setParams(Object.fromEntries(PARAMS.map(([k]) => [k, cfg[k] ?? ""])) as Record<ParamKey, string>)
    setCells(
      Object.fromEntries(cfg.cells.map((c) => [`${c.roadWidthEntryId}:${c.constructionEntryId}`, c.annualRatePerSqFt ?? ""]))
    )
  }

  const editable = canEdit && !yearLocked && Boolean(cfg)
  const republish = Boolean(
    cfg &&
      (cfg.previouslyPublished ||
        cfg.publishedAt ||
        ward?.publishedAt ||
        cfg.version > 1 ||
        reasonFor === cfg.id)
  )
  const paramErrors = Object.fromEntries(
    PARAMS.map(([k]) => {
      const v = params?.[k] ?? ""
      if (!PCT.test(v)) return [k, "Enter a percentage (0–100, up to 4 decimals)."]
      if (Number(v) > 100) return [k, "Cannot exceed 100%."]
      return [k, ""]
    })
  ) as Record<ParamKey, string>
  const cellErrors = Object.entries(cells).filter(([, v]) => v !== "" && !RATE.test(v))
  const paramsDirty = cfg && params ? PARAMS.some(([k]) => (cfg[k] ?? "") !== params[k]) : false
  const cellsDirty = cfg
    ? cfg.cells.some((c) => (cells[`${c.roadWidthEntryId}:${c.constructionEntryId}`] ?? "") !== (c.annualRatePerSqFt ?? "")) ||
      Object.keys(cells).length !== cfg.cells.length
    : false

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["tax-config"] })
    void qc.invalidateQueries({ queryKey: ["tax-config-overview"] })
    void qc.invalidateQueries({ queryKey: ["tax-preview"] })
    void qc.invalidateQueries({ queryKey: ["audit"] })
    void qc.invalidateQueries({ queryKey: ["assessment-years-admin"] })
  }
  const onError = (error: unknown) => toast.error(formatApiError(error, "Could not save"))

  const createDraft = useMutation({
    mutationFn: () => api.post("/api/v1/tax-configs", { wardId: activeWard, assessmentYearId: activeYear }),
    onSuccess: () => {
      toast.success("Draft rate table created for this ward")
      refresh()
    },
    onError,
  })
  const save = useMutation({
    mutationFn: async () => {
      if (!cfg || !params) return
      if (paramsDirty) {
        await api.patch(`/api/v1/tax-configs/${cfg.id}`, Object.fromEntries(PARAMS.map(([k]) => [k, Number(params[k])])))
      }
      if (cellsDirty) {
        await api.put(`/api/v1/tax-configs/${cfg.id}/cells`, {
          cells: Object.entries(cells)
            .filter(([, v]) => v !== "")
            .map(([key, v]) => {
              const [roadWidthEntryId, constructionEntryId] = key.split(":")
              return { roadWidthEntryId, constructionEntryId, annualRatePerSqFt: Number(v) }
            }),
        })
      }
    },
    onSuccess: () => {
      toast.success("Saved as draft. Publish to use these rates for new demands.")
      setLoadedFor("")
      refresh()
    },
    onError,
  })
  const publish = useMutation({
    mutationFn: (reason: string) => api.post(`/api/v1/tax-configs/${cfg!.id}/publish`, { reason: reason || undefined }),
    onSuccess: () => {
      toast.success("Rates published. Demands already published keep their original figures.")
      setReasonFor(null)
      setConfirm(null)
      setLoadedFor("")
      refresh()
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "TAX_RATE_CHANGE_REASON_REQUIRED" && cfg) {
        setReasonFor(cfg.id)
      }
      onError(e)
    },
  })
  const copy = useMutation({
    mutationFn: () =>
      api.post<{ updated: number }>("/api/v1/tax-configs/copy-to-wards", { sourceWardId: activeWard, assessmentYearId: activeYear }),
    onSuccess: (res) => {
      toast.success(`Copied to ${res.data.updated ?? 0} ward(s) as drafts`)
      setConfirm(null)
      refresh()
    },
    onError: (e) => {
      setConfirm(null)
      onError(e)
    },
  })

  const road = preview.road || zones.data?.[0]?.id || ""
  const construction = preview.construction || constructions.data?.[0]?.id || ""
  const areaValid = /^\d{1,7}(\.\d{1,2})?$/.test(preview.area)
  const previewQuery = useQuery({
    queryKey: ["tax-preview", activeWard, activeYear, preview.area, road, construction, preview.use, cfg?.version, cfg?.status],
    enabled: Boolean(cfg && road && construction && areaValid),
    queryFn: () =>
      api
        .post<Preview>("/api/v1/tax-configs/preview", {
          wardId: activeWard,
          assessmentYearId: activeYear,
          areaSqFt: Number(preview.area),
          roadWidthEntryId: road,
          constructionEntryId: construction,
          gisUseCode: preview.use,
        })
        .then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tax Rates / कर दरें"
        description="Each ward has one rate table per assessment year: a monthly base rate per sq ft by road width and construction type, and the property, water and drainage tax percentages. Changes are saved as a draft and apply to new demands only after publishing. Demands already published never change."
      />

      <div className="flex flex-wrap gap-4">
        <Field id="tr-year" label="Assessment year">
          {(p) => (
            <select {...p} className={`${selectClass} w-48`} value={activeYear} onChange={(e) => { setYearId(e.target.value); setWardId("") }}>
              {sortedYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}{y.profile ? "" : " (dates not set)"}</option>
              ))}
            </select>
          )}
        </Field>
        <Field id="tr-ward" label="Ward">
          {(p) => (
            <select {...p} className={`${selectClass} w-64`} value={activeWard} onChange={(e) => setWardId(e.target.value)}>
              {(overview.data ?? []).map((w) => (
                <option key={w.wardId} value={w.wardId}>Ward {w.wardNumber} — {w.wardName}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {yearLocked ? <Notice tone="warning">This assessment year is {year?.profile?.status.toLowerCase()}. Its rates are read-only.</Notice> : null}
      {year && !year.profile ? (
        <Notice tone="warning">This year&apos;s dates are not set. Set them on the Assessment Years page before publishing rates.</Notice>
      ) : null}

      <div className="grid gap-6 2xl:grid-cols-[1fr_28rem] [&>*]:min-w-0">
        <div className="min-w-0 space-y-6">
          <Panel
            title={ward ? `Ward ${ward.wardNumber} — ${ward.wardName}` : "Ward rates"}
            description={
              cfg
                ? `Version ${cfg.version}. ${cfg.status === "PUBLISHED" ? "In use for new demands." : "Draft: not used until published."}`
                : "No rate table for this ward and year yet."
            }
            actions={
              cfg ? (
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={cfg.status} />
                  {editable ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        disabled={!(paramsDirty || cellsDirty) || save.isPending || Object.values(paramErrors).some(Boolean) || cellErrors.length > 0}
                        onClick={() => save.mutate()}
                      >
                        <Save aria-hidden className="size-3.5" /> Save draft
                      </Button>
                      <Button
                        size="sm"
                        className="cursor-pointer"
                        disabled={cfg.status === "PUBLISHED" || paramsDirty || cellsDirty || !year?.profile}
                        title={paramsDirty || cellsDirty ? "Save the draft first" : undefined}
                        onClick={() => setConfirm("publish")}
                      >
                        <Send aria-hidden className="size-3.5" /> Publish…
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : null
            }
          >
            {config.isLoading || overview.isLoading ? (
              <LoadingBlock rows={5} />
            ) : config.isError ? (
              <ErrorBlock error={config.error} onRetry={() => void config.refetch()} />
            ) : !cfg ? (
              <EmptyBlock title="No rate table yet">
                {canEdit && !yearLocked ? (
                  <Button className="mt-3 cursor-pointer" disabled={createDraft.isPending} onClick={() => createDraft.mutate()}>
                    <FilePlus2 aria-hidden className="size-4" /> Create draft rate table
                  </Button>
                ) : (
                  "Ask an administrator to set up rates for this ward."
                )}
              </EmptyBlock>
            ) : (
              <div className="space-y-6">
                <section aria-labelledby="pct-heading">
                  <h3 id="pct-heading" className="mb-3 text-sm font-semibold">Percentages</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {PARAMS.map(([key, label, hint]) => (
                      <Field key={key} id={`p-${key}`} label={`${label} (%)`} hint={hint} error={paramErrors[key] || null}>
                        {(p) => (
                          <Input
                            {...p}
                            inputMode="decimal"
                            readOnly={!editable}
                            value={params?.[key] ?? ""}
                            onChange={(e) => params && setParams({ ...params, [key]: e.target.value.trim() })}
                          />
                        )}
                      </Field>
                    ))}
                  </div>
                </section>

                <section aria-labelledby="matrix-heading">
                  <h3 id="matrix-heading" className="text-sm font-semibold">Monthly base rate (₹ per sq ft per month)</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Annual value = area × this rate × 12 (commercial use × 2). Leave blank where no rate applies.
                  </p>
                  {cellErrors.length ? <p className="mb-2 text-xs font-medium text-destructive">Rates must be numbers with up to 4 decimals.</p> : null}
                  <div className="-mx-4 relative overflow-x-auto sm:mx-0">
                    <table className="w-full min-w-[36rem] border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted/50 text-left text-xs">
                          <th scope="col" className="border px-2 py-2">Road width zone ↓ / Construction →</th>
                          {(constructions.data ?? []).map((c) => (
                            <th key={c.id} scope="col" className="border px-2 py-2 font-medium">{c.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(zones.data ?? []).map((z) => (
                          <tr key={z.id}>
                            <th scope="row" className="border bg-muted/30 px-2 py-1.5 text-left text-xs font-medium">{z.name}</th>
                            {(constructions.data ?? []).map((c) => {
                              const key = `${z.id}:${c.id}`
                              const bad = cells[key] !== undefined && cells[key] !== "" && !RATE.test(cells[key]!)
                              return (
                                <td key={c.id} className="border p-1">
                                  <Input
                                    aria-label={`Monthly rate, ${z.name}, ${c.name}`}
                                    aria-invalid={bad || undefined}
                                    inputMode="decimal"
                                    readOnly={!editable}
                                    className="h-8 text-right tabular-nums"
                                    value={cells[key] ?? ""}
                                    onChange={(e) => setCells({ ...cells, [key]: e.target.value.trim() })}
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {editable ? (
                  <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setConfirm("copy")}>
                      <Copy aria-hidden className="size-3.5" /> Copy this table to all wards…
                    </Button>
                    <span className="text-xs text-muted-foreground">Copies become drafts in each ward.</span>
                  </div>
                ) : null}
              </div>
            )}
          </Panel>

          <Panel title="All wards" description={`Rate tables for ${year?.name ?? "the selected year"}.`}>
            {overview.isLoading ? (
              <LoadingBlock />
            ) : overview.isError ? (
              <ErrorBlock error={overview.error} onRetry={() => void overview.refetch()} />
            ) : (
              <div className="-mx-4 relative overflow-x-auto sm:mx-0">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead className="border-b bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <tr>
                      <th scope="col" className="px-3 py-2">Ward</th>
                      <th scope="col" className="px-3 py-2">Status</th>
                      <th scope="col" className="px-3 py-2 text-right">Property</th>
                      <th scope="col" className="px-3 py-2 text-right">Water</th>
                      <th scope="col" className="px-3 py-2 text-right">Drainage</th>
                      <th scope="col" className="px-3 py-2 text-right">Rates set</th>
                      <th scope="col" className="px-3 py-2">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(overview.data ?? []).map((w) => (
                      <tr key={w.wardId} className={w.wardId === activeWard ? "bg-primary/5" : "hover:bg-muted/40"}>
                        <th scope="row" className="px-3 py-2 text-left font-medium">
                          <button type="button" className="cursor-pointer text-left hover:underline" onClick={() => setWardId(w.wardId)}>
                            {w.wardNumber}. {w.wardName}
                          </button>
                        </th>
                        <td className="px-3 py-2">{w.status ? <StatusBadge status={w.status} /> : <span className="text-muted-foreground">Not set</span>}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{w.propertyTaxPct ? `${w.propertyTaxPct}%` : "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{w.waterTaxPct ? `${w.waterTaxPct}%` : "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{w.drainageTaxPct ? `${w.drainageTaxPct}%` : "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{w.rateCells}</td>
                        <td className="px-3 py-2 text-xs">
                          {w.publishedAt ? `v${w.version} · ${new Date(w.publishedAt).toLocaleDateString("en-IN")}` : "—"}
                          {w.changeReason ? <span className="block text-muted-foreground">{w.changeReason}</span> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel
            title="Calculation preview"
            description={cfg?.status === "DRAFT" ? "Uses this ward's draft rates as saved." : "Uses this ward's published rates."}
          >
            {!cfg ? (
              <p className="text-sm text-muted-foreground">Create a rate table to preview a calculation.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                  <Field id="pv-area" label="Built-up area (sq ft)" error={areaValid ? null : "Enter an area such as 1000."}>
                    {(p) => <Input {...p} inputMode="decimal" value={preview.area} onChange={(e) => setPreview({ ...preview, area: e.target.value.trim() })} />}
                  </Field>
                  <Field id="pv-use" label="Use (GIS use code)">
                    {(p) => (
                      <select {...p} className={selectClass} value={preview.use} onChange={(e) => setPreview({ ...preview, use: e.target.value })}>
                        {USE_OPTIONS.map(([code, label]) => <option key={code} value={code}>{code} — {label}</option>)}
                      </select>
                    )}
                  </Field>
                  <Field id="pv-road" label="Road width zone">
                    {(p) => (
                      <select {...p} className={selectClass} value={road} onChange={(e) => setPreview({ ...preview, road: e.target.value })}>
                        {(zones.data ?? []).map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    )}
                  </Field>
                  <Field id="pv-cons" label="Construction">
                    {(p) => (
                      <select {...p} className={selectClass} value={construction} onChange={(e) => setPreview({ ...preview, construction: e.target.value })}>
                        {(constructions.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                  </Field>
                </div>
                {previewQuery.data?.rateMissing ? (
                  <Notice tone="warning">No monthly rate is set for this road zone and construction type.</Notice>
                ) : (
                  <CalcSteps
                    steps={previewQuery.data?.steps ?? null}
                    loading={previewQuery.isFetching}
                    error={previewQuery.error}
                    footnote={previewQuery.data?.roundingRule}
                  />
                )}
              </div>
            )}
          </Panel>

          <Panel title="History" description="Changes to this ward's rate table.">
            <AuditHistory entity="TaxConfig" entityId={cfg?.id ?? null} />
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "publish"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Publish rates for Ward ${ward?.wardNumber ?? ""}, ${year?.name ?? ""}?`}
        description={
          <span>
            New demands for this ward will be calculated with these rates. Demands, receipts and notices already published keep their original figures.
            {republish
              ? " These rates were published before, so enter the reason for the change (for example the board resolution number)."
              : ""}
          </span>
        }
        confirmLabel="Publish rates"
        requireReason={republish}
        reasonLabel="Reason for the change"
        pending={publish.isPending}
        onConfirm={(reason) => publish.mutate(reason)}
      />
      <ConfirmDialog
        open={confirm === "copy"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Copy this rate table to all wards?"
        description="Every other ward's table for this year is overwritten with these percentages and rates and becomes a draft — including wards that are published now. Those wards cannot be used for new demands until they are published again. Demands already published are not changed."
        confirmLabel="Copy to all wards"
        destructive
        pending={copy.isPending}
        onConfirm={() => copy.mutate()}
      />
    </div>
  )
}
