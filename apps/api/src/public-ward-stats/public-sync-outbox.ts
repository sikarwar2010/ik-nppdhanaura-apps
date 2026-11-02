import type { Prisma } from "@prisma/client"

export type PublicSyncEventType =
  | "PAYMENT_POSTED"
  | "PAYMENT_REVERSED"
  | "PRODUCTION_RESET"
  | "MANUAL_RECONCILE"

/**
 * Called inside the transaction that changes money, so an event exists exactly
 * when the change committed. The dedupe key means a retried callback adds nothing.
 */
export async function enqueuePublicSync(
  tx: Pick<Prisma.TransactionClient, "publicSyncEvent">,
  input: {
    eventType: PublicSyncEventType
    paymentId?: string | null
    wardId?: string | null
    /** Needed when there is no payment to make the event unique. */
    uniqueSuffix?: string
  }
) {
  const dedupeKey = `${input.eventType}:${input.paymentId ?? input.uniqueSuffix ?? "none"}`
  await tx.publicSyncEvent.upsert({
    where: { dedupeKey },
    update: {},
    create: {
      dedupeKey,
      eventType: input.eventType,
      paymentId: input.paymentId ?? null,
      wardId: input.wardId ?? null,
    },
  })
}
