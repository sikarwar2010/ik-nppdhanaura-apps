import { timingSafeEqual } from "node:crypto"
import { revalidateTag } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import { PUBLIC_STATS_TAG } from "@/lib/ward-stats"

function secretMatches(given: string | null): boolean {
  const expected = process.env.WEB_REVALIDATE_SECRET?.trim()
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Called by the API after a payment commits. It only marks public statistics as
 * out of date; the next visitor gets figures read fresh from the ledger.
 * Carries no payment or consumer data.
 */
export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  revalidateTag(PUBLIC_STATS_TAG, { expire: 0 })
  return NextResponse.json({ ok: true })
}
