import { createHash } from "node:crypto"

export const RESET_CONFIRMATION_PHRASE = "CLEAR TEST TRANSACTIONS"
export const RESET_REASON_MIN_LENGTH = 10

export type ResetPaymentFacts = {
  id: string
  gateway: string | null
  status: string
  paymentMode: string
  amount: string
  atomTxnId: string | null
  paymentReference: string
  remarks: string | null
  counterCode: string | null
  updatedAt: Date
}

export type ResetClassification = {
  /** TEST is included automatically. REVIEW needs a Super Admin to tick that one payment. */
  classification: "TEST" | "REVIEW"
  reasons: string[]
  /** A real gateway confirmed this money. Almost certainly a citizen payment unless it was a UAT run. */
  gatewayConfirmed: boolean
}

const TEST_MARKER = /^\s*(test|testing|demo|sample|dummy|uat)\b/i

/**
 * Nothing is treated as test data on a guess. Only the sandbox gateway and an
 * explicit test marker qualify; every other payment waits for manual review.
 */
export function classifyPayment(payment: ResetPaymentFacts): ResetClassification {
  const gatewayConfirmed =
    payment.paymentMode === "ONLINE" &&
    payment.status === "SUCCESS" &&
    payment.gateway !== "sandbox" &&
    Boolean(payment.atomTxnId)
  if (gatewayConfirmed) {
    return {
      classification: "REVIEW",
      reasons: ["Confirmed by the live payment gateway. Treat as a citizen payment unless it was a known UAT run."],
      gatewayConfirmed,
    }
  }
  const reasons: string[] = []
  if (payment.gateway === "sandbox") reasons.push("Sandbox gateway")
  if (payment.remarks && TEST_MARKER.test(payment.remarks)) reasons.push("Remarks mark it as a test")
  if (payment.counterCode && TEST_MARKER.test(payment.counterCode)) reasons.push("Counter code marks it as a test")
  if (reasons.length > 0) return { classification: "TEST", reasons, gatewayConfirmed }
  return {
    classification: "REVIEW",
    reasons: ["Cannot be told apart from a genuine payment. Tick it only if you know it was a test."],
    gatewayConfirmed,
  }
}

/** Fingerprint of exactly what was reviewed. A payment changing afterwards stops the reset. */
export function scopeHash(payments: ResetPaymentFacts[]): string {
  const lines = payments
    .map((row) => `${row.id}|${row.status}|${row.amount}|${row.updatedAt.toISOString()}`)
    .sort()
  return createHash("sha256").update(lines.join("\n")).digest("hex")
}

export function sha256(buffer: Buffer | string): string {
  return createHash("sha256").update(buffer).digest("hex")
}

export type ResetExecutionCheck = {
  enabled: boolean
  status: string
  phrase: string
  reason: string
  secondApprovalRequired: boolean
  backupVerified: boolean
}

/** Every condition for running a reset, checked again on the server just before it runs. */
export function resetBlockers(input: ResetExecutionCheck): Array<{ code: string; message: string }> {
  const blockers: Array<{ code: string; message: string }> = []
  if (!input.enabled) {
    blockers.push({
      code: "RESET_DISABLED",
      message: "Production reset is switched off on this server. Set PRODUCTION_RESET_ENABLED=true only for the planned window.",
    })
  }
  if (input.phrase !== RESET_CONFIRMATION_PHRASE) {
    blockers.push({ code: "RESET_PHRASE_REQUIRED", message: `Type the phrase exactly: ${RESET_CONFIRMATION_PHRASE}` })
  }
  if (input.reason.trim().length < RESET_REASON_MIN_LENGTH) {
    blockers.push({
      code: "RESET_REASON_REQUIRED",
      message: `Give a reason of at least ${RESET_REASON_MIN_LENGTH} characters`,
    })
  }
  if (!input.backupVerified) {
    blockers.push({ code: "RESET_BACKUP_REQUIRED", message: "Create and verify the backup first" })
  }
  const allowed = input.secondApprovalRequired ? ["APPROVED"] : ["BACKUP_VERIFIED", "APPROVED"]
  if (!allowed.includes(input.status)) {
    blockers.push({
      code: input.secondApprovalRequired ? "RESET_APPROVAL_REQUIRED" : "RESET_NOT_READY",
      message: input.secondApprovalRequired
        ? "A second Super Admin must approve this reset"
        : `This reset cannot run from status ${input.status}`,
    })
  }
  return blockers
}
