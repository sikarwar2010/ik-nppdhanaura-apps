import { Archive, CalendarDays, Phone } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/site/page-header"
import { ActionButton, Section, ViewAllLink } from "@/components/site/primitives"
import { getNotice, notices, noticeStatus, site } from "@/content"
import { formatDate, getI18n, pick, tx } from "@/lib/i18n"
import { metadataFor } from "@/lib/seo"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return notices.map((n) => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const notice = getNotice(slug)
  if (!notice) return {}
  const { locale } = await getI18n()
  const body = locale === "en" && notice.body.en ? notice.body.en : notice.body.hi
  return metadataFor(`/notices/${slug}`, tx(notice.title, locale), body.join(" ").slice(0, 160))
}

export default async function NoticeDetailPage({ params }: Props) {
  const { slug } = await params
  const notice = getNotice(slug)
  if (!notice) notFound()
  const { locale, t } = await getI18n()
  const title = pick(notice.title, locale)
  const useEn = locale === "en" && notice.body.en
  const body = useEn ? notice.body.en! : notice.body.hi
  const status = noticeStatus(notice)

  return (
    <>
      <PageHeader
        title={title.value}
        titleLang={title.lang !== locale ? title.lang : undefined}
        crumbs={[{ label: t("nav.allNotices"), href: "/notices" }, { label: title.value }]}
      >
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-ink-muted">{t("label.category")}:</dt>
            <dd className="badge-navy">{t(`category.${notice.category}`)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays aria-hidden className="size-4 text-ink-muted" />
            <dt className="text-ink-muted">{t("label.published")}:</dt>
            <dd><time dateTime={notice.publishedOn}>{formatDate(notice.publishedOn, locale)}</time></dd>
          </div>
          {notice.eventDate && (
            <div className="flex items-center gap-1.5">
              <dt className="text-ink-muted">{t("label.eventDate")}:</dt>
              <dd><time dateTime={notice.eventDate}>{formatDate(notice.eventDate, locale)}</time></dd>
            </div>
          )}
        </dl>
      </PageHeader>

      <Section>
        <div className="mx-auto max-w-3xl">
          {status === "archived" && (
            <p role="note" className="mb-6 flex items-start gap-3 rounded-lg border border-line-strong bg-ivory-200 p-4 text-sm text-ink">
              <Archive aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
              {t("notices.archivedBanner")}
            </p>
          )}
          <article className="card p-6 sm:p-8" lang={useEn || locale === "hi" ? undefined : "hi"}>
            {locale === "en" && !useEn && <p className="mb-4 text-sm text-ink-muted" lang="en">{t("label.hindiOnly")}</p>}
            <div className="prose-civic">
              {body.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            {notice.attachments.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
                {notice.attachments.map((a) => (
                  <li key={a.href}><ActionButton action={a} locale={locale} externalLabel={t("label.externalNew")} /></li>
                ))}
              </ul>
            )}
          </article>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-muted">
            <p className="flex items-center gap-2">
              <Phone aria-hidden className="size-4" />
              {tx(site.name, locale)}: <a href={site.contact.phoneHref} className="link">{site.contact.phone}</a>
            </p>
            <ViewAllLink href="/notices">{t("nav.allNotices")}</ViewAllLink>
          </div>
        </div>
      </Section>
    </>
  )
}
