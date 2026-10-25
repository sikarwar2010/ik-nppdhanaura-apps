import { ArrowUpRight, Search, SearchX } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { PageHeader } from "@/components/site/page-header"
import { EmptyState, Section } from "@/components/site/primitives"
import { formatDate, getI18n, type MessageKey } from "@/lib/i18n"
import { highlight, search } from "@/lib/search-core"
import { buildSearchIndex } from "@/lib/search-index"

type Props = { searchParams: Promise<{ q?: string | string[] }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { t } = await getI18n()
  const { q } = await searchParams
  const query = (Array.isArray(q) ? q[0] : q)?.trim()
  return {
    title: query ? `${t("search.title")}: ${query.slice(0, 60)}` : t("search.title"),
    robots: { index: false, follow: true },
  }
}

const index = buildSearchIndex()

const popular = ["/services", "/notices", "/propertytax", "/contact", "/schemes", "/gallery"] as const
const popularKeys: Record<(typeof popular)[number], MessageKey> = {
  "/services": "nav.services",
  "/notices": "nav.allNotices",
  "/propertytax": "nav.propertyTax",
  "/contact": "nav.contact",
  "/schemes": "nav.schemes",
  "/gallery": "nav.gallery",
}

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded-sm bg-saffron-100 px-0.5 text-navy-900">{part.text}</mark>
        ) : (
          part.text
        )
      )}
    </>
  )
}

export default async function SearchPage({ searchParams }: Props) {
  const { locale, t } = await getI18n()
  const { q } = await searchParams
  const query = ((Array.isArray(q) ? q[0] : q) ?? "").trim().slice(0, 120)
  const hits = query ? search(index, query) : []

  return (
    <>
      <PageHeader title={t("search.title")} crumbs={[{ label: t("search.title") }]}>
        <form action="/search" role="search" className="mt-6 max-w-2xl">
          <label htmlFor="search-page-q" className="mb-2 block font-semibold text-navy-800">
            {t("search.label")}
          </label>
          <div className="flex">
            <input
              id="search-page-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder={t("search.placeholder")}
              autoComplete="off"
              className="min-h-12 w-full min-w-0 rounded-l-md border border-r-0 border-line-strong bg-white px-4 text-base text-ink placeholder:text-ink-muted"
            />
            <button type="submit" className="btn-primary rounded-l-none">
              <Search aria-hidden className="size-4" />
              {t("search.submit")}
            </button>
          </div>
        </form>
      </PageHeader>

      <Section>
        <div className="mx-auto max-w-3xl">
          {!query ? (
            <EmptyState title={t("search.empty")} icon={Search} />
          ) : (
            <>
              <p role="status" className="mb-6 text-ink-muted">
                {t("search.resultsFor")} <strong className="text-navy-900">“{query}”</strong>: {hits.length} {t("search.count")}
              </p>
              {hits.length === 0 ? (
                <EmptyState title={t("search.none")} icon={SearchX}>{t("search.noneHelp")}</EmptyState>
              ) : (
                <ol className="space-y-3">
                  {hits.map(({ doc, snippet }) => {
                    const title = locale === "en" && doc.title.en ? doc.title.en : doc.title.hi
                    const text = locale === "en" && snippet.en ? snippet.en : snippet.hi
                    const external = doc.external || /^https?:/.test(doc.href)
                    const inner = (
                      <>
                        <span className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="badge-navy">{t(`type.${doc.type}`)}</span>
                          {doc.date && <time dateTime={doc.date} className="text-ink-muted">{formatDate(doc.date, locale, "medium")}</time>}
                        </span>
                        <span className="mt-2 flex items-center gap-1 text-lg font-semibold text-navy-900 group-hover:text-teal-ink">
                          <Highlighted text={title} query={query} />
                          {external && <ArrowUpRight aria-hidden className="size-4 shrink-0 opacity-70" />}
                        </span>
                        {text && text !== title && (
                          <span className="mt-1 block text-sm leading-relaxed text-ink-muted"><Highlighted text={text} query={query} /></span>
                        )}
                        {external && <span className="sr-only"> {t("label.externalNew")}</span>}
                      </>
                    )
                    return (
                      <li key={doc.id}>
                        {external ? (
                          <a href={doc.href} target="_blank" rel="noopener noreferrer" className="card-interactive group block p-5">{inner}</a>
                        ) : (
                          <Link href={doc.href} className="card-interactive group block p-5">{inner}</Link>
                        )}
                      </li>
                    )
                  })}
                </ol>
              )}
            </>
          )}

          {(!query || hits.length === 0) && (
            <nav aria-labelledby="popular" className="mt-10">
              <h2 id="popular" className="mb-3 text-sm font-semibold tracking-wider text-ink-muted uppercase">{t("search.popular")}</h2>
              <ul className="flex flex-wrap gap-2">
                {popular.map((href) => (
                  <li key={href}><Link href={href} className="btn-secondary min-h-10 px-4 py-2 text-sm">{t(popularKeys[href])}</Link></li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </Section>
    </>
  )
}
