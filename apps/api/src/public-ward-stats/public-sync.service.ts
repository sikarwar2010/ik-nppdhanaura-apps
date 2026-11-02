import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { Prisma } from "@prisma/client"

import { PrismaService } from "../prisma/prisma.service"
import { enqueuePublicSync } from "./public-sync-outbox"
import { PublicWardStatsService } from "./public-ward-stats.service"

const POLL_MS = 15_000
const MAX_BACKOFF_SECONDS = 3600

/** 30s, 60s, 120s … up to an hour. Failed events keep retrying until they succeed. */
export function backoffSeconds(attempts: number): number {
  return Math.min(MAX_BACKOFF_SECONDS, 30 * 2 ** Math.max(0, attempts - 1))
}

function webRevalidateUrl(): string | null {
  return process.env.WEB_REVALIDATE_URL?.trim() || null
}

/**
 * Tells the public website that figures changed. The website always reads
 * totals from the ledger through the API, so a repeat only refreshes a page:
 * this can never count a payment twice, and no payment or consumer detail is sent.
 */
@Injectable()
export class PublicSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PublicSyncService.name)
  private timer: NodeJS.Timeout | null = null
  private running = false

  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: PublicWardStatsService
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test" || process.env.PUBLIC_SYNC_WORKER === "false") return
    this.timer = setInterval(() => void this.tick(), POLL_MS)
    this.timer.unref()
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer)
  }

  private async tick() {
    if (this.running) return
    this.running = true
    try {
      await this.processDue()
    } catch (error) {
      this.logger.warn(`Public sync pass failed: ${String(error)}`)
    } finally {
      this.running = false
    }
  }

  /** Claims due events so several API instances never send the same one together. */
  async processDue(limit = 20): Promise<{ sent: number; failed: number }> {
    const claimed = await this.prisma.$queryRaw<
      Array<{ id: string; attempts: number }>
    >(Prisma.sql`
      UPDATE public_sync_event
      SET attempts = attempts + 1,
          "nextAttemptAt" = now() + (LEAST(${MAX_BACKOFF_SECONDS}, 30 * power(2, attempts)) || ' seconds')::interval
      WHERE id IN (
        SELECT id FROM public_sync_event
        WHERE status::text <> 'SENT' AND "nextAttemptAt" <= now()
        ORDER BY "createdAt"
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, attempts
    `)
    if (claimed.length === 0) return { sent: 0, failed: 0 }
    let delivered = true
    let failure: string | null = null
    try {
      await this.notifyWebsite()
    } catch (error) {
      delivered = false
      failure = error instanceof Error ? error.message : String(error)
    }
    const ids = claimed.map((row) => row.id)
    await this.prisma.publicSyncEvent.updateMany({
      where: { id: { in: ids } },
      data: delivered
        ? { status: "SENT", sentAt: new Date(), lastError: null }
        : { status: "FAILED", lastError: failure?.slice(0, 500) ?? "Unknown error" },
    })
    if (!delivered) this.logger.warn(`Website refresh failed; will retry: ${failure}`)
    return delivered ? { sent: ids.length, failed: 0 } : { sent: 0, failed: ids.length }
  }

  private async notifyWebsite() {
    const url = webRevalidateUrl()
    // Not configured: the website's own short refresh interval still applies.
    if (!url) return
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": process.env.WEB_REVALIDATE_SECRET?.trim() ?? "",
      },
      body: JSON.stringify({ scope: "public-stats" }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`Website answered ${res.status}`)
  }

  async status() {
    const [counts, recent] = await Promise.all([
      this.prisma.publicSyncEvent.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.publicSyncEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          eventType: true,
          status: true,
          attempts: true,
          lastError: true,
          createdAt: true,
          sentAt: true,
          nextAttemptAt: true,
        },
      }),
    ])
    const count = (status: string) =>
      counts.find((row) => row.status === status)?._count._all ?? 0
    return {
      pending: count("PENDING"),
      failed: count("FAILED"),
      sent: count("SENT"),
      websiteRefreshConfigured: Boolean(webRevalidateUrl()),
      recent,
    }
  }

  /** Makes failed events due now. Safe to press repeatedly. */
  async retryFailed() {
    const { count } = await this.prisma.publicSyncEvent.updateMany({
      where: { status: "FAILED" },
      data: { nextAttemptAt: new Date() },
    })
    const result = await this.processDue(100)
    return { retried: count, ...result }
  }

  /**
   * Compares the published figures with a direct sum of the ledger for one
   * assessment year, and refreshes the website.
   */
  async reconcile(assessmentYearId: string | undefined, actorId: string) {
    const published = await this.stats.statsFresh(assessmentYearId)
    const year = published.assessmentYear
    const [direct] = year
      ? await this.prisma.$queryRaw<Array<{ collected: Prisma.Decimal | null }>>`
          SELECT COALESCE(SUM(a.amount), 0) + COALESCE((
            SELECT SUM(d2."historicalPayments") FROM assessment_demand d2
            WHERE d2."assessmentYearId" = ${year.id} AND d2.status::text = 'PUBLISHED'
              AND d2."verificationStatus"::text = 'VERIFIED'
          ), 0) AS collected
          FROM payment_allocation a
          INNER JOIN payment p ON p.id = a."paymentId"
          INNER JOIN assessment_demand d ON d.id = a."assessmentDemandId"
          WHERE a.status::text = 'ACTIVE' AND p.status::text = 'SUCCESS'
            AND (p.gateway IS NULL OR p.gateway <> 'sandbox')
            AND d."assessmentYearId" = ${year.id} AND d.status::text = 'PUBLISHED'
            AND d."verificationStatus"::text = 'VERIFIED'
        `
      : [{ collected: null }]
    const ledgerCollected = (direct?.collected ?? new Prisma.Decimal(0)).toFixed(2)
    const publicCollected = published.collectionsInternal.collected
    await enqueuePublicSync(this.prisma, {
      eventType: "MANUAL_RECONCILE",
      uniqueSuffix: `${actorId}:${Date.now()}`,
    })
    await this.processDue(100)
    return {
      assessmentYear: year,
      ledgerCollected,
      publicCollected,
      byTax: published.collectionsInternal,
      collectionsDisclosedOnWebsite: published.disclosure.collections,
      matches: ledgerCollected === publicCollected,
    }
  }
}
