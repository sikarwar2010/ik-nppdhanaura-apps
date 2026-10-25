import { Gavel } from "lucide-react"

import { NoticeRow } from "@/components/site/cards"
import { PageHeader } from "@/components/site/page-header"
import { EmptyState, Section, SmartLink } from "@/components/site/primitives"
import { ETENDER_URL, notices } from "@/content"
import { getI18n } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/tenders", "tenders.title", "tenders.lead")

export default async function TendersPage() {
  const { locale, t } = await getI18n()
  const tenderNotices = notices.filter((n) => n.category === "tender")
  const steps = [t("tenders.step1"), t("tenders.step2"), t("tenders.step3")]

  return (
    <>
      <PageHeader title={t("tenders.title")} lead={t("tenders.lead")} crumbs={[{ label: t("nav.tenders") }]} />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
          <div className="space-y-10">
            <section aria-labelledby="how" className="card p-6 sm:p-8">
              <h2 id="how" className="text-xl font-bold">{t("tenders.how")}</h2>
              <p className="mt-3 text-ink-muted">{t("home.tendersBody")}</p>
              <ol className="mt-6 space-y-4">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white">{i + 1}</span>
                    <p className="pt-1">{s}</p>
                  </li>
                ))}
              </ol>
            </section>
            <section aria-labelledby="local">
              <h2 id="local" className="mb-4 text-xl font-bold">{t("tenders.local")}</h2>
              {tenderNotices.length ? (
                <div className="space-y-3">{tenderNotices.map((n) => <NoticeRow key={n.slug} notice={n} locale={locale} />)}</div>
              ) : (
                <EmptyState title={t("empty.generic")} icon={Gavel}>{t("tenders.noneLocal")}</EmptyState>
              )}
            </section>
          </div>
          <aside className="relative h-fit overflow-hidden rounded-xl bg-navy-800 p-6 text-white">
            <div aria-hidden className="jaali absolute inset-0 opacity-[0.06]" />
            <div className="relative">
              <Gavel aria-hidden className="size-8 text-saffron-500" />
              <p className="mt-4 text-lg font-bold">e-Tender UP</p>
              <p className="mt-1 text-sm break-all text-white/75">etender.up.nic.in</p>
              <SmartLink href={ETENDER_URL} externalLabel={t("label.externalNew")} className="btn-accent mt-6 w-full">
                {t("action.etender")}
              </SmartLink>
            </div>
          </aside>
        </div>
      </Section>
    </>
  )
}
