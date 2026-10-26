# Nagar Palika Parishad Dhanaura — citizen website (`apps/web`)

Public website for **नगर पालिका परिषद, धनौरा** (Nagar Palika Parishad Dhanaura, District Amroha, Uttar Pradesh). Hindi is the primary language; English is available on every page.

Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4 and zod, inside the existing Turborepo. The property-tax search and payment module (`/propertytax`) is the existing feature backed by `apps/api`. It is unchanged apart from its default municipality name.

## Quick start

```bash
cp apps/web/.env.example apps/web/.env   # then set SITE_URL
pnpm install
pnpm dev:web                              # http://localhost:3001
```

The content pages need no API or database. Only `/propertytax` calls the Nest API through the `/api/*` rewrite (`API_INTERNAL_URL`).

| Task | Command (from repo root) |
| --- | --- |
| Dev server | `pnpm dev:web` |
| Production build | `pnpm --filter web build` |
| Start production build | `pnpm --filter web start` |
| Unit tests (content validation, Hindi search) | `pnpm --filter web test` |
| End-to-end + accessibility tests | `pnpm --filter web build && pnpm --filter web e2e` |
| Lint / typecheck | `pnpm --filter web lint` / `pnpm --filter web typecheck` |
| External link check | `pnpm --filter web check:links` |
| Content migration | `pnpm --filter web migrate:content -- <snapshot-dir>` |

### Environment variables (`.env.example`)

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Public origin, used for canonical URLs, `sitemap.xml` and `robots.txt` |
| `API_INTERNAL_URL` | Where `/api/*` is proxied, used by property tax and payment callbacks |
| `NEXT_PUBLIC_MUNICIPALITY_NAME` / `_CITY` / `_STATE` / `_LOGO_URL` | Identity shown in the property-tax module |

No secrets are used by the website itself.

## Structure

```text
apps/web
├── app/(web)/…            routes (home, about, administration, departments, services/[slug],
│                          notices/[slug], news, tenders, documents, schemes, gallery/[slug],
│                          contact, public-grievance, search, policies/*, accessibility, site-map,
│                          propertytax/* (existing module))
├── app/sitemap.ts, robots.ts, not-found.tsx, error.tsx
├── components/site/       design-system components (header, nav, footer, cards, lightbox, map…)
├── content/               ALL public content, typed and validated with zod
├── locales/hi.ts, en.ts   interface strings (Hindi primary)
├── lib/                   i18n helpers, search (Devanagari normalisation), routes, SEO
├── public/media/source/   photographs migrated from nppdhanaura.com (originals)
├── data/                  migration manifest, source snapshot, link-check results
├── scripts/               source snapshot (browser), migration, link checker
├── e2e/                   Playwright + axe suite
└── docs/                  migration report, broken-link report, delivery report
```

## Updating content (no CMS yet)

All public content lives in `content/*.ts`. Every edit is validated when the site builds: bad dates, unsafe links, duplicate slugs or a team portrait published without a name all fail `next build`.

| What | File | Notes |
| --- | --- | --- |
| Notices / announcements / tender notices | `content/notices.ts` | Add new items at the top. A notice whose `eventDate` has passed is archived automatically; set `status` to override. Put PDFs in `public/documents/` and link them in `attachments`. |
| Documents & downloads | `content/documents.ts` | `file` is `/documents/<name>.pdf` (local) or the publisher's URL. Always fill `publisher`. |
| Services | `content/services.ts` | `mode: "online"` only when a working destination exists. |
| Departments | `content/departments.ts` | |
| Leadership | `content/people.ts` | Set `published: false` to hide a person. |
| Team portraits | `content/people.ts` → `teamPortraits` | See below. |
| Gallery albums / events | `content/gallery.ts` | Put photos in `public/media/…`; give every photo Hindi and English alt text. |
| Schemes, important links | `content/schemes.ts` | |
| Contact details, office hours, emblem | `content/site.ts` | `logo` points to the supplied UP Government emblem (`public/media/brand/`); set it to `null` for the typographic mark. |
| About text | `content/about.ts` | |
| Website policies | `content/policies.ts` | |
| Interface labels | `locales/hi.ts`, `locales/en.ts` | Both files must have the same keys (unit-tested). |

Rules that the data model enforces or that reviewers should keep:

