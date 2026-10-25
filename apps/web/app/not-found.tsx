import { Home, Search } from "lucide-react"
import Link from "next/link"

import { SiteFooter } from "@/components/site/footer"
import { SiteHeader } from "@/components/site/header"
import { getI18n } from "@/lib/i18n"

export default async function NotFound() {
  const { t } = await getI18n()
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 items-center focus:outline-none">
        <div className="container-site py-20 text-center">
          <p aria-hidden className="text-7xl font-bold text-navy-100 sm:text-8xl">404</p>
          <h1 className="mt-4 text-3xl font-bold">{t("notFound.title")}</h1>
          <p className="mx-auto mt-3 max-w-md text-ink-muted">{t("notFound.body")}</p>
          <form action="/search" role="search" className="mx-auto mt-8 flex max-w-md">
            <label htmlFor="nf-search" className="sr-only">{t("search.label")}</label>
            <input
              id="nf-search"
              name="q"
              type="search"
              placeholder={t("search.placeholder")}
              className="min-h-11 w-full min-w-0 rounded-l-md border border-r-0 border-line-strong bg-white px-3 text-base"
            />
            <button type="submit" className="btn-primary rounded-l-none">
              <Search aria-hidden className="size-4" />
              <span className="sr-only">{t("search.submit")}</span>
            </button>
          </form>
          <Link href="/" className="btn-secondary mt-6">
            <Home aria-hidden className="size-4" />
            {t("notFound.home")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
