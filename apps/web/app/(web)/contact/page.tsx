import { Clock, Mail, MapPin, MessageSquareWarning, Phone } from "lucide-react"
import Link from "next/link"

import { MapEmbed } from "@/components/site/map-embed"
import { PageHeader } from "@/components/site/page-header"
import { LText, Section } from "@/components/site/primitives"
import { site } from "@/content"
import { getI18n, tx } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/contact", "contact.title", "contact.lead")

export default async function ContactPage() {
  const { locale, t } = await getI18n()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOffice",
    name: site.name.en,
    alternateName: site.name.hi,
    telephone: `+91${site.contact.phone}`,
    email: site.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Palika Market",
      addressLocality: "Dhanaura",
      addressRegion: "Uttar Pradesh",
      postalCode: "244231",
      addressCountry: "IN",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "17:00",
    },
  }
  const rows = [
    { icon: MapPin, label: t("label.address"), value: tx(site.contact.address, locale) },
    { icon: Phone, label: t("label.phone"), value: <a className="link" href={site.contact.phoneHref}>{site.contact.phone}</a> },
    { icon: Mail, label: t("label.email"), value: <a className="link break-all" href={`mailto:${site.contact.email}`}>{site.contact.email}</a> },
    { icon: Clock, label: t("label.hours"), value: tx(site.contact.hours, locale) },
  ]

  return (
    <>
      <PageHeader title={t("contact.title")} lead={t("contact.lead")} crumbs={[{ label: t("nav.contact") }]} />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[24rem_1fr]">
          <div className="space-y-5">
            <section aria-labelledby="office" className="card p-6">
              <h2 id="office" className="text-lg font-bold">
                {t("contact.office")} — <LText text={site.name} locale={locale} />
              </h2>
              <dl className="mt-5 space-y-5">
                {rows.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="min-w-0">
                    <dt className="flex items-center gap-2 text-sm text-ink-muted">
                      <Icon aria-hidden className="size-5 shrink-0 text-teal-ink" />
                      {label}
                    </dt>
                    <dd className="mt-0.5 pl-7 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section aria-labelledby="grievance" className="rounded-lg border border-saffron-100 bg-saffron-50 p-6">
              <h2 id="grievance" className="flex items-center gap-2 text-lg font-bold">
                <MessageSquareWarning aria-hidden className="size-5 text-saffron-ink" />
                {t("contact.grievance")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed">{t("contact.grievanceBody")}</p>
              <Link href="/public-grievance" className="btn-primary mt-4">{t("grievance.title")}</Link>
            </section>
          </div>
          <section aria-labelledby="map">
            <h2 id="map" className="mb-4 text-lg font-bold">{t("contact.map")}</h2>
            <MapEmbed
              query={site.contact.mapQuery}
              labels={{ show: t("action.showMap"), note: t("contact.mapNote"), title: t("contact.map"), directions: t("action.directions") }}
            />
          </section>
        </div>
      </Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  )
}
