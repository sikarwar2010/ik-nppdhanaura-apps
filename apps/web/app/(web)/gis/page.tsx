import { AlertTriangle, Info, MapPinned, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/site/page-header"
import { EmptyState, Section } from "@/components/site/primitives"
import { formatDate, getI18n, type MessageKey } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"
import { fetchWardStats, inr, type WardStat, type WardStatsResponse } from "@/lib/ward-stats"

export const generateMetadata = () => pageMetadata("/gis", "gis.title", "gis.lead")

type Props = { searchParams: Promise<{ year?: string; ward?: string }> }

export default async function GisPage({ searchParams }: Props) {
  const { locale, t } = await getI18n()
  const params = await searchParams
  const year = params.year?.slice(0, 64)
  const result = await fetchWardStats(year)
  const header = (
    <PageHeader title={t("gis.title")} lead={t("gis.lead")} crumbs={[{ label: t("nav.gis") }]} />
  )

  if (!result.ok) {
    return (
      <>
        {header}
        <Section>
          <EmptyState
            icon={AlertTriangle}
            title={result.reason === "not-found" ? t("gis.yearNotFound") : t("gis.unavailable")}
          >
            {result.reason === "not-found" ? (
              <Link href="/gis" className="link">{t("gis.allWards")}</Link>
            ) : null}
          </EmptyState>
        </Section>
      </>
    )
  }

  const data = result.data
  const wardFilter = params.ward ? Number(params.ward) : null
  const wards = wardFilter ? data.wards.filter((w) => w.wardNumber === wardFilter) : data.wards
  const tot = wardFilter && wards[0] ? wards[0] : data.totals

  return (
    <>
      {header}
      <Section>
        <p role="note" className="mb-6 flex items-start gap-3 rounded-lg border border-navy-100 bg-navy-50 p-4 text-sm text-navy-900">
          <MapPinned aria-hidden className="mt-0.5 size-5 shrink-0 text-navy-700" />
          {t("gis.mapNote")}
        </p>

        {/* Filters: plain GET form, works without JavaScript. */}
        <form action="/gis" className="card mb-8 flex flex-wrap items-end gap-4 p-4">
          <label className="flex min-w-48 flex-col gap-1 text-sm font-semibold text-navy-800">
            {t("gis.year")}
            <select
              name="year"
              defaultValue={data.assessmentYear?.code ?? ""}
              className="min-h-11 rounded-md border border-line-strong bg-white px-3 text-base font-normal text-ink"
            >
              {data.years.length === 0 ? <option value="">—</option> : null}
              {data.years.map((y) => (
                <option key={y.id} value={y.code}>{y.name}</option>
              ))}
            </select>
          </label>
          <label className="flex min-w-48 flex-col gap-1 text-sm font-semibold text-navy-800">
            {t("gis.ward")}
            <select
              name="ward"
              defaultValue={wardFilter ? String(wardFilter) : ""}
              className="min-h-11 rounded-md border border-line-strong bg-white px-3 text-base font-normal text-ink"
            >
              <option value="">{t("gis.allWards")}</option>
              {data.wards.map((w) => (
                <option key={w.wardNumber} value={w.wardNumber}>
                  {t("gis.ward")} {w.wardNumber} — {w.wardName}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary">{t("gis.apply")}</button>
        </form>

        {!data.assessmentYear ? (
          <p role="status" className="mb-6 flex items-start gap-2 text-ink-muted">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t("gis.noYear")}
          </p>
        ) : null}

        <Totals t={t} totals={tot} wardsCount={wards.length} data={data} />

        {!data.disclosure.collections ? (
          <p className="mt-4 text-sm text-ink-muted">{t("gis.collectionsHidden")}</p>
        ) : null}

        {wards.length > 1 && data.assessmentYear ? <DemandChart t={t} wards={wards} /> : null}

        <h2 className="mt-12 mb-4 text-xl font-bold">{t("gis.wards")}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wards.map((w) => (
            <li key={w.wardNumber}>
              <WardCard t={t} ward={w} disclose={data.disclosure.collections} />
            </li>
          ))}
        </ul>

        <WardTable t={t} wards={wards} disclose={data.disclosure.collections} />

        <section aria-labelledby="basis" className="mt-10 rounded-lg border border-line bg-white p-5 text-sm">
          <h2 id="basis" className="font-bold text-navy-900">{t("gis.basis")}</h2>
          <p className="mt-2 text-ink" lang="en">{data.basis}</p>
          <p className="mt-2 text-ink-muted">
            {t("gis.generated")}: <time dateTime={data.generatedAt}>{formatDate(data.generatedAt.slice(0, 10), locale)}</time>
          </p>
          <p className="mt-3 flex items-start gap-2 text-ink-muted">
            <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t("gis.privacy")}
          </p>
        </section>
      </Section>
    </>
  )
}

type T = (key: MessageKey) => string

function Totals({
  t,
  totals,
  wardsCount,
  data,
}: {
  t: T
  totals: Partial<WardStat> & { propertiesSurveyed: number; propertiesWithPublishedDemand: number }
  wardsCount: number
  data: WardStatsResponse
}) {
  const yearLabel = data.assessmentYear?.name ?? "—"
  const tiles: Array<{ label: string; value: string; sub?: string }> = [
    { label: t("gis.wards"), value: String(wardsCount) },
    { label: t("gis.surveyed"), value: totals.propertiesSurveyed.toLocaleString("en-IN") },
    {
      label: t("gis.withDemand"),
      value: totals.propertiesWithPublishedDemand.toLocaleString("en-IN"),
      sub: yearLabel,
    },
    { label: t("gis.propertyTax"), value: inr(totals.propertyTax), sub: yearLabel },
    { label: t("gis.waterTax"), value: inr(totals.waterTax), sub: yearLabel },
    { label: t("gis.drainageTax"), value: inr(totals.drainageTax), sub: yearLabel },
    { label: t("gis.totalDemand"), value: inr(totals.totalDemand), sub: yearLabel },
  ]
  if (data.disclosure.collections) {
    tiles.push({ label: t("gis.collected"), value: inr(totals.collected), sub: yearLabel })
    tiles.push({ label: t("gis.outstanding"), value: inr(totals.outstanding), sub: yearLabel })
  }
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="card p-4">
          <dt className="text-sm text-ink-muted">{tile.label}</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-navy-900">{tile.value}</dd>
          {tile.sub ? <dd className="text-xs text-ink-muted">{t("gis.year")}: {tile.sub}</dd> : null}
        </div>
      ))}
    </dl>
  )
}

