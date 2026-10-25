import { Clock, Mail, Phone, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { site } from "@/content"
import { getI18n, tx, type Locale } from "@/lib/i18n"
import { mainNav } from "@/lib/navigation"

import { LanguageSwitcher, TextSizeControl } from "./client-controls"
import { DesktopNav, MobileNav, type ResolvedNavItem } from "./navigation"

/**
 * Typographic mark used until an approved municipal logo is supplied
 * (set `site.logo`). It is deliberately not styled as a government seal.
 */
export function BrandMark({ className }: { className?: string }) {
  if (site.logo) {
    return <Image src={site.logo.src} width={site.logo.width} height={site.logo.height} alt="" className={className} />
  }
  return (
    <svg viewBox="0 0 56 56" aria-hidden className={className}>
      <rect width="56" height="56" rx="12" fill="#17324d" />
      <path d="M10 44 Q28 34 46 44" stroke="#e9a23b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <text
        x="28"
        y="33"
        textAnchor="middle"
        fontFamily="var(--font-noto-deva), sans-serif"
        fontSize="28"
        fontWeight="700"
        fill="#faf8f2"
      >
        ध
      </text>
    </svg>
  )
}

export function Brand({ locale }: { locale: Locale }) {
  const secondary = locale === "hi" ? site.name.en : site.name.hi
  return (
    <Link href="/" className="group flex min-w-0 items-center gap-3 rounded-md">
      <BrandMark className="size-12 shrink-0 sm:size-14" />
      <span className="min-w-0">
        <span className="block truncate text-lg leading-tight font-bold text-navy-900 sm:text-xl" lang="hi">
          {site.name.hi}
        </span>
        <span className="block truncate text-sm leading-snug font-medium text-navy-700" lang="en">
          {site.name.en}
        </span>
        <span className="block truncate text-xs text-ink-muted">{tx(site.district, locale)}</span>
        <span className="sr-only">{secondary}</span>
      </span>
    </Link>
  )
}

export async function SiteHeader() {
  const { locale, t } = await getI18n()
  const items: ResolvedNavItem[] = mainNav.map((item) => ({
    label: tx(item.label, locale),
    href: item.href,
    children: item.children?.map((c) => ({
      label: tx(c.label, locale),
      href: c.href,
      description: c.description ? tx(c.description, locale) : undefined,
    })),
  }))

  return (
    <>
    <header data-site-header className="relative z-30">
      <a
        href="#main-content"
        className="sr-only z-[70] rounded-md bg-saffron-500 px-4 py-2 font-semibold text-navy-900 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t("skip.main")}
      </a>

      {/* Utility bar */}
      <div className="bg-navy-950 text-white">
        <div className="container-site flex min-h-10 items-center justify-between gap-3 text-[0.8125rem]">
          <ul className="flex min-w-0 items-center gap-x-5 overflow-hidden">
            <li>
              <a href={site.contact.phoneHref} className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap hover:underline">
                <Phone aria-hidden className="size-3.5 text-saffron-500" />
                <span className="sr-only">{t("utility.phone")}: </span>
                {site.contact.phone}
              </a>
            </li>
            <li className="hidden sm:block">
              <a href={`mailto:${site.contact.email}`} className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap hover:underline">
                <Mail aria-hidden className="size-3.5 text-saffron-500" />
                <span className="sr-only">{t("utility.email")}: </span>
                {site.contact.email}
              </a>
            </li>
            <li className="hidden items-center gap-1.5 whitespace-nowrap text-white/80 xl:flex">
              <Clock aria-hidden className="size-3.5 text-saffron-500" />
              <span className="sr-only">{t("utility.hours")}: </span>
              {tx(site.contact.hours, locale)}
            </li>
          </ul>
          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden sm:block">
              <TextSizeControl
                labels={{
                  group: t("utility.textSize"),
                  smaller: t("utility.textSmaller"),
                  reset: t("utility.textReset"),
                  larger: t("utility.textLarger"),
                }}
              />
            </div>
            <span aria-hidden className="mx-1 hidden h-4 w-px bg-white/25 sm:block" />
            <LanguageSwitcher label={t("lang.switchTo")} />
          </div>
        </div>
      </div>

      {/* Identity row */}
      <div className="border-b border-line bg-white">
        <div className="container-site flex items-center justify-between gap-4 py-3">
          <Brand locale={locale} />
          <form action="/search" role="search" className="hidden w-full max-w-xs md:block">
            <label htmlFor="header-search" className="sr-only">
              {t("search.label")}
            </label>
            <div className="flex">
              <input
                id="header-search"
                name="q"
                type="search"
                placeholder={t("search.placeholder")}
                className="min-h-11 w-full min-w-0 rounded-l-md border border-r-0 border-line-strong bg-ivory px-3 text-sm text-ink placeholder:text-ink-muted"
              />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-r-md bg-navy-800 px-3 text-white hover:bg-navy-700"
              >
                <Search aria-hidden className="size-4" />
                <span className="sr-only">{t("search.submit")}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </header>

      {/* Navigation bar (sticky; sibling of <header> so it can stick to the page) */}
      <div data-site-header className="sticky top-0 z-40 bg-navy-800 shadow-sm">
        <div className="container-site flex min-h-12 items-center justify-between gap-2">
          <DesktopNav items={items} label={t("nav.label")} />
          <Link href="/search" className="inline-flex min-h-11 items-center gap-2 px-1 font-semibold text-white md:hidden">
            <Search aria-hidden className="size-5" />
            <span>{t("search.submit")}</span>
          </Link>
          <span className="hidden md:block lg:hidden" />
          <MobileNav
            items={items}
            labels={{
              menu: t("nav.menu"),
              close: t("nav.close"),
              nav: t("nav.label"),
              search: t("search.label"),
              placeholder: t("search.placeholder"),
            }}
          />
        </div>
      </div>
    </>
  )
}
