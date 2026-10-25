"use client"

import { MapPin } from "lucide-react"
import { useState } from "react"

/**
 * Address-based Google Maps embed (the source site publishes no
 * coordinates). Nothing is requested from Google until the visitor asks.
 */
export function MapEmbed({
  query,
  labels,
}: {
  query: string
  labels: { show: string; note: string; title: string; directions: string }
}) {
  const [shown, setShown] = useState(false)
  const q = encodeURIComponent(query)

  if (shown) {
    return (
      <iframe
        title={labels.title}
        src={`https://www.google.com/maps?q=${q}&z=16&output=embed`}
        className="aspect-[4/3] w-full rounded-lg border border-line bg-navy-50 sm:aspect-video"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    )
  }
  return (
    <div className="jaali-ink flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-lg border border-line bg-navy-50 p-6 text-center sm:aspect-video">
      <MapPin aria-hidden className="size-8 text-teal-ink" />
      <p className="max-w-sm text-sm text-ink-muted">{labels.note}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-primary" onClick={() => setShown(true)}>
          {labels.show}
        </button>
        <a
          className="btn-secondary"
          href={`https://www.google.com/maps/search/?api=1&query=${q}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {labels.directions}
        </a>
      </div>
    </div>
  )
}
