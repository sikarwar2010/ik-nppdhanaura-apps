"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Building2,
  Calculator,
  Download,
  MapPin,
  Search,
  Upload,
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { optionLabel, useLocale } from "@workspace/i18n"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { buildSelectItems } from "@workspace/ui/lib/select-items"

import { ConfirmDialog } from "@/components/admin/admin-ui"
import { useCan } from "@/hooks/use-permission"
import { ApiError, api } from "@/lib/api"
import { downloadAuthenticatedExport } from "@/lib/download-blob"
import { FinancialAdminPanels } from "./financial-panels"

type Ward = { id: string; name: string; number: number }

type RefEntry = {
  id: string
  code: string
  name: string
  category: { code: string }
}

type TaxCell = {
  roadWidthEntryId: string
  constructionEntryId: string
  annualRatePerSqFt: string | number | null
}

type TaxConfig = {
  configured: true
  id: string
  wardId: string
  assessmentYearId: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  version: number
  propertyTaxPct: string | number | null
  waterTaxPct: string | number | null
  drainageTaxPct: string | number | null
  penaltyPct: string | number | null
  assessablePct: string | number | null
  commercialAssessablePct: string | number | null
  publishedAt?: string | null
  previouslyPublished?: boolean
  cells: TaxCell[]
}

type TaxConfigResult =
  | TaxConfig
  | { configured: false; wardId: string; assessmentYearId: string }

type TaxPreview = {
  configured: boolean
  rateMissing: boolean
  rates: {
    annualRate: number | null
    assessablePct: string | null
    commercialAssessablePct: string | null
    propertyTaxPct: string | null
    waterTaxPct: string | null
    drainageTaxPct: string | null
    penaltyPct: string | null
  } | null
  calculation: {
    grossAlv: number
    assessableAlv: number
    propertyTax: number
    waterTax: number
    drainageTax: number
    penalty: number
    demand: number
  } | null
}

type SurveyHit = {
  id: string
  surveyId: string
  ownerName: string | null
  propertyNo: string | null
}

type OutstandingResponse = {
  propertyTax: string
  waterTax: string
  drainageTax: string
  penalty: string
  interest: string
  currentYearDemand: string
  openingArrears: string
  grossEligibleDemand?: string
  rebateAmount?: string
  rebateScope?: string
  approvedCredits: string
  paymentsAllocated: string
  totalPayable: string
  netOutstanding: string
  publishedDemandId: string | null
  authoritative: boolean
  historyComplete?: boolean
  previousPropertyTaxOutstanding?: string
  previousWaterTaxOutstanding?: string
  previousDrainageTaxOutstanding?: string
  previousPenaltyInterestOutstanding?: string
  previousRebatesCredits?: string
  previousPayments?: string
  historicalOpeningArrears?: string
  approvedDebits?: string
  years: Array<{
    assessmentYearId: string
    assessmentYearName: string
    originalDemand: string
    propertyTax?: string
    waterTax?: string
    drainageTax?: string
    balanceKind?: "COMPONENTS" | "CLOSING_ONLY"
    openingArrears?: string
    penalty?: string
    interest?: string
    payments: string
    credits: string
    rebate?: string
    outstanding: string
    closingOutstanding?: string
    verificationStatus?: string
    publishedDemandId: string | null
  }>
  unreconciledYears: Array<{ assessmentYearId: string; name: string; reason: string }>
  missingHistoryYears?: Array<{ name: string; reason: string }>
  unassignedPaymentIds: string[]
}

const GIS_USE_PREVIEW_OPTIONS = [
  { code: "R", name: "R - Residential" },
  { code: "C", name: "C - Commercial" },
  { code: "M", name: "M - Mix Property" },
  { code: "P", name: "P - Open plot" },
] as const

function needsChangeReason(config: {
  status: string
  version: number
  publishedAt?: string | null
  previouslyPublished?: boolean
}): boolean {
  return (
    config.previouslyPublished === true ||
    Boolean(config.publishedAt) ||
    config.status === "PUBLISHED" ||
    config.version > 1
  )
}

function rateNumber(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null
  const parsed = typeof v === "number" ? v : Number(v)
  return Number.isFinite(parsed) ? parsed : null
}

function rateInputValue(v: string | number | null | undefined): string {
  const parsed = rateNumber(v)
  return parsed == null ? "" : String(parsed)
}

