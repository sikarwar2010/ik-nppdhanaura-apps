/* global DOMParser, document, location, fetch, Blob */
/*
 * Source snapshot for nppdhanaura.com (Step 1 of the content migration).
 *
 * WHY THIS RUNS IN A BROWSER
 * nppdhanaura.com is hosted behind a JavaScript challenge page (InfinityFree
 * "aes.js" check). We do not script around that check. Instead a person opens
 * https://nppdhanaura.com/public/ in a normal browser, lets the page load,
 * then pastes this file into the DevTools console. The snippet:
 *
 *   1. crawls the same-origin *.php pages linked from the site, in Hindi and
 *      English (`?lang=hi|en`), one request at a time with a 700 ms delay;
 *   2. extracts title, body text, links and images from each page;
 *   3. reads the gallery albums (title, date, image list);
 *   4. downloads every referenced image as-is (no re-encoding);
 *   5. saves everything as `dhanaura-source.tar` (crawl.json + original files).
 *
 * Then run `pnpm --filter web migrate:content -- <extracted-tar-dir>`.
 */
;(async () => {
  const base = "https://nppdhanaura.com/public/"
  if (!location.href.startsWith(base)) {
    throw new Error(`Open ${base} first, then run this snippet.`)
  }
  const seeds = [
    "index.php",
    "about.php",
    "departments.php",
    "services.php",
    "notices.php",
    "gallery.php",
    "contact.php",
    "schemes.php",
  ]
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const pages = {}

  for (const lang of ["hi", "en"]) {
    const queue = [...seeds]
    const seen = new Set()
    while (queue.length) {
      const page = queue.shift()
      if (seen.has(page)) continue
      seen.add(page)
      const url = base + page + (page.includes("?") ? "&" : "?") + "lang=" + lang
      try {
        const res = await fetch(url, { credentials: "include" })
        const doc = new DOMParser().parseFromString(await res.text(), "text/html")
        doc.querySelectorAll("script,style,noscript").forEach((el) => el.remove())
        const links = [...doc.querySelectorAll("a[href]")].map((a) => ({
          href: new URL(a.getAttribute("href"), base).href,
          text: a.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
        }))
        for (const link of links) {
          if (!link.href.startsWith(base)) continue
          const rel = link.href
            .slice(base.length)
            .split("#")[0]
            .replace(/[?&]lang=(en|hi)/, "")
            .replace(/\?$/, "")
          if (rel && rel.includes(".php") && !seen.has(rel) && !queue.includes(rel)) {
            queue.push(rel)
          }
        }
        const main = doc.querySelector("main") || doc.body
        pages[`${lang}:${page}`] = {
          status: res.status,
          title: doc.title,
          text: main.textContent
            .replace(/[ \t]+/g, " ")
            .replace(/\n\s*\n+/g, "\n")
            .trim(),
          links,
          imgs: [...doc.querySelectorAll("img")].map((img) => ({
            src: new URL(img.getAttribute("src"), base).href,
            alt: img.getAttribute("alt"),
          })),
        }
      } catch (error) {
        pages[`${lang}:${page}`] = { error: String(error) }
      }
      await sleep(700)
    }
  }

  const galleryAlbums = {}
  for (const lang of ["en", "hi"]) {
    const html = await fetch(`${base}gallery.php?lang=${lang}`).then((r) => r.text())
    const doc = new DOMParser().parseFromString(html, "text/html")
    galleryAlbums[lang] = [...doc.querySelectorAll("main .card")].map((card) => {
      const h3 = card.querySelector("h3")
      return {
        title: h3.childNodes[0].textContent.trim(),
        date: h3.querySelector("span")?.textContent.trim(),
        imgs: [...card.querySelectorAll("img")].map((img) => img.getAttribute("src")),
      }
    })
  }

  // Minimal ustar writer so the snapshot is a single file download.
  const enc = new TextEncoder()
  const parts = []
  const header = (name, size) => {
    const h = new Uint8Array(512)
    const put = (s, offset, len) => h.set(enc.encode(s).subarray(0, len), offset)
    put(name, 0, 100)
    put("0000644\0", 100, 8)
    put("0000000\0", 108, 8)
    put("0000000\0", 116, 8)
    put(size.toString(8).padStart(11, "0") + "\0", 124, 12)
    put(Math.floor(Date.now() / 1000).toString(8).padStart(11, "0") + "\0", 136, 12)
    put("        ", 148, 8)
    h[156] = 48
    put("ustar\0", 257, 6)
    put("00", 263, 2)
    let sum = 0
    for (const byte of h) sum += byte
    put(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8)
    return h
  }
  const add = (name, bytes) => {
    parts.push(header(name, bytes.length), bytes)
    const pad = (512 - (bytes.length % 512)) % 512
    if (pad) parts.push(new Uint8Array(pad))
  }

  const images = [
    ...new Set(Object.values(pages).flatMap((p) => (p.imgs || []).map((i) => i.src))),
  ].filter((src) => src.startsWith(base) && !src.endsWith("/null"))
  for (const src of images) {
    const bytes = new Uint8Array(await fetch(src).then((r) => r.arrayBuffer()))
    add(src.slice(base.length), bytes)
    await sleep(300)
  }
  add(
    "crawl.json",
    enc.encode(
      JSON.stringify(
        { retrievedAt: new Date().toISOString(), pages, galleryAlbums },
        null,
        1
      )
    )
  )
  parts.push(new Uint8Array(1024))

  const blob = new Blob(parts, { type: "application/x-tar" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "dhanaura-source.tar"
  document.body.appendChild(a)
  a.click()
  console.log(`Saved dhanaura-source.tar (${blob.size} bytes, ${images.length} images)`)
})()
