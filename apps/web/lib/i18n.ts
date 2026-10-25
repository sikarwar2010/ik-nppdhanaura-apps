import { LOCALE_COOKIE, type Locale } from "@workspace/i18n"
import { cookies } from "next/headers"
import { cache } from "react"

import type { Text } from "@/content/schema"
import { en } from "@/locales/en"
import { hi, type MessageKey } from "@/locales/hi"

export type { Locale, MessageKey }

/** Hindi is the primary language: anything but an explicit "en" means Hindi. */
export function parseWebLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : "hi"
}

export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies()
  return parseWebLocale(store.get(LOCALE_COOKIE)?.value)
})

const catalogs = { hi, en } as const

export function translator(locale: Locale) {
  return (key: MessageKey) => catalogs[locale][key] ?? hi[key]
}

/** Server helper: locale + translate function for the current request. */
export async function getI18n() {
  const locale = await getLocale()
  return { locale, t: translator(locale) }
}

/**
 * Pick the text for the active locale. English falls back to the Hindi
 * original (never a machine translation) and reports the language actually
 * returned so callers can set `lang` on the element.
 */
export function pick(text: Text, locale: Locale): { value: string; lang: Locale } {
  if (locale === "en" && text.en) return { value: text.en, lang: "en" }
  return { value: text.hi, lang: "hi" }
}

/** Shorthand when only the string is needed. */
export function tx(text: Text, locale: Locale) {
  return pick(text, locale).value
}

export function formatDate(iso: string, locale: Locale, style: "long" | "medium" = "long") {
  const [y, m, d] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y!, m! - 1, d!)))
}
