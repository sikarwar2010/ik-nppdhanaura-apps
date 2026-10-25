# Delivery report — Nagar Palika Parishad Dhanaura website

Date: 25 October 2026 · App: `apps/web` (Next.js 16.3.4, React 19, Tailwind CSS 4)

## 1. What was there before

`apps/web` was a citizen site cloned from a Goverdhan/Chhata template. It contained:

- Fabricated or placeholder content: an AI-generated "Rajesh K. Sharma, Municipal Commissioner" portrait (`chairman.png`), Goverdhan photographs and placeholder staff.
- A **mock grievance form** that showed a random "complaint ID" without sending anything anywhere.
- A working **property-tax search and payment module** (`/propertytax`, backed by `apps/api`).

The template pages, components and images were removed. The mock form was replaced by an honest grievance page that points to the official portal and the office. The property-tax module was kept as-is; only its default municipality name was changed from Goverdhan/Mathura to Dhanaura/Amroha.

## 2. Reference sites

| Site | What was inspected | Notes |
| --- | --- | --- |
| nppdhanaura.com (data source) | All 10 same-origin pages, in Hindi and English (20 page versions), plus 29 images and 44 links | Behind a JavaScript challenge (InfinityFree). Not bypassed: the snapshot was taken from a normal browser session (`scripts/source-snapshot.browser.js`) at one request per ~0.7 s. `robots.txt` is not served. |
| nppmainpuri.org (IA reference) | Homepage structure, navigation, headings and link inventory | Same template family as the old `apps/web`, with placeholder content ("+91 XXXXXXXXXX", "Chairman Name"). Only its section order informed the new homepage; no branding or content was reused. Internal pages were not inspected individually. |

## 3. Pages delivered

All routes return 200 and render one `<h1>`, Hindi by default and English on request:

`/`, `/about`, `/administration`, `/departments`, `/services`, `/services/[slug]` (8 services), `/notices`, `/notices/[slug]`, `/news`, `/tenders`, `/documents`, `/schemes`, `/gallery`, `/gallery/[slug]` (4 albums), `/contact`, `/public-grievance`, `/search`, `/policies/privacy`, `/policies/terms`, `/accessibility`, `/site-map`, the custom 404, `sitemap.xml` and `robots.txt`, plus the existing `/propertytax/*`.

Legacy URLs redirect permanently: `/public/*.php` → new routes, `/public/notice.php?id=1` → the notice page, and `/staff` → `/administration`.

The homepage has these sections: utility bar (phone, email, hours, text size, language), identity header, navigation with accessible dropdowns and a mobile drawer, photo hero (an authentic Dhanaura park photo), four quick services, announcements with tenders, citizen services, about, leadership, news and events, schemes, gallery, important links, contact with a click-to-load map, and the footer.

## 4. Content and provenance

- Every record in `content/*.ts` carries `provenance`. Source text was migrated **verbatim** in both languages. The only English clean-up is the cricket notice: grammar and ₹ amounts reformatted, figures unchanged.
- `data/migration-manifest.json` lists every source page, image and link with retrieval, migration and verification status. `docs/migration-report.md` is the readable version.
- 25 images were migrated as byte-identical originals; `next/image` serves AVIF/WebP variants. Two byte-identical duplicates on the source were stored once.
- **Notice status:** the only source notice (cricket tournament, event date 24 Jul 2026) is now shown as **archived**. The homepage says plainly that there are no active notices, rather than showing a stale one as current.

### Decisions that need confirmation from the office

1. **Leadership names and photos.** The Chairman (Praveen Kumar Agarwal) and Executive Officer (Awadesh Kumar Verma), with their messages and photos, are shown **because the existing official site publishes them**. A news clipping in the source gallery also names both. They are flagged with `reviewNote` in `content/people.ts`; set `published: false` to hide either one.
2. **The two supplied portraits.** Their files were not in the repository or the conversation, so the configurable team section stays hidden (`teamPortraits`, `published: false`). The source's Chairman photo matches the description of "Portrait 1" (light-yellow shirt, light background). That match was **not** used to assign a role. The README explains how to add the files and confirmed names.
3. **Logo.** The source site uses the Uttar Pradesh Government emblem as its logo. The new site uses an original typographic "ध" mark instead of imitating a seal. Set `site.logo` in `content/site.ts` once an approved municipal logo is supplied.
4. **CM / Nagar Vikas Minister.** Shown with name, designation and photo only. The source's "messages" for them were placeholder text and were dropped.
5. **Replaced links.** swachhbharaturban.gov.in timed out in a browser, so it was replaced by sbmurban.org (MoHUA). The SBM "Know More" link pointed to a login page and now points to sbmurban.org. `http://uppwd.gov.in` was changed to https.

### Not published (source incomplete)

These sections show an honest empty state or a link to the right official portal instead of invented content:

