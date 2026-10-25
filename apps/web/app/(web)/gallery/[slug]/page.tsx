import { CalendarDays } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { GalleryGrid } from "@/components/site/gallery-lightbox"
import { PageHeader } from "@/components/site/page-header"
import { Section, ViewAllLink } from "@/components/site/primitives"
import { galleryAlbums, getAlbum } from "@/content"
import { formatDate, getI18n, pick, tx } from "@/lib/i18n"
import { metadataFor } from "@/lib/seo"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return galleryAlbums.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const album = getAlbum(slug)
  if (!album) return {}
  const { locale, t } = await getI18n()
  const meta = metadataFor(`/gallery/${slug}`, tx(album.title, locale).slice(0, 70), t("gallery.lead"))
  const cover = album.images[0]!
  return { ...meta, openGraph: { ...meta.openGraph, images: [{ url: cover.src, width: cover.width, height: cover.height }] } }
}

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params
  const album = getAlbum(slug)
  if (!album) notFound()
  const { locale, t } = await getI18n()
  const title = pick(album.title, locale)

  return (
    <>
      <PageHeader
        title={title.value}
        titleLang={title.lang !== locale ? title.lang : undefined}
        crumbs={[{ label: t("nav.gallery"), href: "/gallery" }, { label: title.value.length > 40 ? `${title.value.slice(0, 40)}…` : title.value }]}
      >
        <p className="mt-4 flex items-center gap-2 text-ink-muted">
          <CalendarDays aria-hidden className="size-4" />
          <time dateTime={album.date}>{formatDate(album.date, locale)}</time>
          <span aria-hidden>·</span>
          {album.images.length} {t("label.photos")}
        </p>
      </PageHeader>
      <Section>
        <GalleryGrid
          images={album.images.map((img) => ({ src: img.src, width: img.width, height: img.height, alt: tx(img.alt, locale) }))}
          labels={{ open: t("gallery.open"), close: t("gallery.close"), prev: t("gallery.prev"), next: t("gallery.next"), of: t("gallery.of") }}
        />
        <div className="mt-8">
          <ViewAllLink href="/gallery">{t("gallery.title")}</ViewAllLink>
        </div>
      </Section>
    </>
  )
}
