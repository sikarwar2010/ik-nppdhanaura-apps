"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CheckSquare,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Printer,
  Square,
  XSquare,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
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

import { api, ApiError } from "@/lib/api"
import {
  citizenPropertyTaxUrl,
  getCitizenWebDisplayHost,
} from "@/lib/citizen-web-url"
import { formatParcelNo } from "@/lib/survey-format"

type Ward = { id: string; name: string; number: number }
type YearEntry = { id: string; code: string; name: string }

type CandidateRow = {
  id: string
  surveyId: string
  ownerName: string | null
  parcelNo: string | null
  ward: { id: string; number: number; name: string } | null
}

type ValidationError = {
  surveyId: string
  parcelNo: string | null
  propertyCuid: string
  error: string
}

type ValidationResult = {
  selected: number
  valid: number
  invalid: number
  validIds: string[]
  errors: ValidationError[]
}

type DemandNoticeJob = {
  id: string
  status: string
  uiStatus: string
  propertyCount: number
  processedCount: number
  pageCount: number | null
  failedCount: number
  errorMessage: string | null
  fileName: string | null
  downloadUrl: string | null
  errorDownloadUrl: string | null
  paperSize: string
  orientation: string
  batchId: string | null
  batchIndex: number | null
  batchTotal: number | null
  createdAt: string
  completedAt: string | null
}

function statusBadgeVariant(
  uiStatus: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (uiStatus) {
    case "COMPLETED":
      return "default"
    case "FAILED":
      return "destructive"
    case "CANCELLED":
      return "outline"
    default:
      return "secondary"
  }
}

async function fetchPreviewHtml(params: {
  surveyId: string
  assessmentYearId: string
  wardId?: string
  logoUrl?: string
}): Promise<string> {
  const qs = new URLSearchParams()
  qs.set("surveyId", params.surveyId)
  qs.set("assessmentYearId", params.assessmentYearId)
  if (params.wardId) qs.set("wardId", params.wardId)
  if (params.logoUrl) qs.set("logoUrl", params.logoUrl)
  qs.set("websiteDisplayHost", getCitizenWebDisplayHost())
  const res = await fetch(
    `/api/v1/reports/demand-notices/preview?${qs.toString()}`,
    { credentials: "include" }
  )
  if (!res.ok) {
    let message = "Failed to load notice preview"
    try {
      const json = (await res.json()) as {
        error?: { message?: string }
        message?: string
      }
      message = json.error?.message ?? json.message ?? message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return res.text()
}

function openHtmlPrint(html: string) {
  const w = window.open("", "_blank")
  if (!w) {
    toast.error("Popup blocked. Please allow popups for this site.")
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  void (async () => {
    const imgs = Array.from(w.document.images)
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve()
              return
            }
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
      )
    )
    w.print()
  })()
}

