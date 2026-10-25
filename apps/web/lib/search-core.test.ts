import assert from "node:assert/strict"
import { test } from "node:test"

import { highlight, normalize, search, tokenize, type SearchDoc } from "./search-core"

test("normalize removes nukta, zero-width joiners and maps digits", () => {
  assert.equal(normalize("फ़ीस"), normalize("फीस"))
  assert.equal(normalize("क्‍ष"), normalize("क्ष"))
  assert.equal(normalize("२०२६"), "2026")
  assert.equal(normalize("हँस"), normalize("हंस"))
  assert.equal(normalize("Café, CRS!"), "cafe crs")
  assert.equal(normalize("सूचनाएँ।"), normalize("सूचनाएं"))
})

test("tokenize de-duplicates and drops punctuation", () => {
  assert.deepEqual(tokenize("  कर, कर  tax "), ["कर", "tax"])
  assert.deepEqual(tokenize("..."), [])
})

const docs: SearchDoc[] = [
  {
    id: "a",
    type: "service",
    href: "/services/birth-death-certificate",
    title: { hi: "जन्म/मृत्यु प्रमाण पत्र", en: "Birth/Death Certificate" },
    body: { hi: "CRS पोर्टल पर पंजीकरण।", en: "Registration on the CRS portal." },
  },
  {
    id: "b",
    type: "notice",
    href: "/notices/x",
    date: "2026-06-01",
    title: { hi: "धनौरा क्रिकेट खेल-प्रतियोगिता", en: "Dhanaura Cricket Tournament" },
    body: { hi: "हर टीम के लिए एंट्री फ़ीस 1,999 रुपये होगी।", en: "The entry fee is ₹1,999." },
  },
]

test("search matches Hindi and English and ranks title hits first", () => {
  assert.equal(search(docs, "प्रमाण पत्र")[0]?.doc.id, "a")
  assert.equal(search(docs, "certificate")[0]?.doc.id, "a")
  assert.equal(search(docs, "cricket")[0]?.doc.id, "b")
  assert.equal(search(docs, "क्रिकेट")[0]?.doc.id, "b")
})

test("search tolerates nukta differences", () => {
  assert.equal(search(docs, "फीस")[0]?.doc.id, "b")
})

test("all query words must match", () => {
  assert.equal(search(docs, "cricket certificate").length, 0)
  assert.equal(search(docs, "").length, 0)
})

test("snippet comes from the matching sentence", () => {
  const [hit] = search(docs, "फ़ीस")
  assert.match(hit!.snippet.hi, /फ़ीस/)
})

test("highlight marks matching words", () => {
  const parts = highlight("Dhanaura Cricket Tournament", "cricket")
  assert.deepEqual(
    parts.filter((p) => p.match).map((p) => p.text),
    ["Cricket"]
  )
})
