"use client"

import { useQuery } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { usePermission } from "@/hooks/use-permission"
import { api } from "@/lib/api"
import { downloadAuthenticatedExport } from "@/lib/download-blob"
import { inr, StatusBadge, useCollectionLookups, useSelectedAssessmentYear } from "../collection-shared"

type Row = {
  surveyId: string
  propertyId: string
  ownerName: string | null
  wardName: string
  currentYearDemand: string
  previousArrears: string
  rebate: string
  penalty: string
  payable: string
  collected: string
  outstanding: string
  status: string
}

export default function OutstandingPage() {
  const { years, wards } = useCollectionLookups()
  const { hasPermission } = usePermission()
  const [assessmentYearId, setAssessmentYearId] = useSelectedAssessmentYear(years)
  const [wardId, setWardId] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [sortBy, setSortBy] = React.useState("outstanding")
  const [sortOrder, setSortOrder] = React.useState("desc")

  const params = new URLSearchParams({
    assessmentYearId,
    page: String(page),
    pageSize: "20",
    sortBy,
    sortOrder,
  })
  if (wardId) params.set("wardId", wardId)
  if (search.trim()) params.set("search", search.trim())

  const list = useQuery({
    queryKey: ["collection-dues", params.toString()],
    enabled: Boolean(assessmentYearId),
    queryFn: () =>
      api
        .get<{ items: Row[]; meta: { page: number; totalPages: number; total: number } }>(
          `/api/v1/collections/properties?${params}`
        )
        .then((res) => res.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span>Assessment year</span>
          <select className="flex h-9 rounded-md border bg-background px-2" value={assessmentYearId} onChange={(event) => setAssessmentYearId(event.target.value)}>
            {years.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Ward</span>
          <select className="flex h-9 rounded-md border bg-background px-2" value={wardId} onChange={(event) => setWardId(event.target.value)}>
            <option value="">All wards</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>{ward.name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Search</span>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Sort</span>
          <select className="flex h-9 rounded-md border bg-background px-2" value={`${sortBy}:${sortOrder}`} onChange={(event) => {
            const [field, order] = event.target.value.split(":")
            setSortBy(field ?? "outstanding")
            setSortOrder(order ?? "desc")
          }}>
            <option value="outstanding:desc">Outstanding high to low</option>
            <option value="outstanding:asc">Outstanding low to high</option>
            <option value="surveyId:asc">Property ID</option>
            <option value="ownerName:asc">Owner</option>
          </select>
        </label>
        {hasPermission("report:export") ? (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() =>
              void downloadAuthenticatedExport(
                `/api/v1/collections/dues/export?${params}`,
                "outstanding-dues.xlsx"
              ).catch((error: Error) => toast.error(error.message))
            }
          >
            Export Excel
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Property</th>
              <th className="p-2 text-left">Owner</th>
              <th className="p-2 text-left">Ward</th>
              <th className="p-2 text-right">Current demand</th>
              <th className="p-2 text-right">Arrears</th>
              <th className="p-2 text-right">Rebate</th>
              <th className="p-2 text-right">Penalty</th>
              <th className="p-2 text-right">Payable</th>
              <th className="p-2 text-right">Collected</th>
              <th className="p-2 text-right">Outstanding</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.length === 0 ? (
              <tr><td className="p-3 text-muted-foreground" colSpan={11}>No outstanding rows for this filter.</td></tr>
            ) : null}
            {list.data?.items.map((row) => (
              <tr key={row.surveyId} className="border-t">
                <td className="p-2">{row.propertyId}</td>
                <td className="p-2">{row.ownerName ?? "—"}</td>
                <td className="p-2">{row.wardName}</td>
                <td className="p-2 text-right tabular-nums">{inr(row.currentYearDemand)}</td>
                <td className="p-2 text-right tabular-nums">{inr(row.previousArrears)}</td>
                <td className="p-2 text-right tabular-nums">{inr(row.rebate)}</td>
                <td className="p-2 text-right tabular-nums">{inr(row.penalty)}</td>
                <td className="p-2 text-right tabular-nums">{inr(row.payable)}</td>
                <td className="p-2 text-right tabular-nums">{inr(row.collected)}</td>
                <td className="p-2 text-right tabular-nums">{inr(row.outstanding)}</td>
                <td className="p-2"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 text-sm">
        <Button type="button" variant="outline" className="cursor-pointer" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
        <span>
          Page {list.data?.meta.page ?? page} of {list.data?.meta.totalPages ?? 1} · {list.data?.meta.total ?? 0} properties
        </span>
        <Button type="button" variant="outline" className="cursor-pointer" disabled={!list.data || page >= list.data.meta.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
      </div>
    </div>
  )
}
