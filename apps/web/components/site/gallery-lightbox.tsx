"use client"

import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useId, useRef, useState } from "react"

export type LightboxImage = { src: string; width: number; height: number; alt: string }

/**
 * Responsive photo grid with an accessible lightbox:
 * Enter/Space opens, ←/→ moves, Esc closes, focus returns to the thumbnail.
 */
export function GalleryGrid({
  images,
  labels,
}: {
  images: LightboxImage[]
  labels: { open: string; close: string; prev: string; next: string; of: string }
}) {
  const [index, setIndex] = useState<number | null>(null)
  const thumbs = useRef<(HTMLButtonElement | null)[]>([])
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastIndex = useRef(0)
  const titleId = useId()

  const close = useCallback(() => setIndex(null), [])
  const move = useCallback(
    (step: number) => setIndex((i) => (i === null ? i : (i + step + images.length) % images.length)),
    [images.length]
  )

  const wasOpen = useRef(false)
  useEffect(() => {
    if (index === null) {
      // Return focus to the thumbnail only after the lightbox was open.
      if (wasOpen.current) thumbs.current[lastIndex.current]?.focus({ preventScroll: true })
      wasOpen.current = false
      return
    }
    wasOpen.current = true
    lastIndex.current = index
  }, [index])

  const isOpen = index !== null
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowRight") move(1)
      else if (e.key === "ArrowLeft") move(-1)
      else if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>("button")
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", onKey)
    }
  }, [isOpen, close, move])

  const current = index !== null ? images[index] : null

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              ref={(el) => {
                thumbs.current[i] = el
              }}
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-navy-50 ring-1 ring-line"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                loading={i < 4 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
              />
              <span className="sr-only">{labels.open}</span>
            </button>
          </li>
        ))}
      </ul>

      {current && index !== null && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[80] flex flex-col bg-navy-950/95 text-white animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p id={titleId} className="text-sm text-white/80" aria-live="polite">
              {index + 1} {labels.of} {images.length}
            </p>
            <button
              type="button"
              data-autofocus
              onClick={close}
              className="inline-flex size-11 items-center justify-center rounded-md hover:bg-white/10"
              aria-label={labels.close}
            >
              <X aria-hidden className="size-6" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onClick={(e) => e.target === e.currentTarget && close()}>
            <Image
              key={current.src}
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="100vw"
              className="max-h-full w-auto max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => move(-1)}
              className="absolute top-1/2 left-2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
              aria-label={labels.prev}
            >
              <ChevronLeft aria-hidden className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="absolute top-1/2 right-2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
              aria-label={labels.next}
            >
              <ChevronRight aria-hidden className="size-6" />
            </button>
          </div>
          <p className="mx-auto max-w-3xl px-4 py-4 text-center text-sm text-white/90">{current.alt}</p>
        </div>
      )}
    </>
  )
}
