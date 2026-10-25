# Content migration report

Source: https://nppdhanaura.com/public/  
Snapshot taken: 2026-10-25T08:31:54.442Z  
Generated: 2026-10-25T09:25:46.915Z by `scripts/migrate-content.ts`  
Machine-readable manifest: `data/migration-manifest.json`

## Method

nppdhanaura.com serves a JavaScript challenge page to non-browser clients. The challenge was **not** bypassed: the snapshot was taken from an ordinary browser session using `scripts/source-snapshot.browser.js`, at about one request per 0.7 s, covering every same-origin `.php` page linked from the site in Hindi and English. Image files were kept byte-for-byte; `next/image` produces responsive variants at request time.

## Pages

| Source | Lang | Retrieval | Migration | Verification | New route |
| --- | --- | --- | --- | --- | --- |
| index.php?lang=hi | hi | http 200 | migrated | source-published | / |
| about.php?lang=hi | hi | http 200 | migrated | source-published | /about |
| departments.php?lang=hi | hi | http 200 | migrated | source-published | /departments |
| services.php?lang=hi | hi | http 200 | migrated | source-published | /services |
| notices.php?lang=hi | hi | http 200 | migrated | source-published | /notices |
| gallery.php?lang=hi | hi | http 200 | migrated | source-published | /gallery |
| contact.php?lang=hi | hi | http 200 | migrated | source-published | /contact |
| schemes.php?lang=hi | hi | http 200 | migrated | source-published | /schemes |
| notice.php?id=1&lang=hi | hi | http 200 | migrated | source-published | /notices/dhanaura-cricket-tournament-2026 |
| directory.php?lang=hi | hi | http 200 | excluded | not-applicable | — |
| index.php?lang=en | en | http 200 | migrated | source-published | / |
| about.php?lang=en | en | http 200 | migrated | source-published | /about |
| departments.php?lang=en | en | http 200 | migrated | source-published | /departments |
| services.php?lang=en | en | http 200 | migrated | source-published | /services |
| notices.php?lang=en | en | http 200 | migrated | source-published | /notices |
| gallery.php?lang=en | en | http 200 | migrated | source-published | /gallery |
| contact.php?lang=en | en | http 200 | migrated | source-published | /contact |
| schemes.php?lang=en | en | http 200 | migrated | source-published | /schemes |
| notice.php?id=1&lang=en | en | http 200 | migrated | source-published | /notices/dhanaura-cricket-tournament-2026 |
| directory.php?lang=en | en | http 200 | excluded | not-applicable | — |

## Images

