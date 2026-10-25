/**
 * Search primitives with Devanagari-aware normalisation. Pure functions so
 * they can be unit tested without Next.js (see lib/search-core.test.ts).
 */

export type SearchDoc = {
  id: string
  type: "page" | "notice" | "service" | "scheme" | "document" | "department" | "album" | "link"
  href: string
  external?: boolean
  date?: string
  /** Text in every language, joined — search matches either language. */
  title: { hi: string; en?: string }
  body: { hi: string; en?: string }
  keywords?: string
}

export type SearchHit = {
  doc: SearchDoc
  score: number
  snippet: { hi: string; en?: string }
}

const DEVANAGARI_DIGITS = /[०-९]/g

/**
 * Normalise for matching:
 *  - decompose, drop nukta (क़ → क) and Latin accents (é → e)
 *  - chandrabindu → anusvara (हँस ~ हंस)
 *  - remove zero-width joiners, map Devanagari digits to ASCII
 *  - lower-case, turn punctuation and danda into spaces
 */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\u093C/g, "")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/\u0901/g, "\u0902")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(DEVANAGARI_DIGITS, (d) => String(d.charCodeAt(0) - 0x0966))
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .normalize("NFC")
    .trim()
}

export function tokenize(query: string): string[] {
  return [...new Set(normalize(query).split(" ").filter(Boolean))].slice(0, 12)
}

function joined(text: { hi: string; en?: string }) {
  return normalize(`${text.hi} ${text.en ?? ""}`)
}

function snippetFor(text: string, tokens: string[], max = 200): string {
  const sentences = text.split(/(?<=[।.!?])\s+|\n+/).filter(Boolean)
  const hit = sentences.find((s) => {
    const n = normalize(s)
    return tokens.some((t) => n.includes(t))
  })
  const chosen = (hit ?? sentences[0] ?? "").trim()
  return chosen.length > max ? `${chosen.slice(0, max - 1).trimEnd()}…` : chosen
}

export function search(docs: SearchDoc[], query: string, limit = 50): SearchHit[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const phrase = tokens.join(" ")

  const hits: SearchHit[] = []
  for (const doc of docs) {
    const title = joined(doc.title)
    const body = joined(doc.body)
    const keywords = normalize(doc.keywords ?? "")
    const all = `${title} ${keywords} ${body}`
    if (!tokens.every((t) => all.includes(t))) continue

    let score = 0
    for (const t of tokens) {
      if (title.includes(t)) score += 6
      if (title.split(" ").includes(t)) score += 2
      if (keywords.includes(t)) score += 3
      if (body.includes(t)) score += 1
    }
    if (tokens.length > 1 && title.includes(phrase)) score += 8
    else if (tokens.length > 1 && body.includes(phrase)) score += 3

    hits.push({
      doc,
      score,
      snippet: {
        hi: snippetFor(doc.body.hi, tokens),
        en: doc.body.en ? snippetFor(doc.body.en, tokens) : undefined,
      },
    })
  }
  return hits
    .sort((a, b) => b.score - a.score || (b.doc.date ?? "").localeCompare(a.doc.date ?? ""))
    .slice(0, limit)
}

/** Split text into parts, flagging the words that match a query token. */
export function highlight(text: string, query: string): { text: string; match: boolean }[] {
  const tokens = tokenize(query)
  if (!tokens.length) return [{ text, match: false }]
  return text
    .split(/(\s+)/)
    .map((part) => ({
      text: part,
      match: part.trim() !== "" && tokens.some((t) => normalize(part).includes(t)),
    }))
}
