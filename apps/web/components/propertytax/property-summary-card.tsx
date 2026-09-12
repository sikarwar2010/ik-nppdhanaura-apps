import type { PublicPropertyTaxDues } from "@workspace/types"

import { buildHouseTaxAddress, displayName } from "@/lib/property-tax-format"
import { cn } from "@/lib/utils"

type PropertySummaryCardProps = {
  dues: PublicPropertyTaxDues
  className?: string
}

function Row({
  label,
  value,
  deva,
}: {
  label: string
  value: string
  deva?: boolean
}) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:gap-3">
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm font-semibold text-slate-900",
          deva && "font-[family-name:var(--font-deva)]"
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export function PropertySummaryCard({
  dues,
  className = "",
}: PropertySummaryCardProps) {
  const wardLabel = `${String(dues.wardNumber).padStart(2, "0")} · ${dues.wardName}`
  const roadZone = dues.taxRateZone || dues.roadType || "—"
  const mobile =
    typeof dues.mobileMasked === "string" && dues.mobileMasked.trim().length > 0
      ? dues.mobileMasked.trim()
      : "—"

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
      aria-labelledby="property-summary-heading"
    >
      <h2
        id="property-summary-heading"
        className="text-gov-blue-dark text-base font-bold tracking-tight"
      >
        Property / Assessment Summary
      </h2>
      <dl className="mt-4 space-y-3">
        <Row label="Assessment Year" value={dues.assessmentYear.name} />
        <Row label="Survey / Property ID" value={dues.surveyId} />
        <Row label="Ward" value={wardLabel} deva />
        <Row label="Parcel Number" value={dues.parcelNo || "—"} />
        <Row label="Owner" value={displayName(dues.ownerName)} deva />
        <Row
          label="Father Name"
          value={displayName(dues.ownerFatherName)}
          deva
        />
        <Row label="Mobile Number" value={mobile} />
        <Row label="Address" value={buildHouseTaxAddress(dues)} />
        <Row label="Property Use" value={dues.propertyUse || "—"} />
        <Row label="Road Width Zone" value={roadZone} />
      </dl>
    </section>
  )
}
