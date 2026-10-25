import { z } from "zod"

/**
 * Bilingual text. Hindi is the primary (original) language and is required.
 * English is optional: when it is missing the Hindi original is shown with
 * lang="hi" instead of a machine translation.
 */
export const Text = z.object({
  hi: z.string().min(1),
  en: z.string().min(1).optional(),
})
export type Text = z.infer<typeof Text>

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
const sitePath = z.string().regex(/^\/[^/]/, "Use a site path such as /notices")
const safeUrl = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//.test(u), "Only http(s) links are allowed")

/**
 * Where a record came from.
 *  - source-published: copied from the existing nppdhanaura.com website.
 *  - office-confirmed: confirmed by the Nagar Palika office (set by an admin).
 *  - editorial: explanatory text written for this website; makes no
 *    official claim (e.g. "this service is provided on an external portal").
 */
export const Provenance = z.object({
  verification: z.enum(["source-published", "office-confirmed", "editorial"]),
  sourceUrl: safeUrl.optional(),
  retrievedOn: isoDate.optional(),
  reviewNote: z.string().optional(),
})
export type Provenance = z.infer<typeof Provenance>

export const LinkAction = z.object({
  label: Text,
  href: z.union([safeUrl, sitePath]),
  /** Who runs the destination, shown next to external links. */
  provider: Text.optional(),
  kind: z.enum(["internal", "external", "document"]),
})
export type LinkAction = z.infer<typeof LinkAction>

export const MediaImage = z.object({
  src: z.string().startsWith("/media/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: Text,
})
export type MediaImage = z.infer<typeof MediaImage>

export const Notice = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: Text,
  category: z.enum(["announcement", "event", "order", "tender", "recruitment"]),
  publishedOn: isoDate,
  eventDate: isoDate.optional(),
  /** Omit to derive from eventDate; set "archived" to retire manually. */
  status: z.enum(["current", "archived"]).optional(),
  body: z.object({ hi: z.array(z.string()), en: z.array(z.string()).optional() }),
  attachments: z.array(LinkAction).default([]),
  provenance: Provenance,
})
export type Notice = z.infer<typeof Notice>

export const ServiceIcon = z.enum([
  "certificate",
  "tax",
  "license",
  "grievance",
  "rti",
  "emergency",
  "sanitation",
  "water",
  "streetlight",
  "works",
])

export const Service = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  icon: ServiceIcon,
  title: Text,
  summary: Text,
  description: z.array(Text),
  /** "online" = a working destination exists; "information" = guidance only. */
  mode: z.enum(["online", "information"]),
  actions: z.array(LinkAction),
  department: z.string().optional(),
  provenance: Provenance,
})
export type Service = z.infer<typeof Service>

export const Department = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  icon: ServiceIcon,
  name: Text,
  description: Text,
  links: z.array(LinkAction),
  provenance: Provenance,
})
export type Department = z.infer<typeof Department>

export const Scheme = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: Text,
  description: Text.optional(),
  link: LinkAction,
  provenance: Provenance,
})
export type Scheme = z.infer<typeof Scheme>

export const Person = z.object({
  id: z.string(),
  name: Text,
  designation: Text,
  /** Short quoted message, only when published by the source/office. */
  message: Text.optional(),
  photo: MediaImage.optional(),
  /** Crop focus for portrait cards (CSS object-position). */
  photoPosition: z.string().default("center top"),
  group: z.enum(["patron", "municipal"]),
  published: z.boolean(),
  provenance: Provenance,
})
export type Person = z.infer<typeof Person>

/**
 * Configurable team portraits supplied with the project. Nothing here is
 * public until an administrator fills in a confirmed name and designation
 * and sets `published: true`.
 */
export const TeamPortrait = z
  .object({
    id: z.string(),
    photo: MediaImage,
    name: Text.optional(),
    designation: Text.optional(),
    published: z.boolean(),
    provenance: Provenance,
  })
  .refine((p) => !p.published || (p.name && p.designation), {
    message: "A team portrait can only be published with a confirmed name and designation",
  })
export type TeamPortrait = z.infer<typeof TeamPortrait>

export const GalleryAlbum = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: Text,
  date: isoDate,
  images: z.array(MediaImage).min(1),
  provenance: Provenance,
})
export type GalleryAlbum = z.infer<typeof GalleryAlbum>

export const DocumentItem = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: Text,
  description: Text.optional(),
  category: z.enum(["form", "guideline", "order", "budget", "report", "notice"]),
  publishedOn: isoDate.optional(),
  /** Local files go in public/documents/; external files keep their origin. */
  file: z.union([safeUrl, z.string().startsWith("/documents/")]),
  format: z.enum(["PDF", "DOC", "XLS", "JPG"]),
  sizeLabel: z.string().optional(),
  publisher: Text,
  provenance: Provenance,
})
export type DocumentItem = z.infer<typeof DocumentItem>

export const ImportantLink = z.object({
  label: Text,
  href: safeUrl,
  group: z.enum(["government", "services", "schemes"]),
  provenance: Provenance,
})
export type ImportantLink = z.infer<typeof ImportantLink>
