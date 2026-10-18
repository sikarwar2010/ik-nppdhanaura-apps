"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { api } from "@/lib/api"
import { Badge } from "@workspace/ui/components/badge"

export type YearOption = { id: string; name: string; code: string }
export type WardOption = { id: string; name: string; number: number }

export function useSelectedAssessmentYear(years: YearOption[]) {
  const [picked, setPicked] = useState("")
  return [picked || years[0]?.id || "", setPicked] as const
}

export function inr(value: string | number | null | undefined): string {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed)
    ? parsed.toLocaleString("en-IN", { style: "currency", currency: "INR" })
    : "—"
}

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "PAID" || status === "SUCCESS"
      ? "default"
      : status === "PARTIAL" || status === "PENDING"
        ? "secondary"
        : status === "REFUNDED" || status === "FAILED" || status === "CANCELLED"
          ? "destructive"
          : "outline"
  const label =
    status === "UNPAID"
      ? "Unpaid / अवैतनिक"
      : status === "PARTIAL"
        ? "Partial / आंशिक"
        : status === "PAID"
          ? "Paid / भुगतान"
          : status === "PENDING"
            ? "Pending / लंबित"
            : status === "SUCCESS"
              ? "Settled / जमा"
              : status === "REFUNDED"
                ? "Reversed / उलटा"
                : status
  return <Badge variant={variant}>{label}</Badge>
}

export function useCollectionLookups() {
  const years = useQuery({
    queryKey: ["assessment-years"],
    queryFn: () =>
      api
        .get<YearOption[]>("/api/v1/reference-entries?category=ASSESSMENT_YEAR")
        .then((res) => res.data),
  })
  const wards = useQuery({
    queryKey: ["wards"],
    queryFn: () => api.get<WardOption[]>("/api/v1/wards").then((res) => res.data),
  })
  return { years: years.data ?? [], wards: wards.data ?? [] }
}