function useDebounced<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number
) {
  const ref = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  return React.useCallback(
    (...args: Parameters<T>) => {
      if (ref.current) clearTimeout(ref.current)
      ref.current = setTimeout(() => fn(...args), ms)
    },
    [fn, ms]
  )
}

export function ReportsTaxWorkspace({
  wardId,
  propertyUse,
  from,
  to,
  onWardChange,
}: {
  wardId: string
  propertyUse: string
  from: string
  to: string
  onWardChange: (id: string) => void
}) {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [assessmentYearOverride, setAssessmentYearOverride] = React.useState("")
  const [exporting, setExporting] = React.useState(false)
  const [previewArea, setPreviewArea] = React.useState("100")
  const [previewRoadOverride, setPreviewRoadOverride] = React.useState("")
  const [previewConstructionOverride, setPreviewConstructionOverride] =
    React.useState("")
  const [previewGisUseCode, setPreviewGisUseCode] = React.useState("R")
  const [propertyQuery, setPropertyQuery] = React.useState("")
  const [ledgerSurveyId, setLedgerSurveyId] = React.useState("")
  const [creditAmount, setCreditAmount] = React.useState("")
  const [creditReason, setCreditReason] = React.useState("")
  const [publishOpen, setPublishOpen] = React.useState(false)
  const [reasonRequiredId, setReasonRequiredId] = React.useState<string | null>(null)
  const canPublishDemand = useCan("demand:publish")
  const canAdjustDemand = useCan("demand:adjust")
  const canConfigure = useCan("settings:update")
  const { locale } = useLocale()
  const refLabel = (name: string) => optionLabel(locale, name)

  const wardsQuery = useQuery({
    queryKey: ["wards"],
    queryFn: async () => (await api.get<Ward[]>("/api/v1/wards")).data,
  })

  const yearsQuery = useQuery({
    queryKey: ["ref-assessment-years"],
    queryFn: async () => {
      const res = await api.get<RefEntry[]>(
        "/api/v1/reference-entries?category=ASSESSMENT_YEAR"
      )
      return res.data ?? []
    },
  })
  const assessmentYearId =
    assessmentYearOverride || yearsQuery.data?.[0]?.id || ""

  const yearProfiles = useQuery({
    queryKey: ["assessment-year-profiles"],
    queryFn: async () => {
      const res = await api.get<
        Array<{
          id: string
          profile: { startsOn: string; endsOn: string; status: string } | null
        }>
      >("/api/v1/assessment-years")
      return res.data ?? []
    },
  })
  const selectedYearProfile = yearProfiles.data?.find(
    (year) => year.id === assessmentYearId
  )?.profile
  const yearLocked =
    selectedYearProfile?.status === "CLOSED" ||
    selectedYearProfile?.status === "ARCHIVED"

  const zonesQuery = useQuery({
    queryKey: ["ref-tax-zones"],
    queryFn: async () => {
      const res = await api.get<RefEntry[]>(
        "/api/v1/reference-entries?category=TAX_RATE_ZONE"
      )
      return res.data ?? []
    },
  })

  const constructionsQuery = useQuery({
    queryKey: ["ref-construction"],
    queryFn: async () => {
      const res = await api.get<RefEntry[]>(
        "/api/v1/reference-entries?category=CONSTRUCTION_TYPE"
      )
      return res.data ?? []
    },
  })

  React.useEffect(() => {
    if (!wardId && wardsQuery.data?.[0]) {
      onWardChange(wardsQuery.data[0].id)
    }
  }, [wardId, wardsQuery.data, onWardChange])

  const taxConfigQuery = useQuery({
    queryKey: ["tax-config", wardId, assessmentYearId],
    enabled: Boolean(wardId && assessmentYearId),
    queryFn: async () =>
      (
        await api.get<TaxConfigResult>(
          `/api/v1/tax-configs?wardId=${wardId}&assessmentYearId=${assessmentYearId}`
        )
      ).data,
  })

  const config =
    taxConfigQuery.data && taxConfigQuery.data.configured
      ? taxConfigQuery.data
      : null
  const configMissing = taxConfigQuery.data?.configured === false
  const republish =
    (config ? needsChangeReason(config) : false) ||
    (config != null && reasonRequiredId === config.id)
  const roads = React.useMemo(() => zonesQuery.data ?? [], [zonesQuery.data])
  const constructions = React.useMemo(
    () => constructionsQuery.data ?? [],
    [constructionsQuery.data]
  )
  const previewRoadId = previewRoadOverride || roads[0]?.id || ""
  const previewConstructionId =
    previewConstructionOverride || constructions[0]?.id || ""

  const assessmentYearItems = React.useMemo(
    () =>
      buildSelectItems(
        yearsQuery.data ?? [],
        (y) => y.id,
        (y) => optionLabel(locale, y.name)
      ),
    [yearsQuery.data, locale]
  )

  const taxZoneItems = React.useMemo(
    () =>
      buildSelectItems(
        roads,
        (r) => r.id,
        (r) => optionLabel(locale, r.name)
      ),
    [roads, locale]
  )

  const constructionItems = React.useMemo(
    () =>
      buildSelectItems(
        constructions,
        (c) => c.id,
        (c) => optionLabel(locale, c.name)
      ),
    [constructions, locale]
  )

  const gisUseItems = React.useMemo(
    () =>
      buildSelectItems(
        GIS_USE_PREVIEW_OPTIONS,
        (g) => g.code,
        (g) => optionLabel(locale, g.code)
      ),
    [locale]
  )

  const configIdentity = config
    ? [
      config.id,
      config.assessmentYearId,
      config.assessablePct,
      config.commercialAssessablePct,
      config.propertyTaxPct,
      config.waterTaxPct,
      config.drainageTaxPct,
      config.penaltyPct,
    ].join(":")
    : ""

  const [paramDraft, setParamDraft] = React.useState({
    assessablePct: "",
    commercialAssessablePct: "",
    propertyTaxPct: "",
    waterTaxPct: "",
    drainageTaxPct: "",
    penaltyPct: "",
  })
  const [draftSource, setDraftSource] = React.useState("")
  if (config && configIdentity !== draftSource) {
    setDraftSource(configIdentity)
    setParamDraft({
      assessablePct: rateInputValue(config.assessablePct),
      commercialAssessablePct: rateInputValue(config.commercialAssessablePct),
      propertyTaxPct: rateInputValue(config.propertyTaxPct),
      waterTaxPct: rateInputValue(config.waterTaxPct),
      drainageTaxPct: rateInputValue(config.drainageTaxPct),
      penaltyPct: rateInputValue(config.penaltyPct),
    })
  }

  const cellMap = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const c of config?.cells ?? []) {
      const rate = rateNumber(c.annualRatePerSqFt)
      if (rate == null) continue
      m.set(`${c.roadWidthEntryId}:${c.constructionEntryId}`, rate)
    }
    return m
  }, [config?.cells])

  const rememberConfig = (savedWardId: string, savedYearId: string, data: TaxConfig) => {
    qc.setQueryData(["tax-config", savedWardId, savedYearId], data)
  }

  const saveCells = useMutation({
    mutationFn: async (input: {
      wardId: string
      assessmentYearId: string
      configId: string
      cells: Array<{
        roadWidthEntryId: string
        constructionEntryId: string
        annualRatePerSqFt: number
      }>
    }) => {
      const res = await api.put<TaxConfig>(
        `/api/v1/tax-configs/${input.configId}/cells`,
        { cells: input.cells }
      )
      return res.data
    },
    onSuccess: (data, variables) => {
      rememberConfig(variables.wardId, variables.assessmentYearId, data)
    },
  })

  const saveParams = useMutation({
    mutationFn: async (input: {
      wardId: string
      assessmentYearId: string
      configId: string
      body: Record<string, number>
    }) => {
      const res = await api.patch<TaxConfig>(
        `/api/v1/tax-configs/${input.configId}`,
        input.body
      )
      return res.data
    },
    onSuccess: (data, variables) => {
      rememberConfig(variables.wardId, variables.assessmentYearId, data)
    },
  })

  const publishMut = useMutation({
    mutationFn: async (input: {
      wardId: string
      assessmentYearId: string
      configId: string
      reason?: string
    }) => {
      const res = await api.post<TaxConfig>(
        `/api/v1/tax-configs/${input.configId}/publish`,
        { reason: input.reason || undefined }
      )
      return res.data
    },
    onSuccess: (data, variables) => {
      toast.success("Tax rates published")
      setReasonRequiredId(null)
      setPublishOpen(false)
      rememberConfig(variables.wardId, variables.assessmentYearId, data)
    },
    onError: (e: Error, variables) => {
      if (e instanceof ApiError && e.code === "TAX_RATE_CHANGE_REASON_REQUIRED") {
        setReasonRequiredId(variables.configId)
        setPublishOpen(true)
      }
      toast.error(e.message)
    },
  })

  const createDraftMut = useMutation({
    mutationFn: async (input: { wardId: string; assessmentYearId: string }) => {
      const res = await api.post<TaxConfig>("/api/v1/tax-configs", input)
      return res.data
    },
    onSuccess: (data, variables) => {
      toast.success("Draft tax configuration created")
      rememberConfig(variables.wardId, variables.assessmentYearId, data)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const copyMut = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ updated: number }>(
        "/api/v1/tax-configs/copy-to-wards",
        {
          sourceWardId: wardId,
          assessmentYearId,
        }
      )
      return res.data
    },
    onSuccess: (data) => {
      toast.success(`Copied rates to ${data.updated ?? 0} wards`)
    },
  })

  const previewQuery = useQuery({
    queryKey: [
      "tax-preview",
      wardId,
      assessmentYearId,
      previewArea,
      previewRoadId,
      previewConstructionId,
      previewGisUseCode,
    ],
    enabled: Boolean(
      config && previewRoadId && previewConstructionId
    ),
    queryFn: async () =>
      (
        await api.post<TaxPreview>("/api/v1/tax-configs/preview", {
          wardId,
          assessmentYearId,
          areaSqFt: Number(previewArea) || 0,
          roadWidthEntryId: previewRoadId,
          constructionEntryId: previewConstructionId,
          gisUseCode: previewGisUseCode,
        })
      ).data,
  })

  const propertySearchQuery = useQuery({
    queryKey: ["ledger-properties", wardId, propertyQuery],
    enabled: Boolean(wardId && propertyQuery.trim().length >= 2),
    queryFn: async () => {
      const params = new URLSearchParams({
        wardId,
        search: propertyQuery.trim(),
        page: "1",
        pageSize: "8",
        status: "ACTIVE",
      })
      const res = await api.get<SurveyHit[]>(`/api/v1/surveys?${params}`)
      return res.data ?? []
    },
  })

  const outstandingQuery = useQuery({
    queryKey: ["demand-outstanding", ledgerSurveyId, assessmentYearId],
    enabled: Boolean(ledgerSurveyId && assessmentYearId),
    queryFn: async () => {
      const params = new URLSearchParams({
        surveyId: ledgerSurveyId,
        assessmentYearId,
      })
      const res = await api.get<OutstandingResponse>(
        `/api/v1/demands/outstanding?${params}`
      )
      return res.data
    },
  })

  const publishDemand = useMutation({
    mutationFn: async () => {
      await api.post("/api/v1/demands/publish", {
        surveyId: ledgerSurveyId,
        assessmentYearId,
      })
    },
    onSuccess: async () => {
      toast.success("Assessment-year demand published")
      await qc.invalidateQueries({ queryKey: ["demand-outstanding"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not publish demand")
    },
  })

  const addCredit = useMutation({
    mutationFn: async () => {
      const demandId = outstandingQuery.data?.publishedDemandId
      if (!demandId) throw new Error("Publish the demand before adding a credit")
      await api.post(`/api/v1/demands/${demandId}/adjustments`, {
        kind: "CREDIT",
        amount: creditAmount,
        reason: creditReason,
      })
    },
    onSuccess: async () => {
      toast.success("Credit recorded")
      setCreditAmount("")
      setCreditReason("")
      await qc.invalidateQueries({ queryKey: ["demand-outstanding"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not record credit")
    },
  })

  const debouncedCellSave = useDebounced(
    (roadId: string, constructionId: string, value: number) => {
      if (!config || !Number.isFinite(value)) return
      saveCells.mutate({
        wardId,
        assessmentYearId,
        configId: config.id,
        cells: [
          {
            roadWidthEntryId: roadId,
            constructionEntryId: constructionId,
            annualRatePerSqFt: value,
          },
        ],
      })
    },
    600
  )

  const filteredWards = (wardsQuery.data ?? []).filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = async () => {
    if (!wardId || !assessmentYearId) {
      toast.error("Select ward and assessment year")
      return
    }
    setExporting(true)
    try {
      const params = new URLSearchParams({
        wardId,
        assessmentYearId,
      })
      if (propertyUse.trim()) params.set("propertyUse", propertyUse.trim())
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      const ward = wardsQuery.data?.find((w) => w.id === wardId)
      await downloadAuthenticatedExport(
        `/api/v1/reports/surveys/export?${params}`,
        `ward-tax-report-${ward?.number ?? "ward"}.xlsx`
      )
      toast.success("Tax demand Excel downloaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="size-4" aria-hidden />
            Wards
          </CardTitle>
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-[420px] space-y-1 overflow-y-auto p-2 pt-0">
          {filteredWards.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${wardId === w.id ? "bg-primary/10 font-medium" : ""
                }`}
              onClick={() => onWardChange(w.id)}
            >
              {w.name}
            </button>
          ))}
        </CardContent>
      </Card>

      <div id="tax-rates" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div id="assessment-years" className="space-y-1">
            <Label htmlFor="assessment-year">Assessment year</Label>
            <Select
              value={assessmentYearId || null}
              items={assessmentYearItems}
              onValueChange={(v) => setAssessmentYearOverride(v ?? "")}
            >
              <SelectTrigger
                id="assessment-year"
                className="w-[180px] cursor-pointer"
              >
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {(yearsQuery.data ?? []).map((y) => (
                  <SelectItem
                    key={y.id}
                    value={y.id}
                    label={refLabel(y.name)}
                    className="cursor-pointer"
                  >
                    {refLabel(y.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedYearProfile ? (
              <p className="text-xs text-muted-foreground">
                {selectedYearProfile.status} · {selectedYearProfile.startsOn} to{" "}
                {selectedYearProfile.endsOn}
                {yearLocked ? " · locked" : ""}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No assessment-year dates configured yet.
              </p>
            )}
          </div>
          {config ? (
            <Badge
              variant={config.status === "PUBLISHED" ? "default" : "secondary"}
            >
              {config.status} v{config.version}
            </Badge>
          ) : null}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={!config || copyMut.isPending}
              onClick={() => copyMut.mutate()}
            >
              Copy to all wards
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={!config || publishMut.isPending}
              onClick={() => setPublishOpen(true)}
            >
              <Upload className="mr-2 size-4" aria-hidden />
              Publish
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={exporting || config?.status !== "PUBLISHED"}
              onClick={() => void handleExport()}
            >
              <Download className="mr-2 size-4" aria-hidden />
              {exporting ? "Exporting…" : "Export tax Excel"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" aria-hidden />
              Rate matrix (₹ / sq ft / year)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {taxConfigQuery.isError ? (
              <p className="text-sm text-destructive">
                Tax rates could not be loaded for this ward and assessment year.
                Missing rates are not shown as zero.
              </p>
            ) : wardId && assessmentYearId && taxConfigQuery.isFetching && !taxConfigQuery.data ? (
              <p className="text-sm text-muted-foreground">Loading saved tax rates…</p>
            ) : configMissing ? (
              <div className="space-y-3 text-sm">
                <p>
                  No tax configuration is saved for this ward and assessment year.
                  A missing configuration is not the same as a zero rate.
                </p>
                {canConfigure ? (
                  <Button
                    type="button"
                    className="cursor-pointer"
                    disabled={createDraftMut.isPending}
                    onClick={() =>
                      createDraftMut.mutate({ wardId, assessmentYearId })
                    }
                  >
                    Create draft configuration
                  </Button>
                ) : (
                  <p className="text-muted-foreground">
                    An administrator must create the configuration before rates can be entered.
                  </p>
                )}
              </div>
            ) : config ? (
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Road width</th>
                    {constructions.map((c) => (
                      <th key={c.id} className="border p-2 text-left">
                        {refLabel(c.name)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roads.map((road) => (
                    <tr key={road.id}>
                      <td className="border p-2 font-medium">{refLabel(road.name)}</td>
                      {constructions.map((c) => {
                        const key = `${road.id}:${c.id}`
                        const stored = cellMap.get(key)
                        const value = stored == null ? "" : String(stored)
                        return (
                          <td key={c.id} className="border p-1">
                            <Input
                              key={`${configIdentity}-${key}-${value}`}
                              type="number"
                              step="0.01"
                              min={0}
                              className="h-8 cursor-pointer"
                              defaultValue={value}
                              placeholder="Not set"
                              onChange={(e) => {
                                const raw = e.target.value.trim()
                                if (raw === "") return
                                const next = Number(raw)
                                if (!Number.isFinite(next)) return
                                debouncedCellSave(road.id, c.id, next)
                              }}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a ward and assessment year to load tax rates.
              </p>
            )}
          </CardContent>
        </Card>

        {config ? <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tax percentages</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["assessablePct", "Residential assessable %"],
                  ["commercialAssessablePct", "Commercial assessable %"],
                  ["propertyTaxPct", "Property tax %"],
                  ["waterTaxPct", "Water tax %"],
                  ["drainageTaxPct", "Drainage tax %"],
                  ["penaltyPct", "Penalty %"],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paramDraft[field]}
                    disabled={!config}
                    onChange={(e) =>
                      setParamDraft((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    onBlur={() => {
                      if (!config) return
                      const raw = paramDraft[field].trim()
                      if (raw === "") return
                      const next = Number(raw)
                      if (!Number.isFinite(next)) return
                      if (next === rateNumber(config[field])) return
                      saveParams.mutate({
                        wardId,
                        assessmentYearId,
                        configId: config.id,
                        body: { [field]: next },
                      })
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="size-4" aria-hidden />
                Live preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Area (sq ft)</Label>
                  <Input
                    value={previewArea}
                    onChange={(e) => setPreviewArea(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Zone</Label>
                  <Select
                    value={previewRoadId || null}
                    items={taxZoneItems}
                    onValueChange={(v) => setPreviewRoadOverride(v ?? "")}
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {roads.map((r) => (
                        <SelectItem
                          key={r.id}
                          value={r.id}
                          label={refLabel(r.name)}
                          className="cursor-pointer"
                        >
                          {refLabel(r.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>GIS Use Code</Label>
                <Select
                  value={previewGisUseCode || null}
                  items={gisUseItems}
                  onValueChange={(v) => setPreviewGisUseCode(v ?? "R")}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="GIS Use Code" />
                  </SelectTrigger>
                  <SelectContent>
                    {GIS_USE_PREVIEW_OPTIONS.map((g) => (
                      <SelectItem
                        key={g.code}
                        value={g.code}
                        label={optionLabel(locale, g.code)}
                        className="cursor-pointer"
                      >
                        {optionLabel(locale, g.code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Construction</Label>
                <Select
                  value={previewConstructionId || null}
                  items={constructionItems}
                  onValueChange={(v) => setPreviewConstructionOverride(v ?? "")}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Construction" />
                  </SelectTrigger>
                  <SelectContent>
                    {constructions.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        label={refLabel(c.name)}
                        className="cursor-pointer"
                      >
                        {refLabel(c.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {previewQuery.isError ? (
                <p className="text-destructive">
                  Live preview could not be loaded. It is not using zero rates.
                </p>
              ) : null}
              {previewQuery.data?.rateMissing ? (
                <p>
                  No rate is saved for this zone and construction in the selected
                  assessment year. A missing rate is not treated as zero.
                </p>
              ) : null}
              {previewQuery.data?.calculation && previewQuery.data.rates ? (
                <dl className="grid grid-cols-2 gap-2 rounded-md bg-muted/50 p-3">
                  <div>
                    <dt className="text-muted-foreground">Monthly rate</dt>
                    <dd>{previewQuery.data.rates.annualRate}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Property tax %</dt>
                    <dd>{rateInputValue(previewQuery.data.rates.propertyTaxPct)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Water tax %</dt>
                    <dd>{rateInputValue(previewQuery.data.rates.waterTaxPct)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Drainage tax %</dt>
                    <dd>{rateInputValue(previewQuery.data.rates.drainageTaxPct)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Penalty %</dt>
                    <dd>{rateInputValue(previewQuery.data.rates.penaltyPct)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Property tax</dt>
                    <dd>{previewQuery.data.calculation.propertyTax.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Water tax</dt>
                    <dd>{previewQuery.data.calculation.waterTax.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Drainage tax</dt>
                    <dd>{previewQuery.data.calculation.drainageTax.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Penalty</dt>
                    <dd>{previewQuery.data.calculation.penalty.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Total demand</dt>
                    <dd className="font-semibold">
                      {previewQuery.data.calculation.demand.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </CardContent>
          </Card>
        </div> : null}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Arrears and outstanding / बकाया एवं देय
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Previous-year arrears are loaded from the property ledger. They
              are not part of the rate matrix or the ALV preview above.
            </p>
            <div className="space-y-1">
              <Label>Property ID / संपत्ति आईडी</Label>
              <Input
                value={propertyQuery}
                placeholder="Search property ID or owner"
                onChange={(e) => setPropertyQuery(e.target.value)}
              />
            </div>
            {propertySearchQuery.isFetching ? (
              <p className="text-muted-foreground">Searching properties…</p>
            ) : null}
            {propertySearchQuery.isError ? (
              <p className="text-destructive">Could not search properties.</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {(propertySearchQuery.data ?? []).map((hit) => (
                <Button
                  key={hit.id}
                  type="button"
                  size="sm"
                  variant={ledgerSurveyId === hit.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setLedgerSurveyId(hit.id)}
                >
                  {hit.surveyId}
                  {hit.ownerName ? ` · ${hit.ownerName}` : ""}
                </Button>
              ))}
            </div>
            {!ledgerSurveyId ? (
              <p className="text-muted-foreground">
                Select a property to load year-wise arrears.
              </p>
            ) : outstandingQuery.isLoading ? (
              <p className="text-muted-foreground">Loading ledger…</p>
            ) : outstandingQuery.isError ? (
              <p className="text-destructive">
                {outstandingQuery.error instanceof Error
                  ? outstandingQuery.error.message
                  : "Could not load the outstanding balance."}
              </p>
            ) : outstandingQuery.data ? (
              <div className="space-y-3">
                {!outstandingQuery.data.authoritative ? (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive">
                    Historical balances cannot be confirmed.
                    {outstandingQuery.data.unreconciledYears.length > 0
                      ? ` Unreconciled years: ${outstandingQuery.data.unreconciledYears
                        .map((year) => year.name)
                        .join(", ")}.`
                      : ""}
                    {outstandingQuery.data.unassignedPaymentIds.length > 0
                      ? " Successful payments without an assessment year are excluded and are not treated as zero."
                      : " Missing demands are excluded from the total and are not treated as zero."}
                    {(outstandingQuery.data.missingHistoryYears ?? []).length > 0
                      ? ` Missing verified years: ${outstandingQuery.data.missingHistoryYears
                        ?.map((year) => year.name)
                        .join(", ")}.`
                      : ""}
                  </p>
                ) : null}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Assessment year</th>
                        <th className="border p-2 text-right">Property tax</th>
                        <th className="border p-2 text-right">Water tax</th>
                        <th className="border p-2 text-right">Drainage tax</th>
                        <th className="border p-2 text-right">Penalty and interest</th>
                        <th className="border p-2 text-right">Rebate/credits</th>
                        <th className="border p-2 text-right">Payments</th>
                        <th className="border p-2 text-right">Outstanding</th>
                        <th className="border p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstandingQuery.data.years.length === 0 ? (
                        <tr>
                          <td className="border p-2" colSpan={9}>
                            No published year-wise demands on the ledger.
                          </td>
                        </tr>
                      ) : (
                        outstandingQuery.data.years.map((year) => {
                          const closingOnly = year.balanceKind === "CLOSING_ONLY"
                          return (
                            <tr key={year.assessmentYearId}>
                              <td className="border p-2">
                                {year.assessmentYearName}
                                {closingOnly ? " · Historical opening arrears" : ""}
                              </td>
                              <td className="border p-2 text-right">
                                {closingOnly ? "—" : (year.propertyTax ?? "—")}
                              </td>
                              <td className="border p-2 text-right">
                                {closingOnly ? "—" : (year.waterTax ?? "—")}
                              </td>
                              <td className="border p-2 text-right">
                                {closingOnly ? "—" : (year.drainageTax ?? "—")}
                              </td>
                              <td className="border p-2 text-right">
                                {closingOnly
                                  ? "—"
                                  : (
                                    Number(year.penalty ?? 0) +
                                    Number(year.interest ?? 0)
                                  ).toFixed(2)}
                              </td>
                              <td className="border p-2 text-right">
                                {closingOnly
                                  ? "—"
                                  : (
                                    Number(year.credits) + Number(year.rebate ?? 0)
                                  ).toFixed(2)}
                              </td>
                              <td className="border p-2 text-right">
                                {closingOnly ? "—" : year.payments}
                              </td>
                              <td className="border p-2 text-right">{year.outstanding}</td>
                              <td className="border p-2">
                                {year.publishedDemandId
                                  ? year.verificationStatus === "UNVERIFIED"
                                    ? "Unverified"
                                    : "Verified"
                                  : "Preview"}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ["Previous-year property tax outstanding", outstandingQuery.data.authoritative ? (outstandingQuery.data.previousPropertyTaxOutstanding ?? "0.00") : "Not confirmed"],
                      ["Previous-year water tax outstanding", outstandingQuery.data.authoritative ? (outstandingQuery.data.previousWaterTaxOutstanding ?? "0.00") : "Not confirmed"],
                      ["Previous-year drainage tax outstanding", outstandingQuery.data.authoritative ? (outstandingQuery.data.previousDrainageTaxOutstanding ?? "0.00") : "Not confirmed"],
                      ["Previous-year penalty and interest", outstandingQuery.data.authoritative ? (outstandingQuery.data.previousPenaltyInterestOutstanding ?? "0.00") : "Not confirmed"],
                      ["Previous-year rebates/credits", outstandingQuery.data.authoritative ? (outstandingQuery.data.previousRebatesCredits ?? "0.00") : "Not confirmed"],
                      ["Previous-year payments", outstandingQuery.data.authoritative ? (outstandingQuery.data.previousPayments ?? "0.00") : "Not confirmed"],
                      ["Total previous-year arrears", outstandingQuery.data.authoritative ? outstandingQuery.data.openingArrears : "Not confirmed"],
                      ["Current-year property tax", outstandingQuery.data.propertyTax],
                      ["Current-year water tax", outstandingQuery.data.waterTax],
                      ["Current-year drainage tax", outstandingQuery.data.drainageTax],
                      ["Applicable penalty", outstandingQuery.data.penalty],
                      ["Applicable interest", outstandingQuery.data.interest],
                      ["Other authorized charges", outstandingQuery.data.approvedDebits ?? "0.00"],
                      ["Gross eligible demand", outstandingQuery.data.authoritative ? (outstandingQuery.data.grossEligibleDemand ?? outstandingQuery.data.totalPayable) : "Not confirmed"],
                      ["Department rebate", outstandingQuery.data.rebateAmount ?? "0.00"],
                      ["Approved credits", outstandingQuery.data.approvedCredits],
                      ["Payments allocated", outstandingQuery.data.paymentsAllocated],
                      ["Total payable demand", outstandingQuery.data.authoritative ? outstandingQuery.data.totalPayable : "Not confirmed"],
                      ["Net outstanding", outstandingQuery.data.authoritative ? outstandingQuery.data.netOutstanding : "Not confirmed"],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-md bg-muted/50 p-3">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-semibold">
                        {value === "Not confirmed" ? value : `₹ ${value}`}
                      </dd>
                    </div>
                  ))}
                </dl>
                {canPublishDemand.allowed ? (
                  <Button
                    type="button"
                    className="cursor-pointer"
                    disabled={
                      publishDemand.isPending ||
                      Boolean(outstandingQuery.data.publishedDemandId) ||
                      !outstandingQuery.data.authoritative ||
                      yearLocked
                    }
                    onClick={() => publishDemand.mutate()}
                  >
                    {outstandingQuery.data.publishedDemandId
                      ? "Demand already published"
                      : "Publish property demand"}
                  </Button>
                ) : null}
                {canAdjustDemand.allowed && outstandingQuery.data.publishedDemandId ? (
                  <div className="grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
                    <Input
                      value={creditAmount}
                      placeholder="0.00"
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                    <Input
                      value={creditReason}
                      placeholder="Credit reason"
                      onChange={(e) => setCreditReason(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      disabled={addCredit.isPending}
                      onClick={() => addCredit.mutate()}
                    >
                      Record credit
                    </Button>
                  </div>
                ) : null}
                <FinancialAdminPanels
                  assessmentYearId={assessmentYearId}
                  surveyId={ledgerSurveyId}
                  canAdjust={canAdjustDemand.allowed}
                  canConfigure={canConfigure.allowed}
                  yearLocked={yearLocked}
                  publishedDemandId={outstandingQuery.data.publishedDemandId}
                  verificationStatus={
                    outstandingQuery.data.years.find(
                      (year) => year.assessmentYearId === assessmentYearId
                    )?.verificationStatus
                  }
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish these tax rates?"
        description={
          republish
            ? "These rates were published before. Enter the reason for the change (for example the board resolution number). New demands will use this version. Demands, receipts and notices already published keep their original figures."
            : "New demands for this ward will use these rates. Demands, receipts and notices already published keep their original figures."
        }
        confirmLabel="Publish rates"
        requireReason={republish}
        reasonLabel="Reason for the change"
        pending={publishMut.isPending}
        onConfirm={(reason) => {
          if (!config) return
          publishMut.mutate({
            wardId,
            assessmentYearId,
            configId: config.id,
            reason,
          })
        }}
      />
    </div>
  )
}
