"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { localeCookie, parseLocale, type Locale } from "./locale"
import { en, type MessageKey } from "./messages/en"
import { hi } from "./messages/hi"

const catalogs: Record<Locale, Record<MessageKey, string>> = { en, hi }

export function translate(locale: Locale, key: MessageKey): string {
  const table = catalogs[locale] ?? en
  return table[key] ?? en[key]
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale?: string | null
  children: ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(parseLocale(initialLocale))

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    document.cookie = localeCookie(next)
    setLocaleState(next)
  }, [])

  const t = useCallback((key: MessageKey) => translate(locale, key), [locale])

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext)
  if (!value) {
    throw new Error("useLocale must be used within LocaleProvider")
  }
  return value
}

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale()
  return (
    <div
      role="group"
      aria-label={t("lang.switch")}
      className={className}
    >
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
        className={
          locale === "en"
            ? "rounded-l-md border border-[#55784F] bg-[#55784F] px-2 py-1 text-xs font-semibold text-white"
            : "rounded-l-md border border-r-0 border-[#55784F] bg-white px-2 py-1 text-xs font-semibold text-[#344638]"
        }
      >
        {t("lang.english")}
      </button>
      <button
        type="button"
        aria-pressed={locale === "hi"}
        onClick={() => setLocale("hi")}
        className={
          locale === "hi"
            ? "rounded-r-md border border-[#55784F] bg-[#55784F] px-2 py-1 text-xs font-semibold text-white"
            : "rounded-r-md border border-[#55784F] bg-white px-2 py-1 text-xs font-semibold text-[#344638]"
        }
      >
        {t("lang.hindi")}
      </button>
    </div>
  )
}
