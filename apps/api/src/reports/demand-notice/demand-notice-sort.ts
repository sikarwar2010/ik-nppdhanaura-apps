/** Natural / numeric-aware parcel comparison; preserves display strings separately. */
export function compareParcelNatural(
  a: string | null | undefined,
  b: string | null | undefined
): number {
  const left = (a ?? "").trim()
  const right = (b ?? "").trim()
  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

export function sortDemandNoticeSurveys<
  T extends {
    ward?: { number: number } | null
    parcelNo?: string | null
    surveyId: string
  },
>(rows: T[]): T[] {
  return [...rows].sort((x, y) => {
    const wardDiff = (x.ward?.number ?? 0) - (y.ward?.number ?? 0)
    if (wardDiff !== 0) return wardDiff
    const parcelDiff = compareParcelNatural(x.parcelNo, y.parcelNo)
    if (parcelDiff !== 0) return parcelDiff
    return x.surveyId.localeCompare(y.surveyId)
  })
}
