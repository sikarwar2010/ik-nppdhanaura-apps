import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import { en } from "../locales/en"
import { hi } from "../locales/hi"
import { TeamPortrait } from "./schema"

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

test("content collections validate", async () => {
  // Importing runs the zod validation in content/index.ts.
  const content = await import("./index")
  assert.ok(content.services.length > 0)
  assert.ok(content.notices.length > 0)
})

test("every referenced media file exists", async () => {
  const content = await import("./index")
  const images = [
    ...content.galleryAlbums.flatMap((a) => a.images),
    ...content.people.flatMap((p) => (p.photo ? [p.photo] : [])),
    ...content.teamPortraits.map((p) => p.photo),
    ...Object.values(content.siteImages),
  ]
  for (const img of images) {
    assert.ok(fs.existsSync(path.join(webRoot, "public", img.src)), `missing ${img.src}`)
  }
})

test("local documents exist", async () => {
  const { documents } = await import("./index")
  for (const doc of documents.filter((d) => d.file.startsWith("/documents/"))) {
    assert.ok(fs.existsSync(path.join(webRoot, "public", doc.file)), `missing ${doc.file}`)
  }
})

test("a team portrait cannot be published without a confirmed identity", () => {
  const result = TeamPortrait.safeParse({
    id: "x",
    photo: { src: "/media/team/x.jpg", width: 1, height: 1, alt: { hi: "x" } },
    published: true,
    provenance: { verification: "office-confirmed" },
  })
  assert.equal(result.success, false)
})

test("notice status derives from the event date", async () => {
  const { noticeStatus } = await import("./index")
  const notice = {
    slug: "n",
    title: { hi: "x" },
    category: "event" as const,
    publishedOn: "2026-06-01",
    eventDate: "2026-07-24",
    body: { hi: [] },
    attachments: [],
    provenance: { verification: "editorial" as const },
  }
  assert.equal(noticeStatus(notice, "2026-07-24"), "current")
  assert.equal(noticeStatus(notice, "2026-07-25"), "archived")
  assert.equal(noticeStatus({ ...notice, status: "current" }, "2027-01-01"), "current")
})

test("Hindi and English locale files define the same keys", () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(hi).sort())
})
