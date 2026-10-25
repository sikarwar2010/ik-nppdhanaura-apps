import { Contact, MapPinned } from "lucide-react"
import Link from "next/link"

import { PortraitCard, TeamPortraitCard } from "@/components/site/cards"
import { PageHeader } from "@/components/site/page-header"
import { EmptyState, Section, SectionHeading } from "@/components/site/primitives"
import { people, teamPortraits } from "@/content"
import { getI18n } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/administration", "admin.title", "admin.lead")

export default async function AdministrationPage() {
  const { locale, t } = await getI18n()
  const municipal = people.filter((p) => p.group === "municipal")
  const patrons = people.filter((p) => p.group === "patron")

  return (
    <>
      <PageHeader
        title={t("admin.title")}
        lead={t("admin.lead")}
        crumbs={[{ label: t("nav.administration") }, { label: t("nav.leadership") }]}
      />

      <Section labelledBy="municipal">
        <SectionHeading id="municipal" title={t("admin.municipal")} />
        <div className="grid gap-5 lg:grid-cols-2">
          {municipal.map((p) => (
            <PortraitCard key={p.id} person={p} locale={locale} showMessage />
          ))}
        </div>
      </Section>

      {teamPortraits.length > 0 && (
        <Section labelledBy="team" tone="white">
          <SectionHeading id="team" title={t("admin.team")} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {teamPortraits.map((p) => (
              <li key={p.id}><TeamPortraitCard portrait={p} locale={locale} /></li>
            ))}
          </ul>
        </Section>
      )}

      <Section labelledBy="patrons" tone="tint">
        <SectionHeading id="patrons" title={t("admin.patrons")} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {patrons.map((p) => (
            <li key={p.id}><PortraitCard person={p} locale={locale} /></li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="directory">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <SectionHeading id="directory" title={t("admin.directory")} className="mb-5" />
            <EmptyState title={t("admin.directory")} icon={Contact}>
              <p>{t("admin.directoryEmpty")}</p>
              <Link href="/contact" className="link mt-3 inline-block">{t("nav.contact")}</Link>
            </EmptyState>
          </div>
          <div>
            <SectionHeading title={t("admin.wards")} className="mb-5" />
            <EmptyState title={t("admin.wards")} icon={MapPinned}>
              <p>{t("admin.wardsEmpty")}</p>
            </EmptyState>
          </div>
        </div>
      </Section>
    </>
  )
}
