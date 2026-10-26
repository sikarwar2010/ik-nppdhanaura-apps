import { Clock, Mail, MapPin, Phone } from "lucide-react"
import Link from "next/link"

import { importantLinks, site } from "@/content"
import { getI18n, tx } from "@/lib/i18n"

import { BrandMark } from "./header"
import { SmartLink } from "./primitives"

/** Date the migrated content was last reviewed (update when content changes). */
export const CONTENT_UPDATED = "2026-10-25"

export async function SiteFooter() {
  const { locale, t } = await getI18n()

  const quick = [
    { href: "/about", label: t("nav.about") },
    { href: "/administration", label: t("nav.leadership") },
    { href: "/departments", label: t("nav.departments") },
    { href: "/gis", label: t("nav.gis") },
    { href: "/notices", label: t("nav.allNotices") },
    { href: "/tenders", label: t("nav.tenders") },
    { href: "/documents", label: t("nav.documents") },
    { href: "/gallery", label: t("nav.gallery") },
  ]
  const serviceLinks = [
    { href: "/services/birth-death-certificate", label: locale === "hi" ? "जन्म/मृत्यु प्रमाण पत्र" : "Birth/Death Certificate" },
    { href: "/services/property-water-tax", label: locale === "hi" ? "संपत्ति/जल कर" : "Property/Water Tax" },
    { href: "/services/trade-license", label: locale === "hi" ? "व्यापार लाइसेंस" : "Trade License" },
    { href: "/public-grievance", label: t("nav.grievance") },
    { href: "/schemes", label: t("nav.schemes") },
  ]
  const policies = [
    { href: "/policies/privacy", label: t("footer.privacy") },
    { href: "/policies/terms", label: t("footer.terms") },
    { href: "/accessibility", label: t("footer.accessibility") },
    { href: "/site-map", label: t("footer.sitemap") },
  ]
  const heading = "mb-4 text-sm font-semibold tracking-wider text-saffron-500 uppercase"
  const link = "inline-flex min-h-9 items-center text-white/85 hover:text-white hover:underline"

  return (
    <footer data-site-footer className="relative mt-auto overflow-hidden bg-navy-900 text-white">
      <div aria-hidden className="jaali pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="container-site relative grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-white p-1">
              <BrandMark className="size-12" />
            </span>
            <div>
              <p className="text-lg font-bold" lang="hi">{site.name.hi}</p>
              <p className="text-sm text-white/80" lang="en">{site.name.en}</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">{t("footer.about")}</p>
        </div>

        <nav aria-labelledby="footer-quick">
          <h2 id="footer-quick" className={heading}>{t("footer.quickLinks")}</h2>
          <ul>
            {quick.map((l) => (
              <li key={l.href}><Link href={l.href} className={link}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-services">
          <h2 id="footer-services" className={heading}>{t("footer.services")}</h2>
          <ul>
            {serviceLinks.map((l) => (
              <li key={l.href}><Link href={l.href} className={link}>{l.label}</Link></li>
            ))}
          </ul>
          <h2 className={`${heading} mt-6`}>{t("home.links")}</h2>
          <ul>
            {importantLinks.filter((l) => l.group === "government").map((l) => (
              <li key={l.href}>
                <SmartLink href={l.href} externalLabel={t("label.externalNew")} className={`${link} gap-1`}>
                  {tx(l.label, locale)}
                </SmartLink>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={heading}>{t("footer.contact")}</h2>
          <address className="space-y-3 text-sm not-italic text-white/85">
            <p className="flex gap-2.5"><MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-saffron-500" />{tx(site.contact.address, locale)}</p>
            <p><a href={site.contact.phoneHref} className="flex gap-2.5 hover:underline"><Phone aria-hidden className="size-4 shrink-0 text-saffron-500" />{site.contact.phone}</a></p>
            <p><a href={`mailto:${site.contact.email}`} className="flex gap-2.5 break-all hover:underline"><Mail aria-hidden className="size-4 shrink-0 text-saffron-500" />{site.contact.email}</a></p>
            <p className="flex gap-2.5"><Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-saffron-500" />{tx(site.contact.hours, locale)}</p>
          </address>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-site flex flex-col gap-4 py-6 text-sm text-white/70 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p>© {new Date().getFullYear()} {t("footer.copyright")}</p>
            <p className="mt-1">{t("footer.attribution")} {t("footer.updated")}: {new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { dateStyle: "long" }).format(new Date(CONTENT_UPDATED))}</p>
          </div>
          <nav aria-label={t("footer.policies")}>
            <ul className="flex flex-wrap gap-x-5">
              {policies.map((l) => (
                <li key={l.href}><Link href={l.href} className={link}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
