/**
 * Step 2 of the content migration.
 *
 *   pnpm --filter web migrate:content -- <snapshot-dir>
 *
 * <snapshot-dir> is the extracted `dhanaura-source.tar` produced by
 * `scripts/source-snapshot.browser.js` (crawl.json + original image files).
 *
 * The script:
 *  - copies crawl.json to data/source-snapshot/crawl-<date>.json,
 *  - copies each mapped source image, unmodified, to public/media/source/
 *    under a descriptive filename (next/image builds responsive variants),
 *  - fingerprints every file (sha256) and flags byte-identical duplicates,
 *  - writes data/migration-manifest.json and docs/migration-report.md with the
 *    source URL, type, retrieval / migration / verification status of every
 *    item, plus problems found on the source site.
 *
 * Curated bilingual text lives in content/*.ts and is written by hand from the
 * snapshot; this script never rewrites those files.
 */
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SOURCE_BASE = "https://nppdhanaura.com/public/"
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

type Snapshot = {
  retrievedAt: string
  pages: Record<
    string,
    {
      status?: number
      title?: string
      text?: string
      error?: string
      links?: { href: string; text: string }[]
      imgs?: { src: string; alt: string | null }[]
    }
  >
  galleryAlbums: Record<string, { title: string; date: string; imgs: string[] }[]>
}

type Status = "migrated" | "linked" | "excluded" | "needs-review"
type Verification = "source-published" | "pending-review" | "not-applicable"

/** Source page → new route, with what happened to it. */
const PAGE_MAP: Record<
  string,
  { route: string | null; migration: Status; verification: Verification; note: string }
> = {
  "index.php": {
    route: "/",
    migration: "migrated",
    verification: "source-published",
    note: "Hero slides, leadership messages, service shortcuts, notices, schemes and links re-used on the new homepage.",
  },
  "about.php": {
    route: "/about",
    migration: "migrated",
    verification: "source-published",
    note: "Introduction, vision and heritage text migrated verbatim in Hindi and English.",
  },
  "departments.php": {
    route: "/departments",
    migration: "migrated",
    verification: "source-published",
    note: "Six departments with their portal links.",
  },
  "services.php": {
    route: "/services",
    migration: "migrated",
    verification: "source-published",
    note: "Service cards, emergency numbers and scheme links migrated. Anchors #tax, #trade, #downloads do not exist on the source page.",
  },
  "notices.php": {
    route: "/notices",
    migration: "migrated",
    verification: "source-published",
    note: "One notice on the source; it is now archived because its event date has passed.",
  },
  "notice.php?id=1": {
    route: "/notices/dhanaura-cricket-tournament-2026",
    migration: "migrated",
    verification: "source-published",
    note: "Notice detail migrated with publication and event dates.",
  },
  "gallery.php": {
    route: "/gallery",
    migration: "migrated",
    verification: "source-published",
    note: "Four dated albums migrated as gallery albums and event reports.",
  },
  "contact.php": {
    route: "/contact",
    migration: "migrated",
    verification: "source-published",
    note: "Address, phone, email and office hours migrated. Map is address-based (no coordinates published).",
  },
  "schemes.php": {
    route: "/schemes",
    migration: "migrated",
    verification: "source-published",
    note: "Four schemes with descriptions; PM SVANidhi and PMAY-G links from services.php added without new descriptions.",
  },
  "directory.php": {
    route: null,
    migration: "excluded",
    verification: "not-applicable",
    note: "Source directory page states 'No contacts available'. Officer directory left for administrator input.",
  },
}

