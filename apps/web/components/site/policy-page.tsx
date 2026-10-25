import { Mail } from "lucide-react"

import { policies } from "@/content/policies"
import { site } from "@/content"
import { getI18n, tx } from "@/lib/i18n"

import { PageHeader } from "./page-header"
import { LText, Section } from "./primitives"

export async function PolicyPage({ policy }: { policy: keyof typeof policies }) {
  const { locale, t } = await getI18n()
  const p = policies[policy]
  return (
    <>
      <PageHeader title={tx(p.title, locale)} lead={tx(p.lead, locale)} crumbs={[{ label: tx(p.title, locale) }]} />
      <Section>
        <div className="mx-auto max-w-3xl space-y-8">
          {p.sections.map((s, i) => (
            <section key={i} aria-labelledby={`policy-${i}`}>
              <h2 id={`policy-${i}`} className="text-xl font-bold"><LText text={s.heading} locale={locale} /></h2>
              <div className="prose-civic mt-3">
                {s.body.map((b, j) => <LText key={j} as="p" text={b} locale={locale} />)}
              </div>
            </section>
          ))}
          <p className="flex items-center gap-2 border-t border-line pt-6 text-sm text-ink-muted">
            <Mail aria-hidden className="size-4" />
            {t("label.email")}: <a className="link" href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          </p>
        </div>
      </Section>
    </>
  )
}