export default function NoticePage() {
  const [wardId, setWardId] = React.useState("")
  const [assessmentYearId, setAssessmentYearId] = React.useState("")
  const [parcelFilter, setParcelFilter] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [validation, setValidation] = React.useState<ValidationResult | null>(
    null
  )
  const [activeJobIds, setActiveJobIds] = React.useState<string[]>([])
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const wardsQuery = useQuery({
    queryKey: ["wards"],
    queryFn: async () => (await api.get<Ward[]>("/api/v1/wards")).data,
  })

  const yearsQuery = useQuery({
    queryKey: ["assessment-years"],
    queryFn: async () =>
      (
        await api.get<YearEntry[]>(
          "/api/v1/reference-entries?category=ASSESSMENT_YEAR"
        )
      ).data,
  })

  React.useEffect(() => {
    if (!assessmentYearId && yearsQuery.data?.[0]) {
      setAssessmentYearId(yearsQuery.data[0].id)
    }
  }, [yearsQuery.data, assessmentYearId])

  const wardSelectItems = React.useMemo(
    () =>
      buildSelectItems(
        wardsQuery.data ?? [],
        (w) => w.id,
        (w) => w.name
      ),
    [wardsQuery.data]
  )

  const yearSelectItems = React.useMemo(
    () =>
      buildSelectItems(
        yearsQuery.data ?? [],
        (y) => y.id,
        (y) => y.name || y.code
      ),
    [yearsQuery.data]
  )

  const candidatesEnabled = Boolean(wardId && assessmentYearId)

  const candidatesQuery = useQuery({
    queryKey: [
      "demand-notice-candidates",
      wardId,
      assessmentYearId,
      parcelFilter,
      search,
      page,
    ],
    enabled: candidatesEnabled,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set("wardId", wardId)
      params.set("assessmentYearId", assessmentYearId)
      params.set("page", String(page))
      params.set("pageSize", "50")
      if (parcelFilter.trim()) params.set("parcelNo", parcelFilter.trim())
      if (search.trim()) params.set("q", search.trim())
      const res = await api.get<{
        items: CandidateRow[]
        propertiesFound: number
      }>(`/api/v1/reports/demand-notices/candidates?${params}`)
      const meta = res.meta as
        | {
          total: number
          page: number
          pageSize: number
          totalPages: number
        }
        | undefined
      return { data: res.data, meta }
    },
  })

  const rows = candidatesQuery.data?.data.items ?? []
  const propertiesFound = candidatesQuery.data?.data.propertiesFound ?? 0
  const meta = candidatesQuery.data?.meta

  const jobQuery = useQuery({
    queryKey: ["demand-notice-jobs", activeJobIds],
    enabled: activeJobIds.length > 0,
    refetchInterval: (q) => {
      const jobs = q.state.data
      if (!jobs?.length) return 2000
      const busy = jobs.some(
        (j) =>
          j.uiStatus === "QUEUED" ||
          j.status === "PENDING" ||
          j.uiStatus === "PROCESSING"
      )
      return busy ? 2000 : false
    },
    queryFn: async () => {
      const results = await Promise.all(
        activeJobIds.map(
          async (id) =>
            (
              await api.get<DemandNoticeJob>(
                `/api/v1/reports/demand-notices/jobs/${id}`
              )
            ).data
        )
      )
      return results.sort(
        (a, b) => (a.batchIndex ?? 0) - (b.batchIndex ?? 0)
      )
    },
  })

  const jobs = jobQuery.data ?? []
  const job = jobs[0]
  const batchTotalProperties = jobs.reduce(
    (sum, j) => sum + (j.propertyCount ?? 0),
    0
  )
  const batchProcessed = jobs.reduce(
    (sum, j) => sum + (j.processedCount ?? 0),
    0
  )
  const anyJobBusy = jobs.some(
    (j) =>
      j.uiStatus === "QUEUED" ||
      j.status === "PENDING" ||
      j.uiStatus === "PROCESSING"
  )

  React.useEffect(() => {
    setSelected(new Set())
    setValidation(null)
    setPage(1)
  }, [wardId, assessmentYearId, parcelFilter, search])

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setValidation(null)
  }

  const selectAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const row of rows) next.add(row.id)
      return next
    })
    setValidation(null)
  }

  const clearSelection = () => {
    setSelected(new Set())
    setValidation(null)
  }

  const selectAllWard = async () => {
    if (!wardId || !assessmentYearId) return
    try {
      const allIds: string[] = []
      let p = 1
      let totalPages = 1
      // pageSize 100 → up to 200 pages covers 20k properties (API max selection 10k)
      do {
        const params = new URLSearchParams()
        params.set("wardId", wardId)
        params.set("assessmentYearId", assessmentYearId)
        params.set("page", String(p))
        params.set("pageSize", "100")
        if (parcelFilter.trim()) params.set("parcelNo", parcelFilter.trim())
        if (search.trim()) params.set("q", search.trim())
        const res = await api.get<{
          items: CandidateRow[]
          propertiesFound: number
        }>(`/api/v1/reports/demand-notices/candidates?${params}`)
        for (const item of res.data.items) allIds.push(item.id)
        const pageMeta = res.meta as { totalPages?: number } | undefined
        totalPages = pageMeta?.totalPages ?? 1
        p += 1
      } while (p <= totalPages && p <= 200)
      setSelected(new Set(allIds))
      setValidation(null)
      toast.success(`Selected ${allIds.length} properties`)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to select all properties"
      )
    }
  }

  const validateMutation = useMutation({
    mutationFn: async () => {
      const ids = [...selected]
      if (ids.length === 0) throw new Error("Select at least one property")
      const res = await api.post<ValidationResult>(
        "/api/v1/reports/demand-notices/validate",
        {
          wardId,
          assessmentYearId,
          surveyIds: ids,
        }
      )
      return res.data
    },
    onSuccess: (data) => {
      setValidation(data)
      if (data.invalid === 0) {
        toast.success(`All ${data.valid} properties are valid`)
      } else {
        toast.warning(`${data.valid} valid, ${data.invalid} invalid`)
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Validation failed")
    },
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      const ids = [...selected]
      if (ids.length === 0) throw new Error("Select at least one property")
      if (validation && validation.invalid > 0) {
        throw new Error("Resolve validation errors before generating")
      }
      if (!validation) {
        const check = await api.post<ValidationResult>(
          "/api/v1/reports/demand-notices/validate",
          { wardId, assessmentYearId, surveyIds: ids }
        )
        setValidation(check.data)
        if (check.data.invalid > 0) {
          throw new Error(
            `${check.data.invalid} properties are invalid. Fix errors before generating.`
          )
        }
      }
      const res = await api.post<DemandNoticeJob>(
        "/api/v1/reports/demand-notices/jobs",
        {
          wardId,
          assessmentYearId,
          surveyIds: ids,
          paperSize: "A4",
          orientation: "portrait",
          sortBy: "parcelNo",
        }
      )
      const metaJobs = (res.meta?.jobs as DemandNoticeJob[] | undefined) ?? null
      const jobList =
        metaJobs && metaJobs.length > 0 ? metaJobs : res.data ? [res.data] : []
      return {
        jobs: jobList,
        chunked: Boolean(res.meta?.chunked),
        chunkCount: Number(res.meta?.chunkCount ?? jobList.length),
        totalProperties: Number(
          res.meta?.totalProperties ?? jobList[0]?.propertyCount ?? ids.length
        ),
      }
    },
    onSuccess: (data) => {
      setActiveJobIds(data.jobs.map((j) => j.id))
      if (data.chunked && data.chunkCount > 1) {
        toast.success(
          `Queued ${data.chunkCount} PDF parts for ${data.totalProperties} properties (max 1000 per file)`
        )
      } else {
        const first = data.jobs[0]
        toast.success(
          first?.uiStatus === "QUEUED" || first?.status === "PENDING"
            ? "Demand notice PDF job queued"
            : "Demand notice job started"
        )
      }
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Generate failed")
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.all(
        activeJobIds.map(async (jobId) => {
          try {
            return (
              await api.post<DemandNoticeJob>(
                `/api/v1/reports/demand-notices/jobs/${jobId}/cancel`,
                {}
              )
            ).data
          } catch {
            return null
          }
        })
      )
      return results.filter(Boolean)
    },
    onSuccess: () => {
      toast.message("Job cancelled")
      void jobQuery.refetch()
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Cancel failed")
    },
  })

  const handlePreviewOrPrint = async (
    row: CandidateRow,
    mode: "preview" | "print"
  ) => {
    if (!assessmentYearId) {
      toast.error("Select an assessment year")
      return
    }
    setBusyId(`${mode}-${row.id}`)
    try {
      const logoUrl = `${window.location.origin}/branding/up-government-logo.png`
      const html = await fetchPreviewHtml({
        surveyId: row.id,
        assessmentYearId,
        wardId: wardId || undefined,
        logoUrl,
      })
      if (mode === "preview") {
        const w = window.open("", "_blank")
        if (!w) {
          toast.error("Popup blocked. Please allow popups for this site.")
          return
        }
        w.document.write(html)
        w.document.close()
      } else {
        openHtmlPrint(html)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load notice")
    } finally {
      setBusyId(null)
    }
  }

  const generating =
    generateMutation.isPending || anyJobBusy

  const canGenerate =
    selected.size > 0 &&
    Boolean(wardId && assessmentYearId) &&
    !generating &&
    (!validation || validation.invalid === 0)

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="flex flex-col gap-2 pt-(--card-spacing) sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Bulk Property Tax Demand Notices use the same tax calculation as
            citizen dues. Output is A4 portrait PDF (one property per page).
            Large wards are split automatically into files of up to 1,000
            properties each (example: 5,000 properties → 5 PDF downloads).
          </p>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 cursor-pointer"
            render={
              <a
                href={citizenPropertyTaxUrl()}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Open citizen pay portal
            <ExternalLink className="size-3.5" aria-hidden />
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Property Tax Demand Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="w-52 space-y-1">
            <Label className="text-xs text-muted-foreground">
              Assessment Year
            </Label>
            <Select
              value={assessmentYearId || null}
              items={yearSelectItems}
              onValueChange={(v) => setAssessmentYearId(v ?? "")}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {(yearsQuery.data ?? []).map((y) => (
                  <SelectItem
                    key={y.id}
                    value={y.id}
                    label={y.name || y.code}
                    className="cursor-pointer"
                  >
                    {y.name || y.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-52 space-y-1">
            <Label className="text-xs text-muted-foreground">Ward</Label>
            <Select
              value={wardId || null}
              items={wardSelectItems}
              onValueChange={(v) => setWardId(v ?? "")}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent>
                {(wardsQuery.data ?? []).map((w) => (
                  <SelectItem
                    key={w.id}
                    value={w.id}
                    label={w.name}
                    className="cursor-pointer"
                  >
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-44 space-y-1">
            <Label className="text-xs text-muted-foreground">
              Parcel Number
            </Label>
            <Input
              placeholder="Optional filter"
              value={parcelFilter}
              onChange={(e) => setParcelFilter(e.target.value)}
            />
          </div>
          <div className="w-56 space-y-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              placeholder="Owner, property ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col justify-end gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Output</span>
            <span className="font-medium">Combined PDF · A4 · Portrait</span>
            <span className="text-xs text-muted-foreground">
              Sort: Parcel Number (natural)
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-2 pt-(--card-spacing)">
          <Badge variant="secondary">
            Properties found: {candidatesEnabled ? propertiesFound : "—"}
          </Badge>
          <Badge variant="outline">Selected: {selected.size}</Badge>
          {validation && (
            <>
              <Badge variant="default">Valid: {validation.valid}</Badge>
              <Badge
                variant={validation.invalid > 0 ? "destructive" : "secondary"}
              >
                Invalid: {validation.invalid}
              </Badge>
            </>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={!candidatesEnabled || rows.length === 0}
              onClick={selectAllOnPage}
            >
              <CheckSquare className="size-3.5" />
              Select page
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={!candidatesEnabled || propertiesFound === 0}
              onClick={() => void selectAllWard()}
            >
              Select all
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={selected.size === 0}
              onClick={clearSelection}
            >
              <Square className="size-3.5" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={selected.size === 0 || validateMutation.isPending}
              onClick={() => validateMutation.mutate()}
            >
              {validateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileText className="size-3.5" />
              )}
              Validate
            </Button>
            <Button
              size="sm"
              className="cursor-pointer"
              disabled={!canGenerate}
              onClick={() => generateMutation.mutate()}
            >
              {generating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Generate PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {jobs.length > 0 && (
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              Generation job
              {jobs.length > 1 ? (
                <Badge variant="secondary">
                  {jobs.length} PDF parts
                </Badge>
              ) : (
                <Badge variant={statusBadgeVariant(job?.uiStatus ?? "QUEUED")}>
                  {job?.uiStatus}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Properties: {batchTotalProperties} · Processed: {batchProcessed}
              {jobs.length > 1
                ? ` · Split into ${jobs.length} files (1000 properties max per PDF)`
                : ""}
            </p>
            <div className="space-y-3">
              {jobs.map((part) => (
                <div
                  key={part.id}
                  className="rounded-lg border border-border/70 p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {part.batchTotal && part.batchTotal > 1
                        ? `Part ${part.batchIndex ?? "?"} of ${part.batchTotal}`
                        : "PDF"}
                    </span>
                    <Badge variant={statusBadgeVariant(part.uiStatus)}>
                      {part.uiStatus}
                    </Badge>
                    <span className="text-muted-foreground">
                      {part.processedCount}/{part.propertyCount}
                      {part.pageCount != null ? ` · Pages: ${part.pageCount}` : ""}
                      {part.failedCount > 0
                        ? ` · Failed: ${part.failedCount}`
                        : ""}
                    </span>
                  </div>
                  {part.errorMessage && (
                    <p className="mb-2 text-destructive">{part.errorMessage}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {part.downloadUrl && (
                      <>
                        <Button
                          size="sm"
                          className="cursor-pointer"
                          render={
                            <a
                              href={part.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={part.fileName ?? undefined}
                            />
                          }
                        >
                          <Download className="size-3.5" />
                          Download
                          {part.batchTotal && part.batchTotal > 1
                            ? ` part ${part.batchIndex}`
                            : " PDF"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          render={
                            <a
                              href={part.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        >
                          <Printer className="size-3.5" />
                          Open / Print
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {anyJobBusy && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                <XSquare className="size-3.5" />
                Cancel all
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {validation && validation.errors.length > 0 && (
        <Card className="rounded-xl border border-destructive/30 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive">
              Validation errors
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">
                    Property ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium">Parcel</th>
                  <th className="px-4 py-2 text-left font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {validation.errors.map((e) => (
                  <tr key={e.propertyCuid} className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">{e.surveyId}</td>
                    <td className="px-4 py-2">{e.parcelNo ?? "—"}</td>
                    <td className="px-4 py-2">{e.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-x-auto rounded-xl border shadow-sm">
        <CardContent className="p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-3 py-2" />
                <th className="px-4 py-2 text-left font-medium">Property ID</th>
                <th className="px-4 py-2 text-left font-medium">Parcel</th>
                <th className="px-4 py-2 text-left font-medium">Owner</th>
                <th className="px-4 py-2 text-left font-medium">Ward</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!candidatesEnabled && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Select assessment year and ward to list properties.
                  </td>
                </tr>
              )}
              {candidatesEnabled &&
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/30"
                  >
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={() => toggleOne(row.id)}
                        aria-label={`Select ${row.surveyId}`}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {row.surveyId}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {formatParcelNo(row.parcelNo, row.surveyId)}
                    </td>
                    <td className="px-4 py-2">{row.ownerName ?? "—"}</td>
                    <td className="px-4 py-2">{row.ward?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 cursor-pointer p-0"
                          render={<Link href={`/surveys/${row.id}`} />}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 cursor-pointer p-0"
                          title="Preview notice"
                          disabled={busyId === `preview-${row.id}`}
                          onClick={() =>
                            void handlePreviewOrPrint(row, "preview")
                          }
                        >
                          {busyId === `preview-${row.id}` ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <FileText className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 cursor-pointer p-0"
                          title="Print notice"
                          disabled={busyId === `print-${row.id}`}
                          onClick={() =>
                            void handlePreviewOrPrint(row, "print")
                          }
                        >
                          {busyId === `print-${row.id}` ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Printer className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              {candidatesEnabled && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {candidatesQuery.isLoading
                      ? "Loading..."
                      : candidatesQuery.isError
                        ? "Failed to load properties (publish tax rates for this ward/year if needed)."
                        : "No properties found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.total} records)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
