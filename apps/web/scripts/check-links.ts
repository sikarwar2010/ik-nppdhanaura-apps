/**
 * External link checker.
 *
 *   pnpm --filter web check:links
 *
 * Checks every external URL used by the site content plus every link found on
 * the source site (data/migration-manifest.json). Writes data/link-check.json
 * and docs/broken-link-report.md. Internal links are covered by the e2e suite.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import * as content from "../content/index"

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const UA = "Mozilla/5.0 (compatible; NPPDhanauraLinkCheck/1.0; +https://nppdhanaura.com)"

type Result = { url: string; status: string; ok: boolean; code: number | null; finalUrl?: string; usedBy: string[] }

function collect(): Map<string, Set<string>> {
  const urls = new Map<string, Set<string>>()
  const add = (url: string, where: string) => {
    if (!/^https?:\/\//.test(url)) return
    if (!urls.has(url)) urls.set(url, new Set())
    urls.get(url)!.add(where)
  }
  for (const s of content.services) s.actions.forEach((a) => add(a.href, `service:${s.slug}`))
  for (const d of content.departments) d.links.forEach((l) => add(l.href, `department:${d.slug}`))
  for (const s of content.schemes) add(s.link.href, `scheme:${s.slug}`)
  for (const l of content.importantLinks) add(l.href, "important-links")
  for (const d of content.documents) add(d.file, `document:${d.slug}`)
  add(content.ETENDER_URL, "tenders")
  const manifestFile = path.join(webRoot, "data/migration-manifest.json")
  if (fs.existsSync(manifestFile)) {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8")) as { links: { url: string; kind: string }[] }
    for (const l of manifest.links) if (l.kind === "external") add(l.url, "source-site")
  }
  return urls
}

async function check(url: string): Promise<Omit<Result, "usedBy">> {
  let lastError = ""
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const method of ["HEAD", "GET"] as const) {
      try {
        const res = await fetch(url, {
          method,
          redirect: "follow",
          signal: AbortSignal.timeout(20_000),
          headers: { "User-Agent": UA, Accept: "text/html,application/pdf,*/*" },
        })
        await res.body?.cancel()
        // Some servers reject HEAD; retry the same attempt with GET.
        if (method === "HEAD" && (res.status === 405 || res.status === 403 || res.status >= 500)) continue
        return {
          url,
          code: res.status,
          ok: res.status < 400,
          status: res.status < 400 ? `ok ${res.status}` : `http ${res.status}`,
          finalUrl: res.url !== url ? res.url : undefined,
        }
      } catch (error) {
        lastError = error instanceof Error ? `${error.name}: ${(error.cause as Error)?.message ?? error.message}` : String(error)
      }
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  return { url, code: null, ok: false, status: `error ${lastError}` }
}

async function main() {
  const urls = collect()
  const queue = [...urls.keys()]
  const results: Result[] = []
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const url = queue.shift()!
        const r = await check(url)
        results.push({ ...r, usedBy: [...urls.get(url)!] })
        console.log(`${r.ok ? "✓" : "✗"} ${r.status.padEnd(14)} ${url}`)
      }
    })
  )
  results.sort((a, b) => Number(a.ok) - Number(b.ok) || a.url.localeCompare(b.url))
  const checkedAt = new Date().toISOString()
  fs.writeFileSync(path.join(webRoot, "data/link-check.json"), JSON.stringify({ checkedAt, results }, null, 2) + "\n")

  // Manual browser results for links that block scripts (data/link-browser-checks.json).
  const browserFile = path.join(webRoot, "data/link-browser-checks.json")
  const browser: Record<string, { ok: boolean | null; note: string }> = fs.existsSync(browserFile)
    ? JSON.parse(fs.readFileSync(browserFile, "utf8")).results
    : {}
  const failing = results.filter((r) => !r.ok)
  const browserOk = failing.filter((r) => browser[r.url]?.ok === true)
  const bad = failing.filter((r) => browser[r.url]?.ok !== true)
  const row = (cells: string[]) => `| ${cells.map((c) => c.replaceAll("|", "\\|")).join(" | ")} |`
  const report = [
    "# Broken link report",
    "",
    `Checked: ${checkedAt} by \`scripts/check-links.ts\` (HEAD, then GET; 20 s timeout; 2 attempts).`,
    "",
    `**${results.length}** external URLs checked: **${results.length - failing.length}** reachable by script, **${browserOk.length}** blocked scripts but load in a browser, **${bad.length}** failing or unconfirmed.`,
    "",
    "A failure from this checker can mean the site blocks automated requests or is slow from this network, not only that the page is gone. Failing links are listed for manual confirmation.",
    "",
    "## Failing or unconfirmed",
    "",
    bad.length ? row(["URL", "Script result", "Browser check", "Used by"]) : "None.",
    ...(bad.length
      ? [row(["---", "---", "---", "---"]), ...bad.map((r) => row([r.url, r.status, browser[r.url]?.note ?? "not checked", r.usedBy.join(", ")]))]
      : []),
    "",
    "## Blocked automated checks, load in a browser",
    "",
    browserOk.length ? row(["URL", "Script result", "Browser check", "Used by"]) : "None.",
    ...(browserOk.length
      ? [row(["---", "---", "---", "---"]), ...browserOk.map((r) => row([r.url, r.status, browser[r.url]!.note, r.usedBy.join(", ")]))]
      : []),
    "",
    "## Reachable",
    "",
    row(["URL", "Result", "Redirects to", "Used by"]),
    row(["---", "---", "---", "---"]),
    ...results.filter((r) => r.ok).map((r) => row([r.url, r.status, r.finalUrl ?? "", r.usedBy.join(", ")])),
    "",
  ].join("\n")
  fs.writeFileSync(path.join(webRoot, "docs/broken-link-report.md"), report)
  console.log(`\n${results.length} checked, ${bad.length} failing. Wrote docs/broken-link-report.md`)
}

main()
