import { Siren } from "lucide-react"

import { ServiceCard } from "@/components/site/cards"
import { PageHeader } from "@/components/site/page-header"
import { LText, Section } from "@/components/site/primitives"
import { services, site } from "@/content"
import { getI18n } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/services", "services.title", "services.lead")

export default async function ServicesPage() {
  const { locale, t } = await getI18n()
  return (
    <>
      <PageHeader title={t("services.title")} lead={t("services.lead")} crumbs={[{ label: t("nav.services") }]} />
      <Section>
        <h2 className="sr-only">{t("nav.allServices")}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((s) => (
            <li key={s.slug}>
              <ServiceCard service={s} locale={locale} />
            </li>
          ))}
        </ul>

        <section aria-labelledby="emergency" className="mt-12 rounded-xl border border-saffron-100 bg-saffron-50 p-6">
          <h2 id="emergency" className="flex items-center gap-2 text-lg font-bold">
            <Siren aria-hidden className="size-5 text-saffron-ink" />
            {t("services.emergency")}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {site.emergency.map((e) => (
              <li key={e.numbers[0]} className="rounded-lg bg-white p-4 ring-1 ring-saffron-100">
                <LText as="p" text={e.label} locale={locale} className="text-sm text-ink-muted" />
                <p className="mt-1 flex flex-wrap gap-x-3 text-2xl font-bold text-navy-900">
                  {e.numbers.map((n) => (
                    <a key={n} href={`tel:${n}`} className="hover:underline">{n}</a>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </Section>
    </>
  )
}
