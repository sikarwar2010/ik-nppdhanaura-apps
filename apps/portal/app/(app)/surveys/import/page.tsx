"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { Suspense } from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { usePermission } from "@/hooks/use-permission"
import { api } from "@/lib/api"

import { useLocale } from "@workspace/i18n"
import { ImportDropzone } from "./_components/import-dropzone"
import { ImportErrorsTable } from "./_components/import-errors-table"
import { ImportKpis, ImportProgress } from "./_components/import-kpis"
import { ImportStatusBadge } from "./_components/import-status-badge"
import type { DuplicateStrategy, ImportJob } from "./_components/types"

function ImportColumnSummary({
  mapping,
}: {
  mapping: ImportJob["columnMapping"]
}) {
  const { t } = useLocale()
  if (!mapping) return null
  const unmapped = mapping.unmappedColumns ?? []
  const extras = mapping.storedExtraFields ?? []
  if (
    unmapped.length === 0 &&
    extras.length === 0 &&
    !mapping.emptyRows &&
    !mapping.duplicateRows
  ) {
    return null
  }
  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>
        {t("import.emptyRows")}: {mapping.emptyRows ?? 0}
        {" · "}
        {t("import.duplicates")}: {mapping.duplicateRows ?? 0}
      </p>
      {extras.length > 0 ? (
        <p>
          {t("import.extras")}: {extras.join(", ")}
        </p>
      ) : null}
      {unmapped.length > 0 ? (
        <p>
          {t("import.unmapped")}: {unmapped.join(", ")}
        </p>
      ) : null}
    </div>
  )
}

function ImportWizard() {
  const { t } = useLocale()
  const [file, setFile] = React.useState<File | null>(null)
  const [strategy, setStrategy] = React.useState<DuplicateStrategy>("UPDATE")
  const searchParams = useSearchParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { can, isLoading: permsLoading } = usePermission()
  const canCreate = can("import:create")
  const canRead = can("import:read")
  const jobId = searchParams.get("job")

  const jobQuery = useQuery({
    queryKey: ["import-job", jobId],
    enabled: Boolean(jobId),
    refetchInterval: (q) =>
      q.state.data?.status === "PROCESSING" ? 2000 : false,
    queryFn: async () =>
      (await api.get<ImportJob>(`/api/v1/imports/${jobId}`)).data,
  })

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error(t("import.selectFile"))
      const form = new FormData()
      form.append("file", file)
      form.append("duplicateStrategy", strategy)
      return (await api.postForm<ImportJob>("/api/v1/imports/upload", form))
        .data
    },
    onSuccess: (data) => {
      setFile(null)
      toast.success(`${t("import.uploaded")}. ${data.mappingPreset ?? ""}`)
      void qc.invalidateQueries({ queryKey: ["imports"] })
      router.replace(`/surveys/import?job=${data.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const start = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error("No job")
      return (await api.post<ImportJob>(`/api/v1/imports/${jobId}/start`)).data
    },
    onSuccess: () => {
      toast.success(t("import.started"))
      void qc.invalidateQueries({ queryKey: ["import-job", jobId] })
      void qc.invalidateQueries({ queryKey: ["imports"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (permsLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  const job = jobQuery.data

  return (
    <div className="space-y-4">
      {canCreate && !jobId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("import.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImportDropzone
              file={file}
              onFileChange={setFile}
              disabled={upload.isPending}
            />
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("import.strategy")}</legend>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="duplicateStrategy"
                    value="UPDATE"
                    className="cursor-pointer"
                    checked={strategy === "UPDATE"}
                    onChange={() => setStrategy("UPDATE")}
                  />
                  {t("import.update")}
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="duplicateStrategy"
                    value="SKIP"
                    className="cursor-pointer"
                    checked={strategy === "SKIP"}
                    onChange={() => setStrategy("SKIP")}
                  />
                  {t("import.skip")}
                </Label>
              </div>
            </fieldset>
            <Button
              className="cursor-pointer"
              disabled={!file || upload.isPending}
              onClick={() => upload.mutate()}
            >
              {upload.isPending ? t("common.loading") : t("import.upload")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!canCreate && !jobId ? (
        <div className="rounded-xl border bg-card px-4 py-10 text-center">
          <p className="text-sm font-medium">{t("import.noPermission")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask an admin for import permission to upload a workbook.
          </p>
          {canRead ? (
            <Button
              className="mt-4 cursor-pointer"
              variant="outline"
              render={<Link href="/surveys/import/history" />}
            >
              View history
            </Button>
          ) : null}
        </div>
      ) : null}

      {jobId ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">Import job</CardTitle>
              {job ? (
                <p className="text-sm text-muted-foreground">
                  {job.fileName}
                  {job.mappingPreset ? ` · Preset ${job.mappingPreset}` : null}
                  {` · ${job.duplicateStrategy === "SKIP" ? t("import.skipDuplicates") : t("import.update")}`}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {job ? <ImportStatusBadge status={job.status} /> : null}
              {canCreate ? (
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => router.replace("/surveys/import")}
                >
                  New import
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobQuery.isLoading ? (
              <div
                className="space-y-2"
                aria-busy="true"
                aria-label="Loading job"
              >
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-40" />
              </div>
            ) : jobQuery.isError ? (
              <div className="space-y-2" role="alert">
                <p className="text-sm text-destructive">
                  {jobQuery.error instanceof Error
                    ? jobQuery.error.message
                    : t("import.loadFailed")}
                </p>
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => void jobQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : job ? (
              <>
                <ImportKpis job={job} />
                <ImportColumnSummary mapping={job.columnMapping} />
                {job.status === "PROCESSING" ? (
                  <ImportProgress
                    processed={job.processedRows}
                    total={job.totalRows}
                  />
                ) : null}
                {job.status === "READY" && canCreate ? (
                  <Button
                    className="cursor-pointer"
                    disabled={start.isPending}
                    onClick={() => start.mutate()}
                  >
                    {start.isPending ? t("common.loading") : t("import.start")}
                  </Button>
                ) : null}
                <ImportErrorsTable errors={job.errors ?? []} />
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export default function ImportWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      }
    >
      <ImportWizard />
    </Suspense>
  )
}
