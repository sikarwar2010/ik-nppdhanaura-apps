export const DEMAND_NOTICE_JOB_TYPE = "DEMAND_NOTICE_PDF" as const

/**
 * Max properties in a single Chromium PDF render.
 * Larger wards are auto-split into multiple jobs of this size.
 */
export const DEMAND_NOTICE_CHUNK_SIZE = 1000

/**
 * Max properties accepted in one generate request (e.g. select-all ward).
 * Must be ≥ CHUNK_SIZE; request is split into multiple jobs of CHUNK_SIZE.
 */
export const DEMAND_NOTICE_MAX_PROPERTIES = 10_000

/** @deprecated Use DEMAND_NOTICE_CHUNK_SIZE — kept alias for older imports/tests */
export const DEMAND_NOTICE_MAX_PROPERTIES_PER_JOB = DEMAND_NOTICE_CHUNK_SIZE

export const DEMAND_NOTICE_QUEUE = "demand-notice-export"

export const DEMAND_NOTICE_PAPER = "A4" as const
export const DEMAND_NOTICE_ORIENTATION = "portrait" as const

/** Split survey IDs into PDF job chunks (preserves order). */
export function chunkDemandNoticeSurveyIds(
  ids: string[],
  size: number = DEMAND_NOTICE_CHUNK_SIZE
): string[][] {
  if (ids.length === 0) return []
  if (size <= 0) return [ids]
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size))
  }
  return chunks
}