| Source file | Migration | New path | Note |
| --- | --- | --- | --- |
| assets/images/logo.png | migrated | /media/source/up-government-emblem.png | Kept for reference only; not used as a municipal logo |
| assets/images/swachh_bharat.png | excluded | — | Third-party campaign logo; not migrated. |
| assets/images/digital_india.png | excluded | — | Third-party campaign logo; not migrated. |
| assets/images/slider4.jpg.jpeg | migrated | /media/source/dhanaura-park-recycled-tyre-art.jpg | About page / gallery |
| assets/images/slider3.jpg.jpeg | migrated | /media/source/palika-office-hall.jpg | About page |
| assets/images/slider2.jpg.jpeg | migrated | /media/source/dhanaura-park-walkway.jpg | Homepage hero |
| uploads/gallery/b64f209f2db367098910b9c2459e10da_cm.jpg | migrated | /media/source/leader-chief-minister-up.jpg | Leadership: Chief Minister |
| uploads/gallery/4c356d77e69847ae8d7c264135f1f590_minister.jpg | migrated | /media/source/leader-nagar-vikas-minister.jpg | Leadership: Nagar Vikas Minister |
| uploads/gallery/032f9210179677d877a9761b0de58928_chairman.jpg | migrated | /media/source/leader-chairman.jpg | Leadership: Chairman |
| assets/images/eo.png | migrated | /media/source/leader-executive-officer.png | Leadership: Executive Officer |
| uploads/gallery/7d3f0c382129132a948e488eb869d93b.jpg | migrated | /media/source/yoga-day-news-clipping.jpg | Gallery |
| uploads/gallery/7a5be1948d851b9bbcc4a83b47b220d0.jpg | migrated | /media/source/independence-day-2026-felicitation.jpg | Gallery |
| uploads/gallery/4abeceb1fc18963c73346403cf26b230.jpg | migrated | /media/source/women-group-felicitation.jpg | Gallery |
| uploads/gallery/3d55de711670c816be4b96c91a9acb11.jpg | migrated | /media/source/independence-day-2026-tiranga-rally.jpg | Gallery |
| assets/images/About-1.jpeg | migrated | /media/source/naari-leads-swachhata-felicitation.jpg | About page |
| assets/images/About-2.jpeg | migrated | /media/source/sanitation-kit-handover.jpg | About page |
| uploads/gallery/053251878cb7ff437cf577e529b7f798.jpg | migrated | /media/source/swachhata-hi-seva-2026-meeting-1.jpg | Gallery |
| uploads/gallery/012977bf3eebc8c2e9852c82cc457371.jpg | migrated | /media/source/swachhata-hi-seva-2026-meeting-2.jpg | Gallery |
| uploads/gallery/59c131525df59f50a3b73dc3ad80f723.jpg | migrated | /media/source/swachhata-hi-seva-2026-meeting-3.jpg | Gallery |
| uploads/gallery/5ed0aad0e192dde2d4b5eed1b2c5388a.jpg | migrated | /media/source/swm-2026-workshop-certificate.jpg | Gallery |
| uploads/gallery/9ac1b73fcc8eedc4c44edec5c338f26b.jpg | migrated | /media/source/swm-2026-workshop-session.jpg | Gallery |
| uploads/gallery/9e6191c5e40fda4ae6111b8d066ae9ae.jpg | migrated | /media/source/independence-day-2026-students-rally.jpg | Gallery |
| uploads/gallery/116ada61b9af231e357b6c9b13c6797c.jpg | migrated | /media/source/independence-day-2026-flags.jpg | Gallery |
| uploads/gallery/a285dcda6aacef1e123a901a8d3f7399.jpg | migrated | /media/source/independence-day-2026-floral-tribute.jpg | Gallery |
| uploads/gallery/53af0dda38b16f69eecaf4c73efac5a6.jpg | migrated | /media/source/independence-day-2026-flag-hoisting.jpg | Gallery |
| uploads/gallery/1346ada8d6c34c03289db61351fd0498.jpg | migrated | /media/source/sanitation-workers-safety-kits.jpg | Gallery |
| uploads/gallery/af2136bcc948e699d7e6140e21e08d61.jpg | excluded | — | Duplicate of assets/images/About-2.jpeg |
| uploads/gallery/70a6293b97c5a4a9b3f5f64ddc4e1eb9.jpg | excluded | — | Duplicate of assets/images/About-1.jpeg |
| uploads/gallery/d984fa47f7ef6aa91299b92a2d25ccb6.jpg | migrated | /media/source/world-environment-day-meeting.jpg | Gallery |
| null | excluded | — | Broken <img src="null"> on the source site. |

## Issues found on the source site

- **/public/#**: Homepage 'Important Notice' ticker item 'Meeting in Dhanaura Tehsil (NEW)' links to '#' and has no date or details. _Action:_ Not published. Needs date, details or document before it can be shown.
- **/public/services.php#tax**: Homepage service links point at anchors (#tax, #trade, #downloads) that do not exist on services.php. _Action:_ New site links each service to its own detail page.
- **/public/services.php#downloads**: 'Download Forms / Offline Applications' has no downloadable forms behind it. _Action:_ Documents page lists only verified documents; forms needed from the office.
- **/public/directory.php**: Official contact directory is empty ('No contacts available'). _Action:_ Officer directory left empty pending administrator input.
- **/public/index.php**: Chief Minister and Nagar Vikas Minister 'messages' are placeholder text ('Chief Minister of Uttar Pradesh'). _Action:_ Names and photographs shown without invented messages.
- **/public/robots.txt**: robots.txt is not served (host redirects to an error page). _Action:_ No crawl restrictions published; crawl was limited to public pages at one request per ~0.7 s.
- **/public/**: Site sits behind a JavaScript challenge (InfinityFree), so automated HTTP clients cannot read it. _Action:_ Snapshot taken from a normal browser session (scripts/source-snapshot.browser.js).
- **/public/uploads/gallery/af2136bcc948e699d7e6140e21e08d61.jpg**: Duplicate of assets/images/About-2.jpeg (same bytes). _Action:_ Stored once.
- **/public/uploads/gallery/70a6293b97c5a4a9b3f5f64ddc4e1eb9.jpg**: Duplicate of assets/images/About-1.jpeg (same bytes). _Action:_ Stored once.
- **/public/assets/images/logo.png**: Site logo is the Uttar Pradesh Government emblem, not a municipal logo. _Action:_ New site uses a typographic identity until an approved municipal logo is supplied.

## Content that needs administrator input

- Officer and staff directory (source directory page is empty).
- Ward list, ward councillors and ward boundaries (not published on the source).
- Tender notices (source defers to etender.up.nic.in; no local notices).
- Budgets, financial statements, government orders, RTI officer details (not published on the source).
- Downloadable application forms (source 'Download Forms' link has no target).
- Approved municipal logo (source uses the UP Government emblem).
- Confirmation of the leadership photographs and names before relaunch (see docs/DELIVERY-REPORT.md).
