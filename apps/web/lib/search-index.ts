import {
  about,
  departments,
  documents,
  galleryAlbums,
  importantLinks,
  notices,
  schemes,
  services,
  site,
} from "@/content"
import { en } from "@/locales/en"
import { hi } from "@/locales/hi"

import type { SearchDoc } from "./search-core"

const both = (key: keyof typeof hi) => ({ hi: hi[key], en: en[key] })
const join = (parts: { hi: string; en?: string }[]) => ({
  hi: parts.map((p) => p.hi).join("\n"),
  en: parts.map((p) => p.en ?? p.hi).join("\n"),
})

/** Static pages with their lead text, so page names are findable too. */
const pages: SearchDoc[] = [
  {
    id: "page:about",
    type: "page",
    href: "/about",
    title: both("about.title"),
    body: join([about.title, ...about.intro, about.vision.body, about.heritage.body]),
    keywords: "history itihas parichay introduction इतिहास परिचय",
  },
  { id: "page:administration", type: "page", href: "/administration", title: both("admin.title"), body: both("admin.lead"), keywords: "chairman adhyaksh eo executive officer अध्यक्ष अधिशासी अधिकारी" },
  { id: "page:departments", type: "page", href: "/departments", title: both("departments.title"), body: both("departments.lead") },
  { id: "page:services", type: "page", href: "/services", title: both("services.title"), body: both("services.lead") },
  { id: "page:notices", type: "page", href: "/notices", title: both("notices.title"), body: both("notices.lead") },
  { id: "page:news", type: "page", href: "/news", title: both("news.title"), body: both("news.lead") },
  { id: "page:tenders", type: "page", href: "/tenders", title: both("tenders.title"), body: join([both("tenders.lead"), both("home.tendersBody")]), keywords: "etender e-tender nivida निविदा टेंडर procurement" },
  { id: "page:documents", type: "page", href: "/documents", title: both("documents.title"), body: both("documents.lead"), keywords: "forms download prapatra प्रपत्र फॉर्म" },
  { id: "page:schemes", type: "page", href: "/schemes", title: both("schemes.title"), body: both("schemes.lead"), keywords: "yojana योजना" },
  { id: "page:gallery", type: "page", href: "/gallery", title: both("gallery.title"), body: both("gallery.lead"), keywords: "photo photos फोटो तस्वीरें" },
  {
    id: "page:contact",
    type: "page",
    href: "/contact",
    title: both("contact.title"),
    body: join([both("contact.lead"), site.contact.address, site.contact.hours, { hi: `${site.contact.phone} ${site.contact.email}` }]),
    keywords: "address phone email pata sampark पता फ़ोन फोन ईमेल",
  },
  { id: "page:grievance", type: "page", href: "/public-grievance", title: both("grievance.title"), body: both("grievance.lead"), keywords: "complaint shikayat शिकायत" },
  { id: "page:propertytax", type: "page", href: "/propertytax", title: both("nav.propertyTax"), body: { hi: "संपत्ति कर / गृह कर विवरण खोजें", en: "Search property / house tax details" }, keywords: "house tax grih kar गृह कर हाउस टैक्स" },
]

export function buildSearchIndex(): SearchDoc[] {
  return [
    ...pages,
    ...services.map<SearchDoc>((s) => ({
      id: `service:${s.slug}`,
      type: "service",
      href: `/services/${s.slug}`,
      title: s.title,
      body: join([s.summary, ...s.description]),
      keywords: s.actions.map((a) => `${a.label.hi} ${a.label.en ?? ""}`).join(" "),
    })),
    ...notices.map<SearchDoc>((n) => ({
      id: `notice:${n.slug}`,
      type: "notice",
      href: `/notices/${n.slug}`,
      date: n.publishedOn,
      title: n.title,
      body: { hi: n.body.hi.join("\n"), en: n.body.en?.join("\n") },
    })),
    ...departments.map<SearchDoc>((d) => ({
      id: `department:${d.slug}`,
      type: "department",
      href: `/departments#${d.slug}`,
      title: d.name,
      body: d.description,
    })),
    ...schemes.map<SearchDoc>((s) => ({
      id: `scheme:${s.slug}`,
      type: "scheme",
      href: `/schemes#${s.slug}`,
      title: s.name,
      body: s.description ?? s.name,
    })),
    ...documents.map<SearchDoc>((d) => ({
      id: `document:${d.slug}`,
      type: "document",
      href: d.file,
      external: d.file.startsWith("http"),
      date: d.publishedOn,
      title: d.title,
      body: d.description ?? d.title,
      keywords: `${d.format} ${d.category}`,
    })),
    ...galleryAlbums.map<SearchDoc>((a) => ({
      id: `album:${a.slug}`,
      type: "album",
      href: `/gallery/${a.slug}`,
      date: a.date,
      title: a.title,
      body: join(a.images.map((i) => i.alt)),
    })),
    ...importantLinks.map<SearchDoc>((l) => ({
      id: `link:${l.href}`,
      type: "link",
      href: l.href,
      external: true,
      title: l.label,
      body: { hi: l.href, en: l.href },
    })),
  ]
}
