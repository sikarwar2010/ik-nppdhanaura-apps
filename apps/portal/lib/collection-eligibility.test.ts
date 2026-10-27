import assert from "node:assert/strict"
import { test } from "node:test"

import {
  acceptPaymentStep,
  collectionAdvance,
  demandPublishOffer,
  quoteDemandPublished,
  type CollectionGateInput,
} from "./collection-eligibility"

const year = "2025-2026"

function gate(overrides: Partial<CollectionGateInput> = {}): CollectionGateInput {
  return {
    demandPublished: true,
    authoritative: true,
    netOutstandingPaise: 30960n,
    assessmentYearName: year,
    warning: null,
    ...overrides,
  }
}

test("unpublished demand keeps payment entry blocked", () => {
  const decision = collectionAdvance(gate({ demandPublished: false }))
  assert.equal(decision.ok, false)
  if (decision.ok) return
  assert.equal(decision.code, "DEMAND_NOT_PUBLISHED")
  assert.match(decision.message, /Demand not published/)
  assert.match(decision.message, /2025-2026/)
  assert.equal(acceptPaymentStep({ decision, transitionPending: false }), false)
})

test("published demand with a positive balance can enter payment", () => {
  const decision = collectionAdvance(gate())
  assert.deepEqual(decision, { ok: true })
  assert.equal(acceptPaymentStep({ decision, transitionPending: false }), true)
})

test("published demand with nothing outstanding stays on confirm dues", () => {
  const decision = collectionAdvance(gate({ netOutstandingPaise: 0n }))
  assert.equal(decision.ok, false)
  if (decision.ok) return
  assert.equal(decision.code, "NOTHING_OUTSTANDING")
  assert.match(decision.message, /Nothing is outstanding/)
})

test("an unreadable balance is a recoverable error, not a collectible amount", () => {
  const decision = collectionAdvance(gate({ netOutstandingPaise: null }))
  assert.equal(decision.ok, false)
  if (decision.ok) return
  assert.equal(decision.code, "QUOTE_INVALID")
  assert.match(decision.message, /Retry loading/)
})

test("a published quote replaces an unpublished one and opens payment entry", () => {
  const before = collectionAdvance(
    gate({ demandPublished: quoteDemandPublished({ demandPublished: false, demandReference: null }) })
  )
  const after = collectionAdvance(
    gate({
      demandPublished: quoteDemandPublished({
        demandPublished: true,
        demandReference: "DMD-1",
      }),
    })
  )
  assert.equal(before.ok, false)
  assert.equal(after.ok, true)
})

test("a user who cannot publish is not offered the publish action", () => {
  assert.equal(demandPublishOffer({ canPublish: false, canOpenLedger: true }), "ledger")
  assert.equal(demandPublishOffer({ canPublish: false, canOpenLedger: false }), "none")
  assert.notEqual(demandPublishOffer({ canPublish: false, canOpenLedger: true }), "publish")
  assert.equal(demandPublishOffer({ canPublish: true, canOpenLedger: false }), "publish")
})

test("a second click does not start another step transition", () => {
  const decision = collectionAdvance(gate())
  assert.equal(acceptPaymentStep({ decision, transitionPending: false }), true)
  assert.equal(acceptPaymentStep({ decision, transitionPending: true }), false)
})

test("incomplete history blocks collection even when a demand is published", () => {
  const decision = collectionAdvance(
    gate({ authoritative: false, warning: "Historical balances are incomplete." })
  )
  assert.equal(decision.ok, false)
  if (decision.ok) return
  assert.equal(decision.code, "HISTORY_INCOMPLETE")
})

test("a missing demand flag falls back to the demand reference", () => {
  assert.equal(quoteDemandPublished({ demandReference: null }), false)
  assert.equal(quoteDemandPublished({ demandReference: "DMD-1" }), true)
  assert.equal(quoteDemandPublished({ demandPublished: false, demandReference: "DMD-1" }), false)
})
