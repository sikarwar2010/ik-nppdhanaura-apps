import { Info } from "lucide-react"

import { PageHeader } from "@/components/site/page-header"
import { LText, Section, SmartLink } from "@/components/site/primitives"
import { schemes } from "@/content"
import { getI18n } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/schemes", "schemes.title", "schemes.lead")

export default async function SchemesPage() {
  const { locale, t } = await getI18n()
  return (
    <>
      <PageHeader
        title={t("schemes.title")}
        lead={t("schemes.lead")}
        crumbs={[{ label: t("nav.services"), href: "/services" }, { label: t("nav.schemes") }]}
      />
      <Section>
        <p className="mb-6 flex items-start gap-2 text-sm text-ink-muted">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("schemes.note")}
        </p>
        <ul className="grid gap-5 md:grid-cols-2">
          {schemes.map((s) => (
            <li key={s.slug} id={s.slug} className="card flex scroll-mt-24 flex-col p-6">
              <LText as="h2" text={s.name} locale={locale} className="text-lg font-bold" />
              {s.description && <LText as="p" text={s.description} locale={locale} className="mt-3 flex-1 leading-relaxed text-ink" />}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <span className="text-sm break-all text-ink-muted">{new URL(s.link.href).hostname}</span>
                <SmartLink href={s.link.href} externalLabel={t("label.externalNew")} className="btn-secondary">
                  <LText text={s.link.label} locale={locale} />
                </SmartLink>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
