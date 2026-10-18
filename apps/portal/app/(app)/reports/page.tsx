"use client"

import { useQuery } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { api } from "@/lib/api"
import { downloadAuthenticatedExport } from "@/lib/download-blob"
import { useLocale } from "@workspace/i18n"

import {
  FilterControlPanel,
  type ReportFilters,
} from "./_components/filter-control-panel"
import { ReportKpis } from "./_components/report-kpis"
import { VisualReportBuilder } from "./_components/visual-report-builder"

type Ward = { id: string; name: string; number: number }

type RefEntry = { id: string; code: string; name: string }

export default function ReportBuilderPage() {
  const { t } = useLocale()
  const [filters, setFilters] = React.useState<ReportFilters>({
    wardId: "",
    propertyUse: "",
    from: "",
    to: "",
    autoFilter: false,
  })

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

  const assessmentYearId = yearsQuery.data?.[0]?.id ?? ""

  const taxConfigQuery = useQuery({
    queryKey: ["tax-config", filters.wardId, assessmentYearId],
    enabled: Boolean(filters.wardId && assessmentYearId),
    queryFn: async () =>
      (
        await api.get<
          | { configured: true; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }
          | { configured: false }
        >(
          `/api/v1/tax-configs?wardId=${filters.wardId}&assessmentYearId=${assessmentYearId}`
        )
      ).data,
  })

  const surveysQuery = useQuery({
    queryKey: ["report-surveys", filters.wardId, filters.propertyUse, filters.from, filters.to],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.wardId) params.set("wardId", filters.wardId)
      if (filters.propertyUse.trim()) params.set("propertyUse", filters.propertyUse.trim())
      if (filters.from) params.set("from", filters.from)
      if (filters.to) params.set("to", filters.to)
      const qs = params.toString()
      return (
        await api.get<{ total: number }>(`/api/v1/reports/surveys${qs ? `?${qs}` : ""}`)
      ).data
    },
  })

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", filters.wardId || "all"],
    queryFn: async () => {
      const qs = filters.wardId ? `?wardId=${filters.wardId}` : ""
      return (
        await api.get<{
          totalProperties: number
          completeQuality: number
          needsReviewQuality: number
          totalWards: number
        }>(`/api/v1/dashboard/summary${qs}`)
      ).data
    },
  })

  const kpiData = dashboardQuery.data
    ? {
      surveysInScope: surveysQuery.data?.total ?? dashboardQuery.data.totalProperties,
      completeQuality: dashboardQuery.data.completeQuality,
      needsReview: dashboardQuery.data.needsReviewQuality,
      totalWards: dashboardQuery.data.totalWards,
    }
    : undefined

  const taxPublished =
    taxConfigQuery.data?.configured === true &&
    taxConfigQuery.data.status === "PUBLISHED"

  const buildExportParams = () => {
    const params = new URLSearchParams()
    if (filters.wardId) params.set("wardId", filters.wardId)
    if (filters.propertyUse.trim()) params.set("propertyUse", filters.propertyUse.trim())
    if (filters.from) params.set("from", filters.from)
    if (filters.to) params.set("to", filters.to)
    if (filters.autoFilter) params.set("autoFilter", "1")
    return params
  }

  const handleExportSurvey = async () => {
    const params = buildExportParams()
    params.set("template", "import")
    const ward = wardsQuery.data?.find((w) => w.id === filters.wardId)
    try {
      await downloadAuthenticatedExport(
        `/api/v1/reports/surveys/export?${params}`,
        `survey-report-${ward?.number ?? "all"}.xlsx`
      )
      toast.success(t("reports.downloaded"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("reports.exportFailed"))
    }
  }

  const handleExportGis = async () => {
    const params = buildExportParams()
    params.set("template", "dhanaura-gis")
    const ward = wardsQuery.data?.find((w) => w.id === filters.wardId)
    try {
      await downloadAuthenticatedExport(
        `/api/v1/reports/surveys/export?${params}`,
        `survey-gis-${ward?.number ?? "all"}.xlsx`
      )
      toast.success(t("reports.gisDownloaded"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("reports.exportFailed"))
    }
  }

  const handleExportTax = async () => {
    if (!filters.wardId || !assessmentYearId) {
      toast.error(t("reports.taxRequired"))
      return
    }
    if (!taxPublished) {
      toast.error(t("reports.publishFirst"))
      return
    }
    const params = buildExportParams()
    params.set("assessmentYearId", assessmentYearId)
    const ward = wardsQuery.data?.find((w) => w.id === filters.wardId)
    try {
      await downloadAuthenticatedExport(
        `/api/v1/reports/surveys/export?${params}`,
        `ward-tax-report-${ward?.number ?? "ward"}.xlsx`
      )
      toast.success(t("reports.taxDownloaded"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("reports.exportFailed"))
    }
  }

  return (
    <div className="space-y-6">
      <FilterControlPanel
        filters={filters}
        onChange={setFilters}
        wards={wardsQuery.data ?? []}
      />

      <ReportKpis data={kpiData} />

      <VisualReportBuilder
        filters={filters}
        taxPublished={taxPublished}
        onExportSurvey={handleExportSurvey}
        onExportTax={handleExportTax}
        onExportGis={handleExportGis}
      />
    </div>
  )
}
