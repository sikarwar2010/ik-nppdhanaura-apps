import { AlbumCard } from "@/components/site/cards"
import { PageHeader } from "@/components/site/page-header"
import { EmptyState, Section } from "@/components/site/primitives"
import { galleryAlbums } from "@/content"
import { getI18n } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/news", "news.title", "news.lead")

/** Event reports come from the dated albums published on the source site. */
export default async function NewsPage() {
  const { locale, t } = await getI18n()
  return (
    <>
      <PageHeader
        title={t("news.title")}
        lead={t("news.lead")}
        crumbs={[{ label: t("nav.allNotices"), href: "/notices" }, { label: t("nav.news") }]}
      />
      <Section>
        {galleryAlbums.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {galleryAlbums.map((a) => (
              <li key={a.slug}><AlbumCard album={a} locale={locale} headingLevel={2} /></li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t("empty.generic")} />
        )}
      </Section>
    </>
  )
}
