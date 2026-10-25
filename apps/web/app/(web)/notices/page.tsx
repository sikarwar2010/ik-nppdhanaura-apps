import { Archive, BellRing } from "lucide-react"

import { NoticeRow } from "@/components/site/cards"
import { PageHeader } from "@/components/site/page-header"
import { EmptyState, Section } from "@/components/site/primitives"
import { notices, noticeStatus } from "@/content"
import { getI18n } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/notices", "notices.title", "notices.lead")

export default async function NoticesPage() {
  const { locale, t } = await getI18n()
  const current = notices.filter((n) => noticeStatus(n) === "current")
  const archived = notices.filter((n) => noticeStatus(n) === "archived")

  return (
    <>
      <PageHeader title={t("notices.title")} lead={t("notices.lead")} crumbs={[{ label: t("nav.allNotices") }]} />
      <Section>
        <div className="mx-auto max-w-4xl space-y-12">
          <section aria-labelledby="current">
            <h2 id="current" className="mb-4 flex items-center gap-2 text-xl font-bold">
              <BellRing aria-hidden className="size-5 text-teal-ink" />
              {t("notices.current")}
              <span className="badge-teal">{current.length}</span>
            </h2>
            {current.length ? (
              <div className="space-y-3">
                {current.map((n) => <NoticeRow key={n.slug} notice={n} locale={locale} />)}
              </div>
            ) : (
              <EmptyState title={t("home.noCurrent")}>{t("notices.noneCurrent")}</EmptyState>
            )}
          </section>
          <section aria-labelledby="archive">
            <h2 id="archive" className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Archive aria-hidden className="size-5 text-ink-muted" />
              {t("notices.archive")}
              <span className="badge-muted">{archived.length}</span>
            </h2>
            {archived.length ? (
              <div className="space-y-3">
                {archived.map((n) => <NoticeRow key={n.slug} notice={n} locale={locale} />)}
              </div>
            ) : (
              <EmptyState title={t("empty.generic")} />
            )}
          </section>
        </div>
      </Section>
    </>
  )
}
