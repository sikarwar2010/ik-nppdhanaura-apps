"use client"

import { useLocale } from "@workspace/i18n"
import { Languages } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

import { cn } from "@/lib/utils"

/**
 * Switches between Hindi and English on any route. The choice is stored in
 * the shared `locale` cookie (one year) and server components re-render.
 */
export function LanguageSwitcher({
  label,
  className,
  tone = "dark",
}: {
  label: string
  className?: string
  tone?: "dark" | "light"
}) {
  const { locale, setLocale } = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const next = locale === "hi" ? "en" : "hi"

  return (
    <button
      type="button"
      lang={next}
      aria-label={label}
      aria-busy={pending || undefined}
      onClick={() => {
        setLocale(next)
        startTransition(() => router.refresh())
      }}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold transition-colors",
        tone === "dark"
          ? "text-white hover:bg-white/10"
          : "border border-line-strong text-navy-800 hover:bg-navy-50",
        pending && "opacity-60",
        className
      )}
    >
      <Languages aria-hidden className="size-4" />
      {next === "en" ? "English" : "हिंदी"}
    </button>
  )
}

const SIZES = ["base", "lg", "xl"] as const
type Size = (typeof SIZES)[number]

function applySize(size: Size) {
  const el = document.documentElement
  if (size === "base") delete el.dataset.textSize
  else el.dataset.textSize = size
  try {
    localStorage.setItem("text-size", size)
  } catch {
    // Private mode or blocked storage: the size still applies for this page.
  }
}

export function TextSizeControl({
  labels,
}: {
  labels: { group: string; smaller: string; reset: string; larger: string }
}) {
  const [size, setSize] = useState<Size>("base")

  useEffect(() => {
    const current = document.documentElement.dataset.textSize
    if (current === "lg" || current === "xl") setSize(current)
  }, [])

  const change = (next: Size) => {
    setSize(next)
    applySize(next)
  }
  const index = SIZES.indexOf(size)
  const button =
    "inline-flex size-8 items-center justify-center rounded text-white hover:bg-white/10 disabled:opacity-40"

  return (
    <div role="group" aria-label={labels.group} className="flex items-center">
      <button
        type="button"
        className={cn(button, "text-xs")}
        disabled={index === 0}
        onClick={() => change(SIZES[index - 1]!)}
      >
        A-<span className="sr-only">: {labels.smaller}</span>
      </button>
      <button
        type="button"
        className={cn(button, "text-sm")}
        aria-pressed={size === "base"}
        onClick={() => change("base")}
      >
        A<span className="sr-only">: {labels.reset}</span>
      </button>
      <button
        type="button"
        className={cn(button, "text-base")}
        disabled={index === SIZES.length - 1}
        onClick={() => change(SIZES[index + 1]!)}
      >
        A+<span className="sr-only">: {labels.larger}</span>
      </button>
    </div>
  )
}