/** Original source file → descriptive public filename. */
const ASSET_MAP: Record<string, { file: string; use: string }> = {
  "assets/images/slider2.jpg.jpeg": { file: "dhanaura-park-walkway.jpg", use: "Homepage hero" },
  "assets/images/slider4.jpg.jpeg": { file: "dhanaura-park-recycled-tyre-art.jpg", use: "About page / gallery" },
  "assets/images/slider3.jpg.jpeg": { file: "palika-office-hall.jpg", use: "About page" },
  "assets/images/About-1.jpeg": { file: "naari-leads-swachhata-felicitation.jpg", use: "About page" },
  "assets/images/About-2.jpeg": { file: "sanitation-kit-handover.jpg", use: "About page" },
  "assets/images/logo.png": { file: "up-government-emblem.png", use: "Kept for reference only; not used as a municipal logo" },
  "assets/images/eo.png": { file: "leader-executive-officer.png", use: "Leadership: Executive Officer" },
  "uploads/gallery/032f9210179677d877a9761b0de58928_chairman.jpg": { file: "leader-chairman.jpg", use: "Leadership: Chairman" },
  "uploads/gallery/b64f209f2db367098910b9c2459e10da_cm.jpg": { file: "leader-chief-minister-up.jpg", use: "Leadership: Chief Minister" },
  "uploads/gallery/4c356d77e69847ae8d7c264135f1f590_minister.jpg": { file: "leader-nagar-vikas-minister.jpg", use: "Leadership: Nagar Vikas Minister" },
  "uploads/gallery/053251878cb7ff437cf577e529b7f798.jpg": { file: "swachhata-hi-seva-2026-meeting-1.jpg", use: "Gallery" },
  "uploads/gallery/012977bf3eebc8c2e9852c82cc457371.jpg": { file: "swachhata-hi-seva-2026-meeting-2.jpg", use: "Gallery" },
  "uploads/gallery/59c131525df59f50a3b73dc3ad80f723.jpg": { file: "swachhata-hi-seva-2026-meeting-3.jpg", use: "Gallery" },
  "uploads/gallery/5ed0aad0e192dde2d4b5eed1b2c5388a.jpg": { file: "swm-2026-workshop-certificate.jpg", use: "Gallery" },
  "uploads/gallery/9ac1b73fcc8eedc4c44edec5c338f26b.jpg": { file: "swm-2026-workshop-session.jpg", use: "Gallery" },
  "uploads/gallery/7a5be1948d851b9bbcc4a83b47b220d0.jpg": { file: "independence-day-2026-felicitation.jpg", use: "Gallery" },
  "uploads/gallery/3d55de711670c816be4b96c91a9acb11.jpg": { file: "independence-day-2026-tiranga-rally.jpg", use: "Gallery" },
  "uploads/gallery/9e6191c5e40fda4ae6111b8d066ae9ae.jpg": { file: "independence-day-2026-students-rally.jpg", use: "Gallery" },
  "uploads/gallery/116ada61b9af231e357b6c9b13c6797c.jpg": { file: "independence-day-2026-flags.jpg", use: "Gallery" },
  "uploads/gallery/a285dcda6aacef1e123a901a8d3f7399.jpg": { file: "independence-day-2026-floral-tribute.jpg", use: "Gallery" },
  "uploads/gallery/53af0dda38b16f69eecaf4c73efac5a6.jpg": { file: "independence-day-2026-flag-hoisting.jpg", use: "Gallery" },
  "uploads/gallery/7d3f0c382129132a948e488eb869d93b.jpg": { file: "yoga-day-news-clipping.jpg", use: "Gallery" },
  "uploads/gallery/4abeceb1fc18963c73346403cf26b230.jpg": { file: "women-group-felicitation.jpg", use: "Gallery" },
  "uploads/gallery/1346ada8d6c34c03289db61351fd0498.jpg": { file: "sanitation-workers-safety-kits.jpg", use: "Gallery" },
  "uploads/gallery/d984fa47f7ef6aa91299b92a2d25ccb6.jpg": { file: "world-environment-day-meeting.jpg", use: "Gallery" },
}

/** Known problems on the source site, recorded for administrative review. */
const SOURCE_ISSUES = [
  {
    url: `${SOURCE_BASE}#`,
    issue: "Homepage 'Important Notice' ticker item 'Meeting in Dhanaura Tehsil (NEW)' links to '#' and has no date or details.",
    action: "Not published. Needs date, details or document before it can be shown.",
  },
  {
    url: `${SOURCE_BASE}services.php#tax`,
    issue: "Homepage service links point at anchors (#tax, #trade, #downloads) that do not exist on services.php.",
    action: "New site links each service to its own detail page.",
  },
  {
    url: `${SOURCE_BASE}services.php#downloads`,
    issue: "'Download Forms / Offline Applications' has no downloadable forms behind it.",
    action: "Documents page lists only verified documents; forms needed from the office.",
  },
  {
    url: `${SOURCE_BASE}directory.php`,
    issue: "Official contact directory is empty ('No contacts available').",
    action: "Officer directory left empty pending administrator input.",
  },
  {
    url: `${SOURCE_BASE}index.php`,
    issue: "Chief Minister and Nagar Vikas Minister 'messages' are placeholder text ('Chief Minister of Uttar Pradesh').",
    action: "Names and photographs shown without invented messages.",
  },
  {
    url: `${SOURCE_BASE}robots.txt`,
    issue: "robots.txt is not served (host redirects to an error page).",
    action: "No crawl restrictions published; crawl was limited to public pages at one request per ~0.7 s.",
  },
  {
    url: `${SOURCE_BASE}`,
    issue: "Site sits behind a JavaScript challenge (InfinityFree), so automated HTTP clients cannot read it.",
    action: "Snapshot taken from a normal browser session (scripts/source-snapshot.browser.js).",
  },
  {
    url: `${SOURCE_BASE}uploads/gallery/af2136bcc948e699d7e6140e21e08d61.jpg`,
    issue: "Duplicate of assets/images/About-2.jpeg (same bytes).",
    action: "Stored once.",
  },
  {
    url: `${SOURCE_BASE}uploads/gallery/70a6293b97c5a4a9b3f5f64ddc4e1eb9.jpg`,
    issue: "Duplicate of assets/images/About-1.jpeg (same bytes).",
    action: "Stored once.",
  },
  {
    url: `${SOURCE_BASE}assets/images/logo.png`,
    issue: "Site logo is the Uttar Pradesh Government emblem, not a municipal logo.",
    action: "New site uses a typographic identity until an approved municipal logo is supplied.",
  },
]

