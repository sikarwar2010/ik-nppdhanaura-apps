"use client"

import {
  Building2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  ScrollText,
  Trash2,
  Upload,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { formatLocaleDate, useLocale } from "@workspace/i18n"
import type { ReportFilters } from "./filter-control-panel"

type ReportCard = {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  actions: Array<{
    label: string
    variant?: "default" | "outline"
    onClick?: () => void
    href?: string
    disabled?: boolean
    disabledReason?: string
  }>
}

type RecentExport = { id: string; name: string; date: string }

function getRecentExports(): RecentExport[] {
  try {
    const raw = localStorage.getItem("chhata:recent-exports")
    return raw ? (JSON.parse(raw) as RecentExport[]) : []
  } catch {
    return []
  }
}

function addRecentExport(name: string) {
  const list = getRecentExports()
  const next = [
    { id: crypto.randomUUID(), name, date: new Date().toISOString() },
    ...list,
  ].slice(0, 5)
  localStorage.setItem("chhata:recent-exports", JSON.stringify(next))
  return next
}

function removeRecentExport(id: string) {
  const list = getRecentExports().filter((e) => e.id !== id)
  localStorage.setItem("chhata:recent-exports", JSON.stringify(list))
  return list
}

export function VisualReportBuilder({
  filters,
  taxPublished,
  onExportSurvey,
  onExportTax,
  onExportGis,
}: {
  filters: ReportFilters
  taxPublished: boolean
  onExportSurvey: () => Promise<void>
  onExportTax: () => Promise<void>
  onExportGis?: () => Promise<void>
}) {
  const { locale, t } = useLocale()
  const [recent, setRecent] = React.useState<RecentExport[]>([])
  React.useEffect(() => setRecent(getRecentExports()), [])

  const handleExport = async (fn: () => Promise<void>, name: string) => {
    await fn()
    setRecent(addRecentExport(name))
  }

  const needsWard = !filters.wardId
  const taxDisabled = needsWard || !taxPublished

  const cards: ReportCard[] = [
    {
      id: "survey",
      title: t("reports.survey"),
      description: t("reports.surveyHint"),
      icon: ClipboardList,
      actions: [
        {
          label: t("reports.export"),
          onClick: () => void handleExport(onExportSurvey, t("reports.survey")),
        },
        ...(onExportGis
          ? [
            {
              label: t("reports.exportGis"),
              onClick: () =>
                void handleExport(onExportGis, t("reports.exportGis")),
            },
          ]
          : []),
        { label: t("reports.import"), href: "/surveys/import", variant: "outline" as const },
      ],
    },
    {
      id: "municipality",
      title: t("reports.summary"),
      description: t("reports.summaryHint"),
      icon: Building2,
      actions: [
        {
          label: t("reports.export"),
          onClick: () => void handleExport(onExportSurvey, t("reports.summary")),
        },
      ],
    },
    {
      id: "qc-final",
      title: t("reports.qc"),
      description: t("reports.qcHint"),
      icon: FileSpreadsheet,
      actions: [
        {
          label: t("reports.export"),
          disabled: taxDisabled,
          disabledReason: taxDisabled ? t("reports.taxDisabled") : undefined,
          onClick: () => void handleExport(onExportTax, t("reports.qc")),
        },
      ],
    },
    {
      id: "notice",
      title: t("reports.notice"),
      description: t("reports.noticeHint"),
      icon: ScrollText,
      actions: [
        {
          label: t("reports.open"),
          href: "/reports/notice",
          variant: "default",
        },
      ],
    },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div>
        <h2 className="mb-1 text-base font-semibold">{t("reports.builder")}</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Configure and export reports
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Card
              key={card.id}
              className={
                card.id === "notice"
                  ? "rounded-xl border border-primary/40 bg-primary/5 shadow-sm transition-colors duration-150 hover:border-primary/60 hover:bg-primary/10"
                  : "rounded-xl border shadow-sm transition-colors duration-150 hover:border-primary/30 hover:bg-muted/40"
              }
            >
              <CardHeader className="pb-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <card.icon className="size-5 text-primary" aria-hidden />
                </div>
                <CardTitle className="text-sm font-semibold">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {card.actions.map((action) =>
                    action.href ? (
                      <Button
                        key={action.label}
                        variant={action.variant ?? "outline"}
                        size="sm"
                        className="cursor-pointer text-xs"
                        render={<Link href={action.href} />}
                      >
                        {action.label === "Import Excel" ? (
                          <Upload className="mr-1 size-3" />
                        ) : null}
                        {action.label}
                      </Button>
                    ) : (
                      <Button
                        key={action.label}
                        variant={action.variant ?? "outline"}
                        size="sm"
                        className="cursor-pointer text-xs"
                        disabled={action.disabled}
                        title={action.disabledReason}
                        onClick={action.onClick}
                      >
                        <Download className="mr-1 size-3" />
                        {action.label}
                      </Button>
                    )
                  )}
                </div>
                {card.id === "survey" && needsWard && (
                  <p className="text-xs text-muted-foreground italic">
                    Select a ward in Report Scope to enable Excel export.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-base font-semibold">SAVED REPORTS</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Quick access to recent exports
        </p>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="space-y-2 p-4">
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No recent exports yet.
              </p>
            ) : (
              recent.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatLocaleDate(r.date, locale)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer size-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setRecent(removeRecentExport(r.id))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
