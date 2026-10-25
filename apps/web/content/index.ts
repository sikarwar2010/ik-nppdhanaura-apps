import { z } from "zod"

import { departments as rawDepartments } from "./departments"
import { documents as rawDocuments } from "./documents"
import { galleryAlbums as rawAlbums } from "./gallery"
import { notices as rawNotices } from "./notices"
import { people as rawPeople, teamPortraits as rawPortraits } from "./people"
import {
  Department,
  DocumentItem,
  GalleryAlbum,
  ImportantLink,
  Notice,
  Person,
  Scheme,
  Service,
  TeamPortrait,
} from "./schema"
import { importantLinks as rawLinks, schemes as rawSchemes } from "./schemes"
import { services as rawServices } from "./services"

/**
 * Every content collection is parsed here, so an invalid edit (bad date,
 * unsafe link, duplicate slug, a team portrait published without a name)
 * fails `next build` instead of reaching the public site.
 */
function collection<T extends z.ZodType>(name: string, schema: T, items: unknown[]) {
  const parsed = z.array(schema).safeParse(items)
  if (!parsed.success) {
    throw new Error(`Invalid content in "${name}":\n${z.prettifyError(parsed.error)}`)
  }
  const data = parsed.data as z.infer<T>[]
  const slugs = data
    .map((item) => (item as { slug?: string; id?: string }).slug ?? (item as { id?: string }).id)
    .filter(Boolean)
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
  if (dupes.length) throw new Error(`Duplicate slug in "${name}": ${dupes.join(", ")}`)
  return data
}

export const notices = collection("notices", Notice, rawNotices).sort((a, b) =>
  b.publishedOn.localeCompare(a.publishedOn)
)
export const services = collection("services", Service, rawServices)
export const departments = collection("departments", Department, rawDepartments)
export const schemes = collection("schemes", Scheme, rawSchemes)
export const importantLinks = collection("importantLinks", ImportantLink, rawLinks)
export const people = collection("people", Person, rawPeople).filter((p) => p.published)
export const teamPortraits = collection("teamPortraits", TeamPortrait, rawPortraits).filter(
  (p) => p.published
)
export const galleryAlbums = collection("galleryAlbums", GalleryAlbum, rawAlbums).sort((a, b) =>
  b.date.localeCompare(a.date)
)
export const documents = collection("documents", DocumentItem, rawDocuments)

/** Today in India (YYYY-MM-DD), used to retire notices whose event has passed. */
export function todayInIndia(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now)
}

export function noticeStatus(notice: Notice, today = todayInIndia()) {
  if (notice.status) return notice.status
  if (notice.eventDate && notice.eventDate < today) return "archived"
  return "current"
}

export function getNotice(slug: string) {
  return notices.find((n) => n.slug === slug)
}

export { about, heroSlides } from "./about"
export { getAlbum, siteImages } from "./gallery"
export { ETENDER_URL } from "./schemes"
export { getService } from "./services"
export { site } from "./site"
export type * from "./schema"