function sha256(file: string) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex")
}

function main() {
  const snapshotDir = process.argv.slice(2).find((arg) => arg !== "--")
  if (!snapshotDir || !fs.existsSync(path.join(snapshotDir, "crawl.json"))) {
    console.error("Usage: migrate-content <snapshot-dir containing crawl.json>")
    process.exit(1)
  }
  const snapshot: Snapshot = JSON.parse(
    fs.readFileSync(path.join(snapshotDir, "crawl.json"), "utf8")
  )
  const day = snapshot.retrievedAt.slice(0, 10)

  const snapshotOut = path.join(webRoot, "data/source-snapshot", `crawl-${day}.json`)
  fs.mkdirSync(path.dirname(snapshotOut), { recursive: true })
  fs.copyFileSync(path.join(snapshotDir, "crawl.json"), snapshotOut)

  // Pages
  const pages = Object.entries(snapshot.pages).map(([key, page]) => {
    const [lang, rel] = [key.slice(0, 2), key.slice(3)]
    const map = PAGE_MAP[rel]
    return {
      sourceUrl: `${SOURCE_BASE}${rel}${rel.includes("?") ? "&" : "?"}lang=${lang}`,
      contentType: "page",
      language: lang,
      title: page.title ?? null,
      retrievalStatus: page.error ? `error: ${page.error}` : `http ${page.status}`,
      characters: page.text?.length ?? 0,
      migrationStatus: map?.migration ?? "needs-review",
      verificationStatus: map?.verification ?? "pending-review",
      targetRoute: map?.route ?? null,
      note: map?.note ?? "Not mapped yet.",
    }
  })

  // Images
  const seenHashes = new Map<string, string>()
  const allImages = new Set<string>()
  for (const page of Object.values(snapshot.pages)) {
    for (const img of page.imgs ?? []) allImages.add(img.src)
  }
  const mediaDir = path.join(webRoot, "public/media/source")
  fs.mkdirSync(mediaDir, { recursive: true })
  const images = [...allImages].map((src) => {
    const rel = src.startsWith(SOURCE_BASE) ? src.slice(SOURCE_BASE.length) : src
    const local = path.join(snapshotDir, rel)
    if (rel === "null" || !fs.existsSync(local)) {
      return {
        sourceUrl: src,
        contentType: "image",
        retrievalStatus: rel === "null" ? "broken: src is the string 'null'" : "missing from snapshot",
        migrationStatus: "excluded" as Status,
        verificationStatus: "not-applicable" as Verification,
        targetPath: null,
        sha256: null,
        bytes: 0,
        note: rel === "null" ? "Broken <img src=\"null\"> on the source site." : "",
      }
    }
    const hash = sha256(local)
    const duplicateOf = seenHashes.get(hash)
    const asset = ASSET_MAP[rel]
    if (!duplicateOf) seenHashes.set(hash, rel)
    let targetPath: string | null = null
    if (asset) {
      fs.copyFileSync(local, path.join(mediaDir, asset.file))
      targetPath = `/media/source/${asset.file}`
    }
    return {
      sourceUrl: src,
      contentType: "image",
      retrievalStatus: "ok",
      migrationStatus: (asset ? "migrated" : "excluded") as Status,
      verificationStatus: (asset ? "source-published" : "not-applicable") as Verification,
      targetPath,
      sha256: hash,
      bytes: fs.statSync(local).size,
      note: duplicateOf
        ? `Duplicate of ${duplicateOf}`
        : asset
          ? asset.use
          : "Third-party campaign logo; not migrated.",
    }
  })

  // Links
  const links = new Map<string, { href: string; texts: Set<string>; kind: string }>()
  for (const page of Object.values(snapshot.pages)) {
    for (const link of page.links ?? []) {
      const href = link.href
      const kind = href.startsWith("javascript:")
        ? "script"
        : href.startsWith(SOURCE_BASE)
          ? "internal"
          : "external"
      const entry = links.get(href) ?? { href, texts: new Set(), kind }
      if (link.text) entry.texts.add(link.text)
      links.set(href, entry)
    }
  }

  const linkCheckFile = path.join(webRoot, "data/link-check.json")
  const linkCheck: Record<string, { status: string }> = fs.existsSync(linkCheckFile)
    ? Object.fromEntries(
        (JSON.parse(fs.readFileSync(linkCheckFile, "utf8")).results as {
          url: string
          status: string
        }[]).map((r) => [r.url, r])
      )
    : {}

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: SOURCE_BASE,
    snapshotRetrievedAt: snapshot.retrievedAt,
    snapshotFile: path.relative(webRoot, snapshotOut).replaceAll("\\", "/"),
    method:
      "Browser session snapshot (scripts/source-snapshot.browser.js); site uses a JavaScript challenge, which was not bypassed.",
    pages,
    images,
    galleryAlbums: snapshot.galleryAlbums,
    links: [...links.values()].map((l) => ({
      url: l.href,
      kind: l.kind,
      labels: [...l.texts],
      lastCheck: linkCheck[l.href]?.status ?? "not checked",
    })),
    sourceIssues: SOURCE_ISSUES,
  }
  const manifestOut = path.join(webRoot, "data/migration-manifest.json")
  fs.writeFileSync(manifestOut, JSON.stringify(manifest, null, 2) + "\n")

  const row = (cells: (string | number | null)[]) =>
    `| ${cells.map((c) => String(c ?? "—").replaceAll("|", "\\|")).join(" | ")} |`
  const report = [
    "# Content migration report",
    "",
    `Source: ${SOURCE_BASE}  `,
    `Snapshot taken: ${snapshot.retrievedAt}  `,
    `Generated: ${manifest.generatedAt} by \`scripts/migrate-content.ts\`  `,
    "Machine-readable manifest: `data/migration-manifest.json`",
    "",
    "## Method",
    "",
    "nppdhanaura.com serves a JavaScript challenge page to non-browser clients. The challenge was **not** bypassed: the snapshot was taken from an ordinary browser session using `scripts/source-snapshot.browser.js`, at about one request per 0.7 s, covering every same-origin `.php` page linked from the site in Hindi and English. Image files were kept byte-for-byte; `next/image` produces responsive variants at request time.",
    "",
    "## Pages",
    "",
    row(["Source", "Lang", "Retrieval", "Migration", "Verification", "New route"]),
    row(["---", "---", "---", "---", "---", "---"]),
    ...pages.map((p) =>
      row([p.sourceUrl.replace(SOURCE_BASE, ""), p.language, p.retrievalStatus, p.migrationStatus, p.verificationStatus, p.targetRoute])
    ),
    "",
    "## Images",
    "",
    row(["Source file", "Migration", "New path", "Note"]),
    row(["---", "---", "---", "---"]),
    ...images.map((i) =>
      row([i.sourceUrl.replace(SOURCE_BASE, ""), i.migrationStatus, i.targetPath, i.note])
    ),
    "",
    "## Issues found on the source site",
    "",
    ...SOURCE_ISSUES.map((i) => `- **${i.url.replace(SOURCE_BASE, "/public/")}**: ${i.issue} _Action:_ ${i.action}`),
    "",
    "## Content that needs administrator input",
    "",
    "- Officer and staff directory (source directory page is empty).",
    "- Ward list, ward councillors and ward boundaries (not published on the source).",
    "- Tender notices (source defers to etender.up.nic.in; no local notices).",
    "- Budgets, financial statements, government orders, RTI officer details (not published on the source).",
    "- Downloadable application forms (source 'Download Forms' link has no target).",
    "- Approved municipal logo (source uses the UP Government emblem).",
    "- Confirmation of the leadership photographs and names before relaunch (see docs/DELIVERY-REPORT.md).",
    "",
  ].join("\n")
  fs.writeFileSync(path.join(webRoot, "docs/migration-report.md"), report)

  console.log(
    `Pages: ${pages.length}, images: ${images.length} (${images.filter((i) => i.migrationStatus === "migrated").length} migrated), links: ${links.size}`
  )
  console.log(`Wrote ${path.relative(webRoot, manifestOut)} and docs/migration-report.md`)
}

main()
