import { computeGisPreviewDemand } from "../tax/tax-calc"

type DecimalLike = { toString(): string } | number | string | null | undefined

export type TaxConfigCellRecord = {
  roadWidthEntryId: string
  constructionEntryId: string
  annualRatePerSqFt: DecimalLike
  roadWidthEntry?: unknown
  constructionEntry?: unknown
}

export type TaxConfigRecord = {
  id: string
  wardId: string
  assessmentYearId: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  version: number
  propertyTaxPct: DecimalLike
  waterTaxPct: DecimalLike
  drainageTaxPct: DecimalLike
  penaltyPct: DecimalLike
  assessablePct: DecimalLike
  commercialAssessablePct: DecimalLike
  cells: TaxConfigCellRecord[]
  ward?: unknown
  assessmentYear?: unknown
  publishedAt?: Date | string | null
  _count?: { versions?: number }
}

export type TaxConfigView = {
  configured: true
  id: string
  wardId: string
  assessmentYearId: string
  status: TaxConfigRecord["status"]
  version: number
  propertyTaxPct: string | null
  waterTaxPct: string | null
  drainageTaxPct: string | null
  penaltyPct: string | null
  assessablePct: string | null
  commercialAssessablePct: string | null
  publishedAt: string | null
  /** True when a prior publish exists, so the next publish must record a reason. */
  previouslyPublished: boolean
  cells: Array<{
    roadWidthEntryId: string
    constructionEntryId: string
    annualRatePerSqFt: string | null
    roadWidthEntry?: unknown
    constructionEntry?: unknown
  }>
}

export type TaxConfigMissing = {
  configured: false
  wardId: string
  assessmentYearId: string
}

export type TaxPreviewInput = {
  wardId: string
  assessmentYearId: string
  areaSqFt: number
  roadWidthEntryId: string
  constructionEntryId: string
  gisUseCode?: string
}

/** Keep a real zero. A blank or non-numeric value is missing, not zero. */
export function decimalToString(value: DecimalLike): string | null {
  if (value == null) return null
  const raw =
    typeof value === "number"
      ? String(value)
      : typeof value === "string"
        ? value.trim()
        : value.toString().trim()
  if (raw === "") return null
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return null
  return raw
}

export function missingTaxConfig(
  wardId: string,
  assessmentYearId: string
): TaxConfigMissing {
  return { configured: false, wardId, assessmentYearId }
}

