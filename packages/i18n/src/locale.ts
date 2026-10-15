export const LOCALES = ["en", "hi"] as const

export type Locale = (typeof LOCALES)[number]

export const LOCALE_COOKIE = "locale"

export function parseLocale(value: string | undefined | null): Locale {
  return value === "hi" ? "hi" : "en"
}

export function localeCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export function formatLocaleDate(
  value: Date | string | number,
  locale: Locale
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function formatLocaleNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(
    value
  )
}
