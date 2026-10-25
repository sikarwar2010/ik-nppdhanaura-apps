import Link from "next/link"

import { PageHeader } from "@/components/site/page-header"
import { Section } from "@/components/site/primitives"
import { galleryAlbums, notices, services } from "@/content"
import { getI18n, tx } from "@/lib/i18n"
import { staticRoutes } from "@/lib/routes"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/site-map", "sitemap.title", "sitemap.lead")

export default async function SiteMapPage() {
  const { locale, t } = await getI18n()
  const link = "link inline-flex min-h-9 items-center"
  const dynamic = [
    { title: t("nav.services"), items: services.map((s) => ({ href: `/services/${s.slug}`, label: tx(s.title, locale) })) },
    { title: t("nav.allNotices"), items: notices.map((n) => ({ href: `/notices/${n.slug}`, label: tx(n.title, locale) })) },
    { title: t("nav.gallery"), items: galleryAlbums.map((a) => ({ href: `/gallery/${a.slug}`, label: tx(a.title, locale) })) },
  ]
  return (
    <>
      <PageHeader title={t("sitemap.title")} lead={t("sitemap.lead")} crumbs={[{ label: t("sitemap.title") }]} />
      <Section>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {staticRoutes.map((g) => (
            <section key={g.group} aria-labelledby={`sm-${g.group}`}>
              <h2 id={`sm-${g.group}`} className="mb-3 text-lg font-bold">{t(g.group)}</h2>
              <ul>
                {g.items.map((i) => <li key={i.href}><Link href={i.href} className={link}>{t(i.key)}</Link></li>)}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-12 grid gap-10 border-t border-line pt-10 lg:grid-cols-3">
          {dynamic.map((g) => (
            <section key={g.title} aria-labelledby={`smd-${g.title}`}>
              <h2 id={`smd-${g.title}`} className="mb-3 text-lg font-bold">{g.title}</h2>
              <ul className="space-y-1">
                {g.items.map((i) => <li key={i.href}><Link href={i.href} className="link">{i.label}</Link></li>)}
              </ul>
            </section>
          ))}
        </div>
      </Section>
    </>
  )
}
