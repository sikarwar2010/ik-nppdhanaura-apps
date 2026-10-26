"use client"

import { useQuery } from "@tanstack/react-query"

import { useCan } from "@/hooks/use-permission"
import { api } from "@/lib/api"

import { EmptyBlock, ErrorBlock, LoadingBlock } from "./admin-ui"

type AuditRow = {
  id: string
  action: string
  createdAt: string
  oldValue: unknown
  newValue: unknown
  metadata: { reason?: string } | null
  actor: { name: string; email: string } | null
}

const ACTION_LABEL: Record<string, string> = {
  REBATE_POLICY_CREATED: "Draft created",
  REBATE_POLICY_UPDATED: "Draft edited",
  REBATE_POLICY_ACTIVATED: "Approved and activated",
  REBATE_POLICY_ARCHIVED: "Archived",
  PENALTY_POLICY_CREATED: "Draft created",
  PENALTY_POLICY_UPDATED: "Draft edited",
  PENALTY_POLICY_ACTIVATED: "Approved and activated",
  PENALTY_POLICY_ARCHIVED: "Archived",
  ASSESSMENT_YEAR_CREATED: "Year created",
  ASSESSMENT_YEAR_SAVED: "Dates saved",
  ASSESSMENT_YEAR_UPDATED: "Updated",
  UPDATE_PARAMS: "Percentages changed",
  UPSERT_CELLS: "Rate table changed",
  PUBLISH: "Published",
  CREATE: "Draft created",
}

function summary(value: unknown): string {
  if (!value || typeof value !== "object") return ""
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([key, v]) => v !== null && v !== undefined && typeof v !== "object" && !/id$/i.test(key)
  )
  return entries
    .slice(0, 6)
    .map(([key, v]) => `${key}: ${String(v)}`)
    .join(" · ")
}

/** Who changed this record, when, and why (needs audit:read). */
export function AuditHistory({ entity, entityId }: { entity: string; entityId: string | null }) {
  const canRead = useCan("audit:read").allowed
  const query = useQuery({
    queryKey: ["audit", entity, entityId],
    enabled: Boolean(canRead && entityId),
    queryFn: () =>
      api
        .get<AuditRow[]>(`/api/v1/audit-logs?entity=${entity}&entityId=${entityId}&pageSize=20`)
        .then((res) => res.data),
  })
  if (!entityId) return <p className="text-sm text-muted-foreground">Select a record to see its history.</p>
  if (!canRead) {
    return <p className="text-sm text-muted-foreground">Your role cannot view audit history.</p>
  }
  if (query.isLoading) return <LoadingBlock rows={2} />
  if (query.isError) return <ErrorBlock error={query.error} onRetry={() => void query.refetch()} />
  const rows = query.data ?? []
  if (rows.length === 0) return <EmptyBlock title="No recorded changes yet" />
  return (
    <ol className="space-y-3">
      {rows.map((row) => (
        <li key={row.id} className="border-l-2 border-primary/40 pl-3 text-sm">
          <p className="font-medium">
            {ACTION_LABEL[row.action] ?? row.action}
            <span className="font-normal text-muted-foreground">
              {" "}
              · {new Date(row.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
              {row.actor?.name ?? "System"}
            </span>
          </p>
          {row.metadata?.reason ? <p className="text-muted-foreground">Reason: {row.metadata.reason}</p> : null}
          {summary(row.oldValue) ? (
            <p className="text-xs break-words text-muted-foreground">Before: {summary(row.oldValue)}</p>
          ) : null}
          {summary(row.newValue) ? (
            <p className="text-xs break-words text-muted-foreground">After: {summary(row.newValue)}</p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
