/**
 * Whether counter collection may leave "Confirm dues" for "Enter payment".
 * A displayed balance is not enough: the quote must name a published demand,
 * the ledger must be authoritative, and the outstanding amount must be a
 * positive validated rupee value.
 */
export type CollectionBlockCode =
  | "DEMAND_NOT_PUBLISHED"
  | "HISTORY_INCOMPLETE"
  | "NOTHING_OUTSTANDING"
  | "QUOTE_INVALID"

export type CollectionDecision =
  | { ok: true }
  | { ok: false; code: CollectionBlockCode; message: string }

export type CollectionGateInput = {
  /** True only when this property and assessment year have a published demand. */
  demandPublished: boolean
  authoritative: boolean
  /** Paise parsed from the quote. Null when the amount is missing or not valid money. */
  netOutstandingPaise: bigint | null
  assessmentYearName: string
  warning: string | null
}

export function collectionAdvance(input: CollectionGateInput): CollectionDecision {
  if (!input.demandPublished) {
    return {
      ok: false,
      code: "DEMAND_NOT_PUBLISHED",
      message: `Demand not published. Payment collection is unavailable until the authorized demand is published for ${input.assessmentYearName}.`,
    }
  }
  if (!input.authoritative) {
    return {
      ok: false,
      code: "HISTORY_INCOMPLETE",
      message:
        input.warning ??
        "Historical balances are incomplete. Collection is blocked until they are verified; missing years are not treated as zero.",
    }
  }
  if (input.netOutstandingPaise === null) {
    return {
      ok: false,
      code: "QUOTE_INVALID",
      message:
        "The demand balance could not be read. Retry loading this property before entering a payment.",
    }
  }
  if (input.netOutstandingPaise <= 0n) {
    return {
      ok: false,
      code: "NOTHING_OUTSTANDING",
      message: `Nothing is outstanding for this property up to ${input.assessmentYearName}.`,
    }
  }
  return { ok: true }
}

/** Prefer the API flag. Older quotes fall back to a non-empty demand reference. */
export function quoteDemandPublished(quote: {
  demandPublished?: boolean
  demandReference: string | null
}): boolean {
  if (typeof quote.demandPublished === "boolean") return quote.demandPublished
  return Boolean(quote.demandReference)
}

/** Publish stays on the server permission. A ledger link is not a publish action. */
export function demandPublishOffer(input: {
  canPublish: boolean
  canOpenLedger: boolean
}): "publish" | "ledger" | "none" {
  if (input.canPublish) return "publish"
  if (input.canOpenLedger) return "ledger"
  return "none"
}

/** One transition per click. A second click while the first is in flight is ignored. */
export function acceptPaymentStep(input: {
  decision: CollectionDecision
  transitionPending: boolean
}): boolean {
  return input.decision.ok && !input.transitionPending
}
