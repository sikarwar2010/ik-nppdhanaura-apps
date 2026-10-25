import { ChevronRight, House } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { site } from "@/content"
import { getI18n, tx } from "@/lib/i18n"

export type Crumb = { label: string; href?: string }

/** Page title band with accessible breadcrumbs and BreadcrumbList JSON-LD. */
export async function PageHeader({
  title,
  lead,
  crumbs,
  titleLang,
  children,
}: {
  title: string
  lead?: string
  crumbs: Crumb[]
  titleLang?: string
  children?: ReactNode
}) {
  const { locale, t } = await getI18n()
  const all: Crumb[] = [{ label: t("nav.home"), href: "/" }, ...crumbs]
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${site.url}${c.href === "/" ? "" : c.href}` } : {}),
    })),
  }

  return (
    <div className="relative overflow-hidden border-b border-line bg-white">
      <div aria-hidden className="jaali-ink pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.05] [mask-image:linear-gradient(to_left,black,transparent)]" />
      <div className="container-site relative py-8 sm:py-10">
        <nav aria-label={t("breadcrumb.label")} className="mb-4">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
            {all.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight aria-hidden className="size-3.5" />}
                {c.href && i < all.length - 1 ? (
                  <Link href={c.href} className="inline-flex min-h-8 items-center gap-1 hover:text-navy-800 hover:underline">
                    {i === 0 && <House aria-hidden className="size-3.5" />}
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-medium text-navy-800">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 lang={titleLang} className="max-w-4xl text-[1.875rem] leading-tight font-bold tracking-tight sm:text-title">
          {title}
        </h1>
        <div aria-hidden className="mt-4 flex gap-1.5">
          <span className="h-1 w-10 rounded-full bg-saffron-500" />
          <span className="h-1 w-4 rounded-full bg-teal-600" />
        </div>
        {lead && <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-muted">{lead}</p>}
        {children}
        <span className="sr-only">{tx(site.name, locale)}</span>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  )
}