/** Single-series horizontal bars (magnitude). Exact values are in the table. */
function DemandChart({ t, wards }: { t: T; wards: WardStat[] }) {
  const values = wards.map((w) => Number(w.totalDemand))
  const max = Math.max(...values, 0)
  if (max <= 0) return null
  return (
    <figure className="card mt-10 p-5" aria-labelledby="chart-title">
      <figcaption>
        <h2 id="chart-title" className="text-lg font-bold">{t("gis.chartTitle")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("gis.chartNote")}</p>
      </figcaption>
      <ul className="mt-5 space-y-2" aria-hidden>
        {wards.map((w) => {
          const width = (Number(w.totalDemand) / max) * 100
          return (
            <li key={w.wardNumber} className="group grid grid-cols-[4.5rem_1fr] items-center gap-3 text-sm">
              <span className="text-ink-muted">{t("gis.ward")} {w.wardNumber}</span>
              <span className="relative flex h-6 items-center">
                <span
                  className="h-4 rounded-r-[4px] bg-teal-600 transition-opacity group-hover:opacity-80"
                  style={{ width: `${width}%` }}
                />
                <span className="ml-2 hidden whitespace-nowrap rounded bg-navy-900 px-2 py-0.5 text-xs text-white group-hover:inline">
                  {inr(w.totalDemand)}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}

function WardCard({ t, ward, disclose }: { t: T; ward: WardStat; disclose: boolean }) {
  const pct = ward.demandCoveragePct
  return (
    <article className="card relative flex h-full flex-col overflow-hidden p-5">
      <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-teal-600" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{t("gis.ward")} {ward.wardNumber}</p>
          <h3 className="mt-1 text-base leading-snug font-bold" lang="hi">{ward.wardName}</h3>
        </div>
        <span className="badge-navy whitespace-nowrap">{ward.propertiesSurveyed.toLocaleString("en-IN")}</span>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{t("gis.surveyed")}</p>

      <div className="mt-4">
        <p className="flex justify-between text-sm">
          <span className="font-semibold text-navy-800">{t("gis.coverage")}</span>
          <span className="tabular-nums">
            {pct === null ? "—" : `${pct}%`}
          </span>
        </p>
        {ward.propertiesSurveyed > 0 ? (
          <>
            <div
              role="progressbar"
              aria-label={t("gis.coverage")}
              aria-valuemin={0}
              aria-valuemax={ward.propertiesSurveyed}
              aria-valuenow={ward.propertiesWithPublishedDemand}
              aria-valuetext={`${ward.propertiesWithPublishedDemand} / ${ward.propertiesSurveyed}`}
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-line"
            >
              <div className="h-full rounded-full bg-navy-700" style={{ width: `${pct ?? 0}%` }} />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {ward.propertiesWithPublishedDemand.toLocaleString("en-IN")} / {ward.propertiesSurveyed.toLocaleString("en-IN")} {t("gis.coverageOf")}
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-ink-muted">{t("gis.noSurveys")}</p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
        <Figure label={t("gis.propertyTax")} value={inr(ward.propertyTax)} />
        <Figure label={t("gis.waterTax")} value={inr(ward.waterTax)} />
        <Figure label={t("gis.drainageTax")} value={inr(ward.drainageTax)} />
        <Figure label={t("gis.totalDemand")} value={inr(ward.totalDemand)} strong />
        {disclose ? (
          <>
            <Figure label={t("gis.collected")} value={inr(ward.collected)} />
            <Figure label={t("gis.outstanding")} value={inr(ward.outstanding)} />
          </>
        ) : null}
      </dl>
      <Link href={`/gis?ward=${ward.wardNumber}`} className="link mt-4 self-start text-sm">
        {t("gis.viewWard")}
      </Link>
    </article>
  )
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className={strong ? "font-bold text-navy-900 tabular-nums" : "tabular-nums"}>{value}</dd>
    </div>
  )
}

function WardTable({ t, wards, disclose }: { t: T; wards: WardStat[]; disclose: boolean }) {
  return (
    <section aria-labelledby="ward-table" className="mt-12">
      <h2 id="ward-table" className="mb-4 text-xl font-bold">{t("gis.table")}</h2>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-navy-50 text-left text-navy-800">
            <tr>
              <th scope="col" className="px-4 py-3">{t("gis.ward")}</th>
              <th scope="col" className="px-4 py-3 text-right">{t("gis.surveyed")}</th>
              <th scope="col" className="px-4 py-3 text-right">{t("gis.withDemand")}</th>
              <th scope="col" className="px-4 py-3 text-right">{t("gis.propertyTax")}</th>
              <th scope="col" className="px-4 py-3 text-right">{t("gis.waterTax")}</th>
              <th scope="col" className="px-4 py-3 text-right">{t("gis.drainageTax")}</th>
              <th scope="col" className="px-4 py-3 text-right">{t("gis.totalDemand")}</th>
              {disclose ? <th scope="col" className="px-4 py-3 text-right">{t("gis.collected")}</th> : null}
              {disclose ? <th scope="col" className="px-4 py-3 text-right">{t("gis.outstanding")}</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {wards.map((w) => (
              <tr key={w.wardNumber}>
                <th scope="row" className="px-4 py-2.5 text-left font-semibold">
                  {w.wardNumber} <span className="font-normal text-ink-muted" lang="hi">{w.wardName}</span>
                </th>
                <td className="px-4 py-2.5 text-right tabular-nums">{w.propertiesSurveyed.toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{w.propertiesWithPublishedDemand.toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{inr(w.propertyTax, { paise: true })}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{inr(w.waterTax, { paise: true })}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{inr(w.drainageTax, { paise: true })}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{inr(w.totalDemand, { paise: true })}</td>
                {disclose ? <td className="px-4 py-2.5 text-right tabular-nums">{inr(w.collected, { paise: true })}</td> : null}
                {disclose ? <td className="px-4 py-2.5 text-right tabular-nums">{inr(w.outstanding, { paise: true })}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
