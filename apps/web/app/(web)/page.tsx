import { ArrowRight, Clock, Gavel, Mail, MapPin, Phone } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { AlbumCard, NoticeRow, PortraitCard, ServiceCard, TeamPortraitCard } from "@/components/site/cards"
import { ServiceIcon } from "@/components/site/icons"
import { MapEmbed } from "@/components/site/map-embed"
import { EmptyState, LText, Section, SectionHeading, SmartLink, ViewAllLink } from "@/components/site/primitives"
import {
  about,
  ETENDER_URL,
  galleryAlbums,
  importantLinks,
  notices,
  noticeStatus,
  people,
  schemes,
  services,
  site,
  siteImages,
  teamPortraits,
} from "@/content"
import { getI18n, tx } from "@/lib/i18n"

export default async function HomePage() {
  const { locale, t } = await getI18n()
  const current = notices.filter((n) => noticeStatus(n) === "current")
  const archived = notices.filter((n) => noticeStatus(n) === "archived").slice(0, 3)
  const quick = ["birth-death-certificate", "property-water-tax", "trade-license", "grievance-registration"]
    .map((slug) => services.find((s) => s.slug === slug))
    .filter((s) => s !== undefined)
  const municipal = people.filter((p) => p.group === "municipal")
  const patrons = people.filter((p) => p.group === "patron")
  const galleryPhotos = galleryAlbums.flatMap((a) => a.images.slice(0, 2).map((img) => ({ img, album: a }))).slice(0, 6)
  const extLabel = t("label.externalNew")

  return (
    <>
      {/* D. Hero */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-navy-900">
        <Image
          src={siteImages.hero.src}
          alt={tx(siteImages.hero.alt, locale)}
          fill
          preload
          sizes="100vw"
          className="-z-20 object-cover object-[60%_40%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/95 via-navy-900/80 to-navy-900/20" />
        <div aria-hidden className="jaali absolute inset-y-0 left-0 -z-10 w-2/3 opacity-[0.05]" />
        <div className="container-site pt-14 pb-28 sm:pt-20 sm:pb-36 lg:pt-24">
          <div className="max-w-2xl text-white">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              <MapPin aria-hidden className="size-4 text-saffron-500" />
              {t("hero.eyebrow")}
            </p>
            <h1 id="hero-title" className="text-[2rem] leading-[1.2] font-bold tracking-tight text-white sm:text-display">
              {t("hero.title")}
            </h1>
            <p className="mt-3 text-lg font-medium text-white/85 sm:text-xl" lang={locale === "hi" ? "en" : "hi"}>
              {t("hero.subtitle")}
            </p>
            <LText as="p" text={about.intro[0]!} locale={locale} className="mt-5 max-w-xl leading-relaxed text-white/85" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services" className="btn-accent">
                {t("hero.ctaServices")}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link href="/notices" className="btn-ghost-light">
                {t("hero.ctaNotices")}
              </Link>
            </div>
          </div>
        </div>
        <p className="absolute right-4 bottom-24 hidden text-xs text-white/70 sm:block">{t("hero.photoCredit")}</p>
      </section>

      {/* Quick access strip overlapping the hero */}
      <div className="container-site relative z-10 -mt-20">
        <h2 className="sr-only">{t("home.quickAccess")}</h2>
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-(--shadow-raised) lg:grid-cols-4">
          {quick.map((s) => (
            <li key={s.slug} className="bg-white">
              <Link
                href={`/services/${s.slug}`}
                className="group flex h-full min-h-24 bg-white flex-col items-start gap-2 p-4 hover:bg-navy-50 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-white transition-colors group-hover:bg-teal-600">
                  <ServiceIcon name={s.icon} className="size-5" />
                </span>
                <span className="min-w-0">
                  <LText text={s.title} locale={locale} className="block leading-snug font-semibold text-navy-900" />
                  <span className="mt-0.5 hidden text-xs text-ink-muted sm:block">
                    {s.mode === "online" ? t("label.online") : t("label.information")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* E. Announcements + tenders */}
      <Section labelledBy="announcements">
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            <SectionHeading
              id="announcements"
              title={t("home.announcements")}
              lead={t("home.announcementsLead")}
              action={<ViewAllLink href="/notices">{t("action.viewAll")}</ViewAllLink>}
            />
            {current.length > 0 ? (
              <div className="space-y-3">
                {current.slice(0, 4).map((n) => (
                  <NoticeRow key={n.slug} notice={n} locale={locale} />
                ))}
              </div>
            ) : (
              <>
                <EmptyState title={t("home.noCurrent")} />
                {archived.length > 0 && (
                  <>
                    <h3 className="mt-8 mb-3 text-sm font-semibold tracking-wider text-ink-muted uppercase">
                      {t("home.recentArchived")}
                    </h3>
                    <div className="space-y-3">
                      {archived.map((n) => (
                        <NoticeRow key={n.slug} notice={n} locale={locale} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <aside aria-labelledby="tenders-card" className="card relative h-fit overflow-hidden p-6 lg:mt-[6.5rem]">
            <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-saffron-500" />
            <span className="inline-flex size-11 items-center justify-center rounded-lg bg-saffron-50 text-saffron-ink">
              <Gavel aria-hidden className="size-5" />
            </span>
            <h3 id="tenders-card" className="mt-4 text-lg font-bold">{t("home.tenders")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("home.tendersBody")}</p>
            <div className="mt-5 flex flex-col gap-2">
              <SmartLink href={ETENDER_URL} externalLabel={extLabel} className="btn-primary">
                {t("action.etender")}
              </SmartLink>
              <Link href="/tenders" className="btn-secondary">{t("action.details")}</Link>
            </div>
          </aside>
        </div>
      </Section>

      {/* F. Citizen services */}
      <Section labelledBy="services" tone="white">
        <SectionHeading
          id="services"
          eyebrow={t("nav.services")}
          title={t("home.services")}
          lead={t("home.servicesLead")}
          action={<ViewAllLink href="/services">{t("action.viewAll")}</ViewAllLink>}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.slug}>
              <ServiceCard service={s} locale={locale} />
            </li>
          ))}
        </ul>
      </Section>

      {/* G. About */}
      <Section labelledBy="about">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading id="about" eyebrow={t("nav.about")} title={t("home.about")} className="mb-6" />
            <div className="prose-civic">
              {about.intro.map((p, i) => (
                <LText key={i} as="p" text={p} locale={locale} />
              ))}
            </div>
            <blockquote className="mt-6 rounded-lg border border-teal-100 bg-teal-50 p-5">
              <p className="text-sm font-semibold text-teal-ink"><LText text={about.vision.title} locale={locale} /></p>
              <p className="mt-1 text-xl font-bold text-navy-900"><LText text={about.slogan} locale={locale} /></p>
            </blockquote>
            <div className="mt-6">
              <ViewAllLink href="/about">{t("action.readMore")}</ViewAllLink>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-xl">
              <Image src={siteImages.park.src} alt={tx(siteImages.park.alt, locale)} fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image src={siteImages.office.src} alt={tx(siteImages.office.alt, locale)} fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center rounded-xl bg-navy-800 p-5 text-white">
              <p className="text-sm text-white/75">{t("label.hours")}</p>
              <p className="mt-1 font-semibold">{tx(site.contact.hours, locale)}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* H. Leadership */}
      <Section labelledBy="leadership" tone="white">
        <SectionHeading
          id="leadership"
          eyebrow={t("nav.administration")}
          title={t("home.leadership")}
          lead={t("home.leadershipLead")}
          action={<ViewAllLink href="/administration">{t("action.viewAll")}</ViewAllLink>}
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {municipal.map((p) => (
            <PortraitCard key={p.id} person={p} locale={locale} showMessage />
          ))}
        </div>
        {patrons.length > 0 && (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {patrons.map((p) => (
              <li key={p.id} className="card flex items-center gap-4 p-4">
                {p.photo && (
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-navy-50 ring-2 ring-saffron-100">
                    <Image src={p.photo.src} alt={tx(p.photo.alt, locale)} fill sizes="64px" className="object-cover" style={{ objectPosition: p.photoPosition }} />
                  </div>
                )}
                <div>
                  <LText as="p" text={p.name} locale={locale} className="font-bold text-navy-900" />
                  <LText as="p" text={p.designation} locale={locale} className="text-sm text-ink-muted" />
                </div>
              </li>
            ))}
          </ul>
        )}
        {teamPortraits.length > 0 && (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {teamPortraits.map((p) => (
              <li key={p.id}><TeamPortraitCard portrait={p} locale={locale} /></li>
            ))}
          </ul>
        )}
      </Section>

      {/* I. News & events */}
      <Section labelledBy="events">
        <SectionHeading
          id="events"
          eyebrow={t("nav.news")}
          title={t("home.events")}
          lead={t("home.eventsLead")}
          action={<ViewAllLink href="/news">{t("action.viewAll")}</ViewAllLink>}
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {galleryAlbums.slice(0, 3).map((a) => (
            <li key={a.slug}><AlbumCard album={a} locale={locale} /></li>
          ))}
        </ul>
      </Section>

      {/* J. Development & welfare */}
      <Section labelledBy="initiatives" tone="tint">
        <SectionHeading
          id="initiatives"
          eyebrow={t("nav.schemes")}
          title={t("home.initiatives")}
          lead={t("home.initiativesLead")}
          action={<ViewAllLink href="/schemes">{t("action.viewAll")}</ViewAllLink>}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schemes.filter((s) => s.description).map((s) => (
            <li key={s.slug} className="card flex h-full flex-col p-5">
              <LText as="h3" text={s.name} locale={locale} className="text-base font-semibold" />
              {s.description && <LText as="p" text={s.description} locale={locale} className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted" />}
              <SmartLink href={s.link.href} externalLabel={extLabel} className="link mt-4 inline-flex items-center gap-1 text-sm">
                <LText text={s.link.label} locale={locale} />
              </SmartLink>
            </li>
          ))}
        </ul>
      </Section>

      {/* K. Gallery */}
      <Section labelledBy="gallery">
        <SectionHeading
          id="gallery"
          eyebrow={t("nav.gallery")}
          title={t("home.gallery")}
          action={<ViewAllLink href="/gallery">{t("action.viewAll")}</ViewAllLink>}
        />
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {galleryPhotos.map(({ img, album }, i) => (
            <li key={img.src} className={i === 0 ? "col-span-2 row-span-2 md:col-span-2" : ""}>
              <Link href={`/gallery/${album.slug}`} className="group relative block h-full min-h-36 overflow-hidden rounded-lg bg-navy-50">
                <Image
                  src={img.src}
                  alt={tx(img.alt, locale)}
                  fill
                  sizes={i === 0 ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 50vw"}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/85 to-transparent p-3 pt-8 text-sm font-medium text-white">
                  <span className="line-clamp-1">{tx(album.title, locale)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* L. Important links */}
      <Section labelledBy="links" tone="white">
        <SectionHeading id="links" title={t("home.links")} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {importantLinks.map((l) => (
            <li key={l.href}>
              <SmartLink
                href={l.href}
                externalLabel={extLabel}
                className="card-interactive flex min-h-16 items-center justify-between gap-3 p-4 font-semibold text-navy-800"
              >
                <LText text={l.label} locale={locale} />
              </SmartLink>
            </li>
          ))}
        </ul>
      </Section>

      {/* M. Contact & location */}
      <Section labelledBy="contact">
        <SectionHeading id="contact" eyebrow={t("nav.contact")} title={t("home.contact")} />
        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <address className="card space-y-5 p-6 not-italic">
            <p className="flex gap-3"><MapPin aria-hidden className="mt-1 size-5 shrink-0 text-teal-ink" /><span><span className="block text-sm text-ink-muted">{t("label.address")}</span>{tx(site.contact.address, locale)}</span></p>
            <p className="flex gap-3"><Phone aria-hidden className="mt-1 size-5 shrink-0 text-teal-ink" /><span><span className="block text-sm text-ink-muted">{t("label.phone")}</span><a className="link" href={site.contact.phoneHref}>{site.contact.phone}</a></span></p>
            <p className="flex gap-3"><Mail aria-hidden className="mt-1 size-5 shrink-0 text-teal-ink" /><span className="min-w-0"><span className="block text-sm text-ink-muted">{t("label.email")}</span><a className="link break-all" href={`mailto:${site.contact.email}`}>{site.contact.email}</a></span></p>
            <p className="flex gap-3"><Clock aria-hidden className="mt-1 size-5 shrink-0 text-teal-ink" /><span><span className="block text-sm text-ink-muted">{t("label.hours")}</span>{tx(site.contact.hours, locale)}</span></p>
          </address>
          <MapEmbed
            query={site.contact.mapQuery}
            labels={{ show: t("action.showMap"), note: t("contact.mapNote"), title: t("contact.map"), directions: t("action.directions") }}
          />
        </div>
      </Section>
    </>
  )
}
