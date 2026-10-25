"use client"

import { useLocale } from "@workspace/i18n"
import { RotateCcw } from "lucide-react"
import Link from "next/link"

const copy = {
  hi: { title: "कुछ गलत हो गया", body: "पृष्ठ लोड नहीं हो सका। कृपया दोबारा प्रयास करें।", retry: "दोबारा प्रयास करें", home: "मुख्य पृष्ठ" },
  en: { title: "Something went wrong", body: "This page could not be loaded. Please try again.", retry: "Try again", home: "Home page" },
}

/** Error boundary. Never shows internal error details to visitors. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useLocale()
  const c = copy[locale]
  return (
    <div className="container-site flex flex-1 items-center justify-center py-20">
      <div role="alert" className="card max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold">{c.title}</h1>
        <p className="mt-2 text-ink-muted">{c.body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={reset}>
            <RotateCcw aria-hidden className="size-4" />
            {c.retry}
          </button>
          <Link href="/" className="btn-secondary">{c.home}</Link>
        </div>
      </div>
    </div>
  )
}