function publishedAtIso(value: Date | string | null | undefined): string | null {
  if (value == null || value === "") return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function serializeTaxConfig(config: TaxConfigRecord): TaxConfigView {
  const publishedAt = publishedAtIso(config.publishedAt)
  return {
    configured: true,
    id: config.id,
    wardId: config.wardId,
    assessmentYearId: config.assessmentYearId,
    status: config.status,
    version: config.version,
    propertyTaxPct: decimalToString(config.propertyTaxPct),
    waterTaxPct: decimalToString(config.waterTaxPct),
    drainageTaxPct: decimalToString(config.drainageTaxPct),
    penaltyPct: decimalToString(config.penaltyPct),
    assessablePct: decimalToString(config.assessablePct),
    commercialAssessablePct: decimalToString(config.commercialAssessablePct),
    publishedAt,
    previouslyPublished: (config._count?.versions ?? 0) > 0 || publishedAt != null,
    cells: config.cells.map((cell) => ({
      roadWidthEntryId: cell.roadWidthEntryId,
      constructionEntryId: cell.constructionEntryId,
      annualRatePerSqFt: decimalToString(cell.annualRatePerSqFt),
      roadWidthEntry: cell.roadWidthEntry,
      constructionEntry: cell.constructionEntry,
    })),
  }
}

function percentNumber(value: DecimalLike): number | null {
  const raw = decimalToString(value)
  return raw == null ? null : Number(raw)
}

export function buildTaxPreview(
  config: TaxConfigRecord | null,
  input: TaxPreviewInput
) {
  if (!config || config.assessmentYearId !== input.assessmentYearId) {
    return {
      configured: false as const,
      rateMissing: true,
      inputs: input,
      rates: null,
      calculation: null,
    }
  }

  const rates = {
    assessablePct: decimalToString(config.assessablePct),
    commercialAssessablePct: decimalToString(config.commercialAssessablePct),
    propertyTaxPct: decimalToString(config.propertyTaxPct),
    waterTaxPct: decimalToString(config.waterTaxPct),
    drainageTaxPct: decimalToString(config.drainageTaxPct),
    penaltyPct: decimalToString(config.penaltyPct),
  }
  const cell = config.cells.find(
    (item) =>
      item.roadWidthEntryId === input.roadWidthEntryId &&
      item.constructionEntryId === input.constructionEntryId
  )
  const annualRate = cell ? decimalToString(cell.annualRatePerSqFt) : null
  if (annualRate == null) {
    return {
      configured: true as const,
      rateMissing: true,
      status: config.status,
      version: config.version,
      inputs: input,
      rates: { ...rates, annualRate: null },
      calculation: null,
    }
  }

  const assessablePct = percentNumber(config.assessablePct)
  const commercialAssessablePct = percentNumber(config.commercialAssessablePct)
  const propertyTaxPct = percentNumber(config.propertyTaxPct)
  const waterTaxPct = percentNumber(config.waterTaxPct)
  const drainageTaxPct = percentNumber(config.drainageTaxPct)
  const penaltyPct = percentNumber(config.penaltyPct)
  if (
    assessablePct == null ||
    commercialAssessablePct == null ||
    propertyTaxPct == null ||
    waterTaxPct == null ||
    drainageTaxPct == null ||
    penaltyPct == null
  ) {
    return {
      configured: true as const,
      rateMissing: true,
      status: config.status,
      version: config.version,
      inputs: input,
      rates: { ...rates, annualRate },
      calculation: null,
    }
  }

  const preview = computeGisPreviewDemand({
    areaSqFt: input.areaSqFt,
    baseMonthlyRate: Number(annualRate),
    gisUseCode: input.gisUseCode ?? "R",
    assessablePct,
    commercialAssessablePct,
    propertyTaxPct,
    waterTaxPct,
    drainageTaxPct,
    penaltyPct,
  })

  return {
    configured: true as const,
    rateMissing: false,
    status: config.status,
    version: config.version,
    inputs: input,
    rates: {
      annualRate: preview.effectiveMonthlyRate,
      assessablePct: rates.assessablePct,
      commercialAssessablePct: rates.commercialAssessablePct,
      propertyTaxPct: rates.propertyTaxPct,
      waterTaxPct: rates.waterTaxPct,
      drainageTaxPct: rates.drainageTaxPct,
      penaltyPct: rates.penaltyPct,
    },
    calculation: {
      grossAlv: preview.grossAlv,
      assessableAlv: preview.assessableAlv,
      propertyTax: preview.propertyTax,
      waterTax: preview.waterTax,
      drainageTax: preview.drainageTax,
      penalty: preview.penalty,
      demand: preview.demand,
    },
    basis: {
      baseMonthlyRate: Number(annualRate),
      effectiveMonthlyRate: preview.effectiveMonthlyRate,
      rateMultiplier: Number(annualRate) > 0 ? preview.effectiveMonthlyRate / Number(annualRate) : 1,
      appliedAssessablePct: preview.assessablePct,
      gisClass: preview.gisClass,
      waterAndDrainageApply: preview.gisClass !== "open_land",
    },
    /** Server-built formula steps for the staff preview (same numbers as above). */
    steps: taxPreviewSteps(input.areaSqFt, Number(annualRate), preview, {
      propertyTaxPct,
      waterTaxPct,
      drainageTaxPct,
      penaltyPct,
    }),
    roundingRule:
      "Each step is rounded half-up to the nearest paisa (₹0.01) using decimal arithmetic.",
  }
}

function rupees(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function taxPreviewSteps(
  areaSqFt: number,
  baseMonthlyRate: number,
  p: ReturnType<typeof computeGisPreviewDemand>,
  pct: { propertyTaxPct: number; waterTaxPct: number; drainageTaxPct: number; penaltyPct: number }
): Array<{ label: string; formula: string; amount: string }> {
  const amount = (n: number) => n.toFixed(2)
  const mult = baseMonthlyRate > 0 ? p.effectiveMonthlyRate / baseMonthlyRate : 1
  const steps = [
    {
      label: "Monthly rate used",
      formula:
        mult === 1
          ? `Base rate ₹${baseMonthlyRate} per sq ft per month (${p.gisClass.replace("_", " ")})`
          : `Base rate ₹${baseMonthlyRate} × ${mult} (${p.gisClass} use) per sq ft per month`,
      amount: amount(p.effectiveMonthlyRate),
    },
    {
      label: "Gross annual letting value (ALV)",
      formula: `${areaSqFt} sq ft × ₹${p.effectiveMonthlyRate} × 12 months`,
      amount: amount(p.grossAlv),
    },
    {
      label: "Assessable ALV",
      formula: `${rupees(p.grossAlv)} × ${p.assessablePct}% assessable`,
      amount: amount(p.assessableAlv),
    },
    {
      label: "Property tax",
      formula: `${rupees(p.assessableAlv)} × ${pct.propertyTaxPct}%`,
      amount: amount(p.propertyTax),
    },
    {
      label: "Water tax",
      formula:
        p.gisClass === "open_land"
          ? "Not charged on open land"
          : `${rupees(p.assessableAlv)} × ${pct.waterTaxPct}%`,
      amount: amount(p.waterTax),
    },
    {
      label: "Drainage tax",
      formula:
        p.gisClass === "open_land"
          ? "Not charged on open land"
          : `${rupees(p.assessableAlv)} × ${pct.drainageTaxPct}%`,
      amount: amount(p.drainageTax),
    },
  ]
  if (pct.penaltyPct > 0) {
    steps.push({
      label: "Rate-table penalty",
      formula: `${rupees(p.propertyTax)} property tax × ${pct.penaltyPct}% (used only when no penalty rule is active)`,
      amount: amount(p.penalty),
    })
  }
  steps.push({
    label: "Annual demand (before rebate)",
    formula: "Property + water + drainage tax + penalty",
    amount: amount(p.demand),
  })
  return steps
}
