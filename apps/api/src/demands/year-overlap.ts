export type YearRange = {
  id: string
  startsOn: string
  endsOn: string
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
}

export function rangesOverlap(
  leftStart: string,
  leftEnd: string,
  rightStart: string,
  rightEnd: string
): boolean {
  return leftStart <= rightEnd && rightStart <= leftEnd
}

export function findOverlappingYear(
  candidate: {
    id?: string
    startsOn: string
    endsOn: string
    status: YearRange["status"]
  },
  existing: YearRange[]
): YearRange | null {
  if (candidate.status === "ARCHIVED") return null
  if (candidate.endsOn < candidate.startsOn) {
    return {
      id: candidate.id ?? "",
      startsOn: candidate.startsOn,
      endsOn: candidate.endsOn,
      status: candidate.status,
    }
  }
  for (const row of existing) {
    if (row.status === "ARCHIVED") continue
    if (candidate.id && row.id === candidate.id) continue
    if (
      rangesOverlap(
        candidate.startsOn,
        candidate.endsOn,
        row.startsOn,
        row.endsOn
      )
    ) {
      return row
    }
  }
  return null
}
