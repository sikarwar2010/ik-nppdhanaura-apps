import { FileText, FolderOpen } from "lucide-react"

import { PageHeader } from "@/components/site/page-header"
import { EmptyState, LText, Section, SmartLink } from "@/components/site/primitives"
import { documents } from "@/content"
import { formatDate, getI18n, tx } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/documents", "documents.title", "documents.lead")

export default async function DocumentsPage() {
  const { locale, t } = await getI18n()

  return (
    <>
      <PageHeader title={t("documents.title")} lead={t("documents.lead")} crumbs={[{ label: t("nav.documents") }]} />
      <Section>
        {documents.length ? (
          <div className="card overflow-hidden">
            {/* Table on wide screens, stacked cards on phones. */}
            <table className="hidden w-full text-left md:table">
              <caption className="sr-only">{t("documents.title")}</caption>
              <thead className="border-b border-line bg-navy-50 text-sm text-navy-800">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">{t("documents.title")}</th>
                  <th scope="col" className="px-5 py-3 font-semibold">{t("label.category")}</th>
                  <th scope="col" className="px-5 py-3 font-semibold">{t("label.publisher")}</th>
                  <th scope="col" className="px-5 py-3 font-semibold">{t("label.format")}</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">{t("action.download")}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {documents.map((d) => (
                  <tr key={d.slug} className="align-top hover:bg-ivory">
                    <td className="px-5 py-4">
                      <LText as="p" text={d.title} locale={locale} className="font-semibold text-navy-900" />
                      {d.description && <LText as="p" text={d.description} locale={locale} className="mt-1 text-sm text-ink-muted" />}
                      {d.publishedOn && <p className="mt-1 text-xs text-ink-muted">{t("label.published")}: {formatDate(d.publishedOn, locale)}</p>}
                    </td>
                    <td className="px-5 py-4"><span className="badge-navy">{t(`category.${d.category}`)}</span></td>
                    <td className="px-5 py-4 text-sm">{tx(d.publisher, locale)}</td>
                    <td className="px-5 py-4 text-sm">{d.format}{d.sizeLabel ? ` · ${d.sizeLabel}` : ""}</td>
                    <td className="px-5 py-4 text-right">
                      <SmartLink href={d.file} externalLabel={t("label.externalNew")} className="btn-secondary whitespace-nowrap">
                        <FileText aria-hidden className="size-4" />
                        {t("action.open")}
                      </SmartLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-line md:hidden">
              {documents.map((d) => (
                <li key={d.slug} className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge-navy">{t(`category.${d.category}`)}</span>
                    <span className="badge-muted">{d.format}</span>
                  </div>
                  <LText as="p" text={d.title} locale={locale} className="mt-2 font-semibold text-navy-900" />
                  {d.description && <LText as="p" text={d.description} locale={locale} className="mt-1 text-sm text-ink-muted" />}
                  <p className="mt-1 text-sm text-ink-muted">{t("label.publisher")}: {tx(d.publisher, locale)}</p>
                  <SmartLink href={d.file} externalLabel={t("label.externalNew")} className="btn-secondary mt-3 w-full">
                    <FileText aria-hidden className="size-4" />
                    {t("action.open")}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState title={t("documents.none")} />
        )}
        <p role="note" className="mt-8 flex items-start gap-3 rounded-lg border border-dashed border-line-strong bg-white/60 p-5 text-sm text-ink-muted">
          <FolderOpen aria-hidden className="mt-0.5 size-5 shrink-0" />
          {t("documents.moreSoon")}
        </p>
      </Section>
    </>
  )
}