- Officer directory (the source directory is empty)
- Wards and councillors
- Local tender notices (the source defers to etender.up.nic.in)
- Budgets, government orders, RTI officer details
- Downloadable forms (the source's "Download Forms" link has no target)
- Water-connection procedure
- The source ticker item "Meeting in Dhanaura Tehsil", which has no date or details

No statistics, phone numbers, officer names, dates or scheme rules were invented.

## 5. Search, language, accessibility

- **Search:** server-rendered and works without JavaScript. It covers pages, services, notices, departments, schemes, documents, albums and links in both languages. Devanagari normalisation handles nukta, chandrabindu, zero-width joiners and digits, and matches are highlighted.
- **Language:** cookie-based (one year) and works on every route. `<html lang>` is set on the server. Untranslated content falls back to the Hindi original with `lang="hi"`.
- **Accessibility features:** skip link, visible focus, keyboard dropdowns (Esc returns focus), a focus-trapped mobile drawer and lightbox, a text-size control, reduced-motion support, 44px header touch targets, alt text in both languages, and a phone layout for the documents table.

## 6. Test results (run 25 Oct 2026, production build)

| Suite | Result |
| --- | --- |
| `next build` (TypeScript + 38 static params) | ✅ success |
| ESLint | 0 errors, 4 warnings (turbo env hints in config files) |
| Unit tests (`pnpm --filter web test`): content validation, media files exist, notice archiving, locale key parity, Hindi search normalisation | ✅ 13/13 |
| E2E (`pnpm --filter web e2e`, Playwright Chromium): 31 routes, images load, no console errors, 404, redirects, sitemap/robots, every internal link, external link safety, desktop dropdown keyboard, mobile drawer, skip link, language switch across routes, text size, search (Hindi, English, nukta, empty, no-results), lightbox keyboard and focus return, click-to-load map, no horizontal overflow at 360/390/768/1024/1440 px on 10 key pages, axe WCAG 2.2 A/AA (no serious/critical issues) on 10 pages × 2 languages | ✅ 71/71 |

Lighthouse 12.8.2, mobile preset (simulated slow 4G, 4× CPU), local production server:

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| / | 85 | 100 | 100 | 100 | 4.4 s | 0 | 70 ms |
| /services | 87 | 100 | 100 | 100 | 4.1 s | 0 | 70 ms |
| /notices/dhanaura-cricket-tournament-2026 | 89 | 100 | 100 | 100 | 3.8 s | 0 | 70 ms |
| /gallery/independence-day-2026 | 87 | 100 | 100 | 100 | 4.1 s | 0 | 40 ms |
| /contact | 88 | 100 | 100 | 100 | 3.9 s | 0 | 80 ms |

The axe and Lighthouse scores are automated checks, not a WCAG certification. A manual screen-reader audit has not been done.

## 7. Broken links

See `docs/broken-link-report.md` (23 external URLs). After browser confirmation:

- **Fixed:** swachhbharaturban.gov.in (dead, replaced) and `http://uppwd.gov.in` (switched to https).
- **Load in a browser but block scripts:** india.gov.in, etender.up.nic.in, pmaymis.gov.in, pmsvanidhi.mohua.gov.in, uppwd.gov.in.
- **Unconfirmed, check manually:** crsorgi.gov.in (sends a malformed header to scripts; the in-app browser could not open it) and the Nivesh Mitra trade-licence PDF (incomplete TLS chain for Node.js).
- **On the source site:** broken `<img src="null">`, anchors `#tax`, `#trade` and `#downloads` that don't exist, and the "Meeting in Dhanaura Tehsil" link pointing to `#`.

## 8. Content management

There is no admin CMS for the website yet. The existing NestJS API and portal have RBAC and audit features that could host one later, but adding website-content modules (schema, endpoints, uploads, approval flow) is a separate project. Until then, content is edited in typed, validated files (`content/*.ts`) through Git. Any invalid edit fails the build. The README has a field-by-field guide.

## 9. Deployment requirements

- Uses the existing `docker/web.Dockerfile` and the `web` service in `docker-compose.prod.yml`.
- `SITE_URL` is passed as a build arg (from `PUBLIC_WEB_URL`); it defaults to `https://nppdhanaura.com`.
- `API_INTERNAL_URL` is only needed for `/propertytax`.
- Google Fonts are downloaded **at build time** (`next/font`), so the build host needs internet access. Runtime needs none.
- Pages are rendered per request because the language is read from a cookie. That is fine for this traffic level; put a CDN in front for static assets (`/_next/static`, `/media` already send long cache headers).

## 10. Known limitations and suggested next steps

1. Get office confirmation for section 4's decisions, the missing content (directory, wards, forms, budgets, RTI/PIO, Citizen Charter) and an approved logo.
2. Add the two supplied portrait files with confirmed names.
3. Mobile LCP is about 4 s under simulated slow 4G. Options: make pages static per locale (`/hi`, `/en` URL segments) so they can be CDN-cached, and serve a smaller hero image to phones.
4. Manually check crsorgi.gov.in and the Nivesh Mitra PDF.
5. If self-service editing is needed, build a website-content module in `apps/api` + `apps/portal` (notices, documents, gallery, people) on top of the existing RBAC and audit logging.
6. Do a manual accessibility audit with NVDA/TalkBack in Hindi.
