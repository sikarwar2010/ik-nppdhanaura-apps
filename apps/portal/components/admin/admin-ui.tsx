"use client"

/**
 * Shared building blocks for the Tax Administration pages, so every page uses
 * the same header, panels, states, fields, money format and confirmations.
 */
import { AlertCircle, Inbox, Info, Loader2, RotateCcw } from "lucide-react"
import * as React from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

import { formatApiError } from "@/lib/format-api-error"

/** ₹ with Indian grouping from a decimal string; never via floating point. */
export function formatInr(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—"
  const match = /^(-)?(\d+)(?:\.(\d+))?$/.exec(String(value).trim())
  if (!match) return String(value)
  const [, sign, whole = "0", frac = ""] = match
  const paise = (frac + "00").slice(0, 2)
  const last3 = whole.slice(-3)
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  return `${sign ? "−" : ""}₹${rest ? `${rest},` : ""}${last3}.${paise}`
}

export function AdminPageHeader({
  eyebrow = "Tax Administration / कर प्रशासन",
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl space-y-1">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  id,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const headingId = React.useId()
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("rounded-xl border bg-card shadow-[var(--shadow-premium)]", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-semibold">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function ErrorBlock({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
      <p className="min-w-0 flex-1">{formatApiError(error, "Could not load this information.")}</p>
      {onRetry ? (
        <Button size="sm" variant="outline" className="cursor-pointer" onClick={onRetry}>
          <RotateCcw aria-hidden className="size-3.5" /> Retry
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyBlock({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center">
      <Inbox aria-hidden className="mx-auto mb-2 size-6 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {children ? <div className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{children}</div> : null}
    </div>
  )
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning" | "success"
  children: React.ReactNode
}) {
  const styles = {
    info: "border-info/30 bg-info-soft text-foreground [&>svg]:text-info",
    warning: "border-warning/40 bg-warning-soft text-foreground [&>svg]:text-warning",
    success: "border-success/30 bg-success-soft text-foreground [&>svg]:text-success",
  }[tone]
  return (
    <div role="note" className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", styles)}>
      {tone === "warning" ? (
        <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      ) : (
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Label + control + hint + error, wired with aria-describedby. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  required,
}: {
  id: string
  label: string
  hint?: string
  error?: string | null
  required?: boolean
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden className="text-destructive"> *</span> : null}
      </Label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint ? <p id={hintId} className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p id={errorId} className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}

export const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ACTIVE: { label: "Active / लागू", variant: "default" },
  PUBLISHED: { label: "Published / प्रकाशित", variant: "default" },
  DRAFT: { label: "Draft / प्रारूप", variant: "secondary" },
  CLOSED: { label: "Closed / बंद", variant: "outline" },
  EXPIRED: { label: "Expired / समाप्त", variant: "outline" },
  ARCHIVED: { label: "Archived / संग्रहीत", variant: "outline" },
  NOT_CONFIGURED: { label: "Dates not set", variant: "destructive" },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, variant: "outline" as const }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

/**
 * Confirmation for sensitive changes. With `requireReason` the reason is
 * mandatory and is sent to the server for the audit trail.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  requireReason,
  reasonLabel = "Reason (recorded in the audit trail)",
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmLabel: string
  destructive?: boolean
  requireReason?: boolean
  reasonLabel?: string
  pending?: boolean
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = React.useState("")
  const reasonId = React.useId()
  const valid = !requireReason || reason.trim().length >= 5
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        if (!next) setReason("")
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription render={<div />}>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor={reasonId}>
            {reasonLabel}
            {requireReason ? <span aria-hidden className="text-destructive"> *</span> : " (optional)"}
          </Label>
          <Textarea
            id={reasonId}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Board resolution no. 12 dated 15 Apr 2026"
          />
          {requireReason && !valid ? (
            <p className="text-xs text-muted-foreground">At least 5 characters.</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="cursor-pointer"
            variant={destructive ? "destructive" : "default"}
            disabled={pending || !valid}
            onClick={() => onConfirm(reason.trim())}
          >
            {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type PreviewStep = { label: string; formula: string; amount: string }

/** Step-by-step calculation, always labelled as an estimate. */
export function CalcSteps({
  steps,
  footnote,
  loading,
  error,
}: {
  steps: PreviewStep[] | null
  footnote?: React.ReactNode
  loading?: boolean
  error?: unknown
}) {
  return (
    <div className="space-y-3" aria-live="polite">
      <p className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
        <Info aria-hidden className="size-3.5" /> Estimate from the server&apos;s calculation engine. Nothing is saved.
      </p>
      {error ? <ErrorBlock error={error} /> : null}
      {loading && !steps ? <LoadingBlock rows={3} /> : null}
      {steps ? (
        <ol className={cn("divide-y rounded-lg border", loading && "opacity-60")}>
          {steps.map((step, i) => (
            <li key={`${step.label}-${i}`} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 px-3 py-2 text-sm">
              <span className="font-medium">{step.label}</span>
              <span className="text-right font-semibold tabular-nums">{formatInr(step.amount)}</span>
              <span className="col-span-2 text-xs text-muted-foreground">{step.formula}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {footnote ? <p className="text-xs text-muted-foreground">{footnote}</p> : null}
    </div>
  )
}
