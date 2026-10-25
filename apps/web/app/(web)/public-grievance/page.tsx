import { Building2, Clock, Globe, Mail, Phone, ShieldAlert } from "lucide-react"

import { PageHeader } from "@/components/site/page-header"
import { Section, SmartLink } from "@/components/site/primitives"
import { site } from "@/content"
import { getI18n, tx } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/public-grievance", "grievance.title", "grievance.lead")

/**
 * Grievance pathway. There is no grievance backend for this site, so it
 * points to the official portal (as the source site does) and the office.
 */
export default async function GrievancePage() {
  const { locale, t } = await getI18n()
  return (
    <>
      <PageHeader
        title={t("grievance.title")}
        lead={t("grievance.lead")}
        crumbs={[{ label: t("nav.services"), href: "/services" }, { label: t("nav.grievance") }]}
      />
      <Section>
        <p role="note" className="mb-8 flex items-start gap-3 rounded-lg border border-navy-100 bg-navy-50 p-4 text-sm text-navy-900">
          <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-navy-700" />
          {t("grievance.notice")}
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <section aria-labelledby="online" className="card flex flex-col p-6">
            <Globe aria-hidden className="size-8 text-teal-ink" />
            <h2 id="online" className="mt-4 text-xl font-bold">{t("grievance.online")}</h2>
            <p className="mt-2 flex-1 text-ink-muted">
              {locale === "hi"
                ? "केंद्रीकृत लोक शिकायत निवारण और निगरानी प्रणाली (CPGRAMS) पर पंजीकरण करें, शिकायत दर्ज करें और उसकी स्थिति देखें।"
                : "Register on the Centralised Public Grievance Redress and Monitoring System (CPGRAMS), file your grievance and track its status."}
            </p>
            <p className="mt-3 text-sm text-ink-muted">pgportal.gov.in</p>
            <SmartLink href="https://pgportal.gov.in/Registration" externalLabel={t("label.externalNew")} className="btn-primary mt-5">
              {locale === "hi" ? "शिकायत दर्ज करें" : "Register Grievance"}
            </SmartLink>
          </section>
          <section aria-labelledby="office" className="card flex flex-col p-6">
            <Building2 aria-hidden className="size-8 text-teal-ink" />
            <h2 id="office" className="mt-4 text-xl font-bold">{t("grievance.office")}</h2>
            <ul className="mt-4 space-y-3">
              <li className="flex gap-3"><Phone aria-hidden className="mt-0.5 size-5 text-ink-muted" /><a className="link" href={site.contact.phoneHref}>{site.contact.phone}</a></li>
              <li className="flex gap-3"><Mail aria-hidden className="mt-0.5 size-5 text-ink-muted" /><a className="link break-all" href={`mailto:${site.contact.email}`}>{site.contact.email}</a></li>
              <li className="flex gap-3"><Clock aria-hidden className="mt-0.5 size-5 text-ink-muted" />{tx(site.contact.hours, locale)}</li>
            </ul>
            <p className="mt-4 text-sm text-ink-muted">{tx(site.contact.address, locale)}</p>
          </section>
        </div>
      </Section>
    </>
  )
}
