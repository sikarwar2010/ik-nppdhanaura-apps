import { galleryAlbums, notices, services } from "@/content"

import type { MessageKey } from "./i18n"

/** Every public static route, grouped for the HTML sitemap. */
export const staticRoutes: { group: MessageKey; items: { href: string; key: MessageKey }[] }[] = [
  {
    group: "nav.about",
    items: [
      { href: "/", key: "nav.home" },
      { href: "/about", key: "nav.about" },
      { href: "/administration", key: "nav.leadership" },
      { href: "/departments", key: "nav.departments" },
    ],
  },
  {
    group: "nav.services",
    items: [
      { href: "/services", key: "nav.allServices" },
      { href: "/propertytax", key: "nav.propertyTax" },
      { href: "/public-grievance", key: "nav.grievance" },
      { href: "/schemes", key: "nav.schemes" },
    ],
  },
  {
    group: "nav.notices",
    items: [
      { href: "/notices", key: "nav.allNotices" },
      { href: "/news", key: "nav.news" },
      { href: "/tenders", key: "nav.tenders" },
      { href: "/documents", key: "nav.documents" },
      { href: "/gallery", key: "nav.gallery" },
    ],
  },
  {
    group: "footer.policies",
    items: [
      { href: "/contact", key: "nav.contact" },
      { href: "/search", key: "search.title" },
      { href: "/policies/privacy", key: "footer.privacy" },
      { href: "/policies/terms", key: "footer.terms" },
      { href: "/accessibility", key: "footer.accessibility" },
      { href: "/site-map", key: "footer.sitemap" },
    ],
  },
]

export function allPublicPaths(): { path: string; lastModified?: string }[] {
  return [
    ...staticRoutes.flatMap((g) => g.items.map((i) => ({ path: i.href }))).filter((r) => r.path !== "/search"),
    ...services.map((s) => ({ path: `/services/${s.slug}` })),
    ...notices.map((n) => ({ path: `/notices/${n.slug}`, lastModified: n.publishedOn })),
    ...galleryAlbums.map((a) => ({ path: `/gallery/${a.slug}`, lastModified: a.date })),
  ]
}