- Hindi text is required and English is optional. When English is missing, the page shows the Hindi original with `lang="hi"`, never a machine translation.
- Every record has `provenance` (`source-published`, `office-confirmed` or `editorial`). Use `reviewNote` for anything an administrator must confirm.
- Never add officer names, phone numbers, dates, amounts or scheme rules that have not been confirmed by the office.
- After editing, run `pnpm --filter web test` and `pnpm --filter web build`, then deploy.

### Team portraits supplied with the project

Two portraits were supplied for a team section. Their files were not in this repository when the site was built. To publish them:

1. Save them as `public/media/team/portrait-1.jpg` (light-yellow shirt, light background) and `public/media/team/portrait-2.jpg` (glasses, blue blazer, checked shirt). Use a 4:5 crop of at least 800×1000.
2. In `content/people.ts → teamPortraits`, add the confirmed `name` and `designation` in Hindi and English.
3. Set `published: true`. The build refuses a published portrait without a name and designation.

The cards then appear on the homepage leadership section and on `/administration`.

## Content migration from nppdhanaura.com

nppdhanaura.com is served behind a JavaScript challenge page (InfinityFree). The migration does **not** script around it:

1. Open `https://nppdhanaura.com/public/` in a normal browser, open DevTools → Console, and paste `scripts/source-snapshot.browser.js`. It crawls the site's own pages in Hindi and English (one request per 0.7 s) and downloads `dhanaura-source.tar` (page text, links and original images).
2. Extract the archive and run `pnpm --filter web migrate:content -- <extracted-dir>`. This copies the mapped images to `public/media/source/`, fingerprints them (duplicates are flagged), and writes `data/migration-manifest.json` and `docs/migration-report.md`.
3. Update `content/*.ts` by hand from the snapshot (`data/source-snapshot/`).
4. Run `pnpm --filter web check:links` to refresh `docs/broken-link-report.md`. Links that block scripts can be confirmed in a browser and recorded in `data/link-browser-checks.json`.

Legacy URLs (`/public/about.php`, `/public/notice.php?id=1`, …) permanently redirect to the new routes (`next.config.ts`).

## Design system

"Modern Indian Civic Heritage" tokens live in `app/globals.css`:

- **Colour:** navy `#17324D` (primary), heritage teal `#087F8C` (accent; `#07737F` for text), ivory `#FAF8F2` (page), saffron `#E9A23B` (highlights only, never text), charcoal `#263238` (text), border `#DCE3E8`. Contrast ratios are listed in the file.
- **Type:** Noto Sans Devanagari + Inter via `next/font` (self-hosted at build time). Devanagari gets extra line height.
- **Components:** `btn-primary`, `btn-secondary`, `btn-accent`, `card`, `card-interactive`, `badge-*`, `eyebrow`, `prose-civic`, `container-site`, and a low-opacity `jaali` lattice motif. React components are in `components/site/`.
- **Behaviour:** visible focus rings, a skip link, an A-/A/A+ text-size control, reduced-motion support, 44px touch targets in the header, and a sticky navigation bar.

## GIS and ward-wise tax page (`/gis`)

Ward-level figures come from the API's public endpoint `GET /api/v1/public/ward-stats`, which aggregates published, verified demands on the municipal ledger. The website never calculates tax itself. No ward boundary geometry exists yet, so the page shows a ward directory, a bar chart and a table, and says so. Collections and outstanding totals appear only when the API runs with `PUBLIC_DISCLOSE_COLLECTIONS=true`. The e2e suite uses `e2e/mock-api.mjs`, a test-only fixture server.

## Search

`/search?q=…` is server-rendered and works without JavaScript. It indexes pages, services, notices, departments, schemes, documents, gallery albums and important links in both languages. Normalisation makes Hindi matching forgiving: nukta (फ़ = फ), chandrabindu/anusvara, zero-width joiners and Devanagari digits. Matches are highlighted.

## Language

The language switch sets the shared `locale` cookie (one year) and re-renders on the server, so it works on every route and sets `<html lang>`. The default is Hindi.

## Deployment

The existing `docker/web.Dockerfile` and `docker-compose.prod.yml` (`web` service, port 3001, `output: "standalone"`) are unchanged. Set `SITE_URL` in the Dokploy environment. The site sends `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy` headers, and long cache headers for `/media/*`.
