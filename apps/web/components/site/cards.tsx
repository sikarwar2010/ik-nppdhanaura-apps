import { ArrowRight, CalendarDays, Images, Quote } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { noticeStatus } from "@/content"
import type { GalleryAlbum, Notice, Person, Service, TeamPortrait } from "@/content/schema"
import { formatDate, pick, tx, translator, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { ServiceIcon } from "./icons"
import { LText } from "./primitives"

export function NoticeRow({ notice, locale }: { notice: Notice; locale: Locale }) {
  const t = translator(locale)
  const status = noticeStatus(notice)
  const [y, m, d] = notice.publishedOn.split("-")
  const month = new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  )
  return (
    <article className="card-interactive group relative flex gap-4 p-4 sm:p-5">
      <div aria-hidden className="flex w-16 shrink-0 flex-col items-center justify-center rounded-md bg-navy-50 py-2 text-navy-800">
        <span className="text-2xl leading-none font-bold">{Number(d)}</span>
        <span className="mt-1 text-xs font-semibold">{month}</span>
        <span className="text-[0.6875rem] text-ink-muted">{y}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="badge-navy">{t(`category.${notice.category}`)}</span>
          <span className={status === "current" ? "badge-teal" : "badge-muted"}>
            {status === "current" ? t("label.current") : t("label.archived")}
          </span>
        </div>
        <h3 className="text-lg leading-snug font-semibold">
          <Link href={`/notices/${notice.slug}`} className="after:absolute after:inset-0 hover:text-teal-ink">
            <LText text={notice.title} locale={locale} />
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          {t("label.published")}: <time dateTime={notice.publishedOn}>{formatDate(notice.publishedOn, locale)}</time>
          {notice.eventDate && (
            <>
              {" · "}
              {t("label.eventDate")}: <time dateTime={notice.eventDate}>{formatDate(notice.eventDate, locale)}</time>
            </>
          )}
        </p>
      </div>
      <ArrowRight aria-hidden className="mt-1 hidden size-5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-teal-ink sm:block" />
    </article>
  )
}

export function ServiceCard({ service, locale }: { service: Service; locale: Locale }) {
  const t = translator(locale)
  return (
    <article className="card-interactive group relative flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-lg bg-teal-50 text-teal-ink ring-1 ring-teal-100 transition-colors group-hover:bg-navy-800 group-hover:text-white">
          <ServiceIcon name={service.icon} className="size-6" />
        </span>
        <span className={service.mode === "online" ? "badge-teal" : "badge-muted"}>
          {service.mode === "online" ? t("label.online") : t("label.information")}
        </span>
      </div>
      <h3 className="text-lg font-semibold">
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 group-hover:text-teal-ink">
          <LText text={service.title} locale={locale} />
        </Link>
      </h3>
      <LText as="p" text={service.summary} locale={locale} className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted" />
      <span aria-hidden className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-ink">
        {t("action.details")}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </article>
  )
}

export function PortraitCard({
  person,
  locale,
  showMessage = false,
  size = "md",
}: {
  person: Person
  locale: Locale
  showMessage?: boolean
  size?: "sm" | "md"
}) {
  const t = translator(locale)
  return (
    <figure className={cn("card flex h-full flex-col overflow-hidden", showMessage && person.message && "sm:flex-row")}>
      {person.photo && (
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-gradient-to-b from-navy-50 to-ivory-200",
            showMessage && person.message ? "aspect-[4/5] sm:aspect-auto sm:w-52 lg:w-40 xl:w-52" : "aspect-[4/5]",
            size === "sm" && "aspect-square"
          )}
        >
          <Image
            src={person.photo.src}
            alt={tx(person.photo.alt, locale)}
            fill
            sizes={showMessage ? "(min-width: 640px) 224px, 100vw" : "(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw"}
            className="object-cover"
            style={{ objectPosition: person.photoPosition }}
          />
        </div>
      )}
      <figcaption className="flex flex-1 flex-col p-5">
        <p className="eyebrow">
          <LText text={person.designation} locale={locale} />
        </p>
        <p className="mt-1 text-lg font-bold text-navy-900">
          <LText text={person.name} locale={locale} />
        </p>
        {showMessage && person.message && (
          <blockquote className="relative mt-4 border-l-[3px] border-saffron-500 pl-4 text-[0.98rem] leading-relaxed text-ink">
            <Quote aria-hidden className="absolute -top-1 right-0 size-6 text-navy-100" />
            <span className="sr-only">{t("admin.message")}: </span>
            <LText as="p" text={person.message} locale={locale} />
          </blockquote>
        )}
      </figcaption>
    </figure>
  )
}

export function TeamPortraitCard({ portrait, locale }: { portrait: TeamPortrait; locale: Locale }) {
  return (
    <figure className="card overflow-hidden">
      <div className="relative aspect-[4/5] bg-navy-50">
        <Image src={portrait.photo.src} alt={tx(portrait.photo.alt, locale)} fill sizes="(min-width: 1024px) 280px, 50vw" className="object-cover object-top" />
      </div>
      <figcaption className="p-5">
        {portrait.designation && <LText as="p" text={portrait.designation} locale={locale} className="eyebrow" />}
        {portrait.name && <LText as="p" text={portrait.name} locale={locale} className="mt-1 text-lg font-bold text-navy-900" />}
      </figcaption>
    </figure>
  )
}

export function AlbumCard({ album, locale, headingLevel = 3 }: { album: GalleryAlbum; locale: Locale; headingLevel?: 2 | 3 }) {
  const t = translator(locale)
  const cover = album.images[0]!
  const Heading = headingLevel === 2 ? "h2" : "h3"
  const title = pick(album.title, locale)
  return (
    <article className="card-interactive group relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-navy-50">
        <Image
          src={cover.src}
          alt={tx(cover.alt, locale)}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
        />
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-navy-950/75 px-2.5 py-1 text-xs font-semibold text-white">
          <Images aria-hidden className="size-3.5" />
          {album.images.length} {t("label.photos")}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
          <CalendarDays aria-hidden className="size-4" />
          <time dateTime={album.date}>{formatDate(album.date, locale)}</time>
        </p>
        <Heading lang={title.lang !== locale ? title.lang : undefined} className="mt-2 line-clamp-3 text-base leading-snug font-semibold">
          <Link href={`/gallery/${album.slug}`} className="after:absolute after:inset-0 group-hover:text-teal-ink">
            {title.value}
          </Link>
        </Heading>
      </div>
    </article>
  )
}
