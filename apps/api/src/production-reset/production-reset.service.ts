import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { Prisma } from "@prisma/client"

import type { AuthUser } from "../auth/auth.decorators"
import { formatReceiptNumber } from "../collections/collection-rules"
import { moneyString, sumMoney } from "../demands/money"
import { PrismaService } from "../prisma/prisma.service"
import { enqueuePublicSync } from "../public-ward-stats/public-sync-outbox"
import { PublicWardStatsService } from "../public-ward-stats/public-ward-stats.service"
import { StorageService } from "../storage/storage.service"
import {
  classifyPayment,
  RESET_CONFIRMATION_PHRASE,
  resetBlockers,
  scopeHash,
  sha256,
  type ResetPaymentFacts,
} from "./production-reset.rules"

function isEnabled() {
  return process.env.PRODUCTION_RESET_ENABLED?.trim().toLowerCase() === "true"
}

function secondApprovalRequired() {
  return process.env.PRODUCTION_RESET_REQUIRE_SECOND_APPROVAL?.trim().toLowerCase() === "true"
}

function assertSuperAdmin(user: AuthUser) {
  if (!user.roles.includes("SUPER_ADMIN")) {
    throw new ForbiddenException({
      code: "SUPER_ADMIN_REQUIRED",
      message: "Only a Super Admin can use production reset",
    })
  }
}

const PAYMENT_FACTS = {
  id: true,
  gateway: true,
  status: true,
  paymentMode: true,
  amount: true,
  atomTxnId: true,
  paymentReference: true,
  remarks: true,
  counterCode: true,
  updatedAt: true,
} as const

function toFacts(row: Prisma.PaymentGetPayload<{ select: typeof PAYMENT_FACTS }>): ResetPaymentFacts {
  return { ...row, amount: moneyString(row.amount), status: row.status, paymentMode: row.paymentMode }
}

/**
 * Clears approved test transactions before go-live. Only ever run by a person
 * through the guarded endpoints: nothing here is called on startup, migration,
 * deployment or by a timer. Demands, master data and configuration are not touched.
 */
@Injectable()
export class ProductionResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly stats: PublicWardStatsService
  ) {}

  /** Read-only. Lists what would be cleared and what needs a decision. */
  async preview(user: AuthUser, approvedPaymentIds: string[] = []) {
    assertSuperAdmin(user)
    const rows = await this.prisma.payment.findMany({
      select: {
        ...PAYMENT_FACTS,
        receiptNumber: true,
        collectionDate: true,
        createdAt: true,
        survey: { select: { surveyId: true, ownerName: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    const approved = new Set(approvedPaymentIds)
    const classified = rows.map((row) => ({ row, result: classifyPayment(toFacts(row)) }))
    const selectedIds = classified
      .filter(({ row, result }) => result.classification === "TEST" || approved.has(row.id))
      .map(({ row }) => row.id)
    const toRow = ({ row, result }: (typeof classified)[number]) => ({
      id: row.id,
      receiptNumber: row.receiptNumber,
      amount: moneyString(row.amount),
      status: row.status,
      paymentMode: row.paymentMode,
      gateway: row.gateway,
      date: row.collectionDate ?? row.createdAt,
      propertyId: row.survey?.surveyId ?? null,
      ownerName: row.survey?.ownerName ?? null,
      reasons: result.reasons,
      gatewayConfirmed: result.gatewayConfirmed,
    })
    return {
      enabled: isEnabled(),
      secondApprovalRequired: secondApprovalRequired(),
      confirmationPhrase: RESET_CONFIRMATION_PHRASE,
      autoIncluded: classified.filter((item) => item.result.classification === "TEST").map(toRow),
      needsReview: classified.filter((item) => item.result.classification === "REVIEW").map(toRow),
      selected: await this.scopeCounts(selectedIds),
      preserved: await this.preservedCounts(),
      runs: await this.prisma.productionResetRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          counts: true,
          reason: true,
          backupSha256: true,
          backupVerifiedAt: true,
          requestedById: true,
          approvedById: true,
          executedAt: true,
          failure: true,
          createdAt: true,
        },
      }),
    }
  }

  private async scopeCounts(ids: string[]) {
    const where = { id: { in: ids } }
    const payments = await this.prisma.payment.findMany({
      where,
      select: { paymentMode: true, amount: true, receiptNumber: true, surveyId: true, merchTxnId: true },
    })
    const merch = payments.flatMap((row) => (row.merchTxnId ? [row.merchTxnId] : []))
    const [allocations, callbacks, transactions, refunds, settlements] = await Promise.all([
      this.prisma.paymentAllocation.count({ where: { paymentId: { in: ids } } }),
      this.prisma.paymentCallback.count({ where: { paymentId: { in: ids } } }),
      this.prisma.paymentTransaction.count({ where: { paymentId: { in: ids } } }),
      this.prisma.paymentRefund.count({ where: { paymentId: { in: ids } } }),
      this.prisma.paymentSettlement.count({ where: { merchTxnId: { in: merch } } }),
    ])
    return {
      paymentIds: ids,
      onlineTransactions: payments.filter((row) => row.paymentMode === "ONLINE").length,
      offlineTransactions: payments.filter((row) => row.paymentMode !== "ONLINE").length,
      paymentAllocations: allocations,
      receipts: payments.filter((row) => row.receiptNumber).length,
      ledgerEntries: allocations,
      gatewayCallbacks: callbacks,
      gatewayTransactions: transactions,
      refunds,
      reconciliationRecords: settlements,
      consumersAffected: new Set(payments.flatMap((row) => (row.surveyId ? [row.surveyId] : []))).size,
      amount: moneyString(sumMoney(payments.map((row) => row.amount.toString()))),
      totalRecords:
        payments.length + allocations + callbacks + transactions + refunds + settlements,
    }
  }

  private async preservedCounts() {
    const [surveys, wards, demands, assessmentYears, taxConfigs, rebatePolicies, penaltyPolicies, users, roles, auditLogs] =
      await Promise.all([
        this.prisma.survey.count(),
        this.prisma.ward.count(),
        this.prisma.assessmentDemand.count(),
        this.prisma.assessmentYearProfile.count(),
        this.prisma.taxConfig.count(),
        this.prisma.rebatePolicy.count(),
        this.prisma.penaltyPolicy.count(),
        this.prisma.user.count(),
        this.prisma.role.count(),
        this.prisma.auditLog.count(),
      ])
    return { surveys, wards, demands, assessmentYears, taxConfigs, rebatePolicies, penaltyPolicies, users, roles, auditLogs }
  }

  /** Freezes the reviewed list. A later change to any of these payments stops the reset. */
  async prepare(user: AuthUser, approvedPaymentIds: string[]) {
    assertSuperAdmin(user)
    const preview = await this.preview(user, approvedPaymentIds)
    const ids = preview.selected.paymentIds
    if (ids.length === 0) {
      throw new BadRequestException({
        code: "RESET_NOTHING_SELECTED",
        message: "No payments are selected",
      })
    }
    const facts = await this.prisma.payment.findMany({ where: { id: { in: ids } }, select: PAYMENT_FACTS })
    const { paymentIds: _ids, ...counts } = preview.selected
    const run = await this.prisma.productionResetRun.create({
      data: {
        scope: {
          autoIncluded: preview.autoIncluded.length,
          reviewedAndApproved: approvedPaymentIds.filter((id) => ids.includes(id)),
        },
        paymentIds: ids,
        counts: { ...counts, preserved: preview.preserved },
        scopeHash: scopeHash(facts.map(toFacts)),
        requestedById: user.id,
      },
    })
    await this.prisma.auditLog.create({
      data: {
        action: "PRODUCTION_RESET_PREPARED",
        entity: "ProductionResetRun",
        entityId: run.id,
        actorId: user.id,
        newValue: { counts, payments: ids.length },
      },
    })
    return this.toRunDto(run)
  }

  private async runOrThrow(id: string) {
    const run = await this.prisma.productionResetRun.findUnique({ where: { id } })
    if (!run) {
      throw new NotFoundException({ code: "RESET_RUN_NOT_FOUND", message: "Reset run was not found" })
    }
    return run
  }

  private idsOf(run: { paymentIds: Prisma.JsonValue }): string[] {
    return Array.isArray(run.paymentIds) ? (run.paymentIds as string[]) : []
  }

  private async backupDocument(run: { id: string; paymentIds: Prisma.JsonValue }) {
    const ids = this.idsOf(run)
    const [payments, allocations, callbacks, transactions, refunds, sequences] = await Promise.all([
      this.prisma.payment.findMany({ where: { id: { in: ids } } }),
      this.prisma.paymentAllocation.findMany({ where: { paymentId: { in: ids } } }),
      this.prisma.paymentCallback.findMany({ where: { paymentId: { in: ids } } }),
      this.prisma.paymentTransaction.findMany({ where: { paymentId: { in: ids } } }),
      this.prisma.paymentRefund.findMany({ where: { paymentId: { in: ids } } }),
      this.prisma.receiptSequence.findMany(),
    ])
    const merch = payments.flatMap((row) => (row.merchTxnId ? [row.merchTxnId] : []))
    const settlements = await this.prisma.paymentSettlement.findMany({ where: { merchTxnId: { in: merch } } })
    return {
      format: "npp-dhanaura-reset-backup/1",
      runId: run.id,
      createdAt: new Date().toISOString(),
      payments,
      allocations,
      callbacks,
      transactions,
      refunds,
      settlements,
      receiptSequences: sequences,
    }
  }

  /** Writes the affected rows to storage, reads them back and checks them. */
  async createBackup(runId: string, user: AuthUser) {
    assertSuperAdmin(user)
    const run = await this.runOrThrow(runId)
    if (!["PREPARED", "BACKUP_VERIFIED"].includes(run.status)) {
      throw new ConflictException({
        code: "RESET_NOT_READY",
        message: `A backup cannot be created from status ${run.status}`,
      })
    }
    const document = await this.backupDocument(run)
    const buffer = Buffer.from(JSON.stringify(document), "utf8")
    const key = `production-reset/${run.id}.json`
    await this.storage.putObject(key, buffer, "application/json")
    const digest = sha256(buffer)
    const verified = await this.verifyStoredBackup(key, digest, this.idsOf(run).length)
    const updated = await this.prisma.productionResetRun.update({
      where: { id: run.id },
      data: {
        status: verified ? "BACKUP_VERIFIED" : "PREPARED",
        backupKey: key,
        backupSha256: digest,
        backupBytes: buffer.length,
        backupVerifiedAt: verified ? new Date() : null,
      },
    })
    await this.prisma.auditLog.create({
      data: {
        action: "PRODUCTION_RESET_BACKUP",
        entity: "ProductionResetRun",
        entityId: run.id,
        actorId: user.id,
        newValue: { sha256: digest, bytes: buffer.length, verified },
      },
    })
    if (!verified) {
      throw new ConflictException({
        code: "RESET_BACKUP_FAILED",
        message: "The backup could not be read back correctly. Nothing was changed.",
      })
    }
    return this.toRunDto(updated)
  }

  private async verifyStoredBackup(key: string, digest: string, expectedPayments: number) {
    try {
      const stored = await this.storage.getObject(key)
      if (sha256(stored) !== digest) return false
      const parsed = JSON.parse(stored.toString("utf8")) as { payments?: unknown[] }
      return parsed.payments?.length === expectedPayments
    } catch {
      return false
    }
  }

  async downloadBackup(runId: string, user: AuthUser) {
    assertSuperAdmin(user)
    const run = await this.runOrThrow(runId)
    if (!run.backupKey) {
      throw new NotFoundException({ code: "RESET_BACKUP_NOT_FOUND", message: "No backup exists for this run" })
    }
    const buffer = await this.storage.getObject(run.backupKey)
    await this.prisma.auditLog.create({
      data: {
        action: "PRODUCTION_RESET_BACKUP_DOWNLOADED",
        entity: "ProductionResetRun",
        entityId: run.id,
        actorId: user.id,
      },
    })
    return { buffer, fileName: `production-reset-${run.id}.json` }
  }

  async requestApproval(runId: string, reason: string, user: AuthUser) {
    assertSuperAdmin(user)
    const run = await this.runOrThrow(runId)
    if (run.status !== "BACKUP_VERIFIED") {
      throw new ConflictException({ code: "RESET_NOT_READY", message: "Verify the backup first" })
    }
    const updated = await this.prisma.productionResetRun.update({
      where: { id: run.id },
      data: { status: "AWAITING_APPROVAL", reason: reason.trim() },
    })
    return this.toRunDto(updated)
  }

  /** The person who asked for the reset cannot approve it. */
  async approve(runId: string, user: AuthUser) {
    assertSuperAdmin(user)
    const run = await this.runOrThrow(runId)
    if (run.status !== "AWAITING_APPROVAL") {
      throw new ConflictException({ code: "RESET_NOT_READY", message: "This reset is not awaiting approval" })
    }
    if (run.requestedById === user.id) {
      throw new ForbiddenException({
        code: "RESET_SELF_APPROVAL",
        message: "A different Super Admin must approve this reset",
      })
    }
    const updated = await this.prisma.productionResetRun.update({
      where: { id: run.id },
      data: { status: "APPROVED", approvedById: user.id },
    })
    await this.prisma.auditLog.create({
      data: {
        action: "PRODUCTION_RESET_APPROVED",
        entity: "ProductionResetRun",
        entityId: run.id,
        actorId: user.id,
      },
    })
    return this.toRunDto(updated)
  }

  async cancel(runId: string, user: AuthUser) {
    assertSuperAdmin(user)
    const run = await this.runOrThrow(runId)
    if (run.status === "EXECUTED") {
      throw new ConflictException({ code: "RESET_ALREADY_EXECUTED", message: "This reset has already run" })
    }
    const updated = await this.prisma.productionResetRun.update({
      where: { id: run.id },
      data: { status: "CANCELLED" },
    })
    await this.prisma.auditLog.create({
      data: {
        action: "PRODUCTION_RESET_CANCELLED",
        entity: "ProductionResetRun",
        entityId: run.id,
        actorId: user.id,
      },
    })
    return this.toRunDto(updated)
  }

  async execute(runId: string, dto: { confirmationPhrase: string; reason: string }, user: AuthUser) {
    assertSuperAdmin(user)
    const run = await this.runOrThrow(runId)
    const ids = this.idsOf(run)
    const backupOk = Boolean(
      run.backupKey &&
        run.backupSha256 &&
        run.backupVerifiedAt &&
        (await this.verifyStoredBackup(run.backupKey, run.backupSha256, ids.length))
    )
    const blockers = resetBlockers({
      enabled: isEnabled(),
      status: run.status,
      phrase: dto.confirmationPhrase,
      reason: dto.reason,
      secondApprovalRequired: secondApprovalRequired(),
      backupVerified: backupOk,
    })
    if (blockers.length > 0) {
      throw new ConflictException({
        code: blockers[0]!.code,
        message: blockers[0]!.message,
        details: { blockers },
      })
    }

    const before = await this.preservedCounts()
    try {
      const deleted = await this.prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM payment WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`
          const facts = await tx.payment.findMany({ where: { id: { in: ids } }, select: PAYMENT_FACTS })
          if (facts.length !== ids.length || scopeHash(facts.map(toFacts)) !== run.scopeHash) {
            throw new ConflictException({
              code: "RESET_SCOPE_CHANGED",
              message: "A selected payment changed after the review. Nothing was cleared. Prepare the reset again.",
            })
          }
          const merch = (
            await tx.payment.findMany({ where: { id: { in: ids } }, select: { merchTxnId: true } })
          ).flatMap((row) => (row.merchTxnId ? [row.merchTxnId] : []))
          const counts = {
            allocations: (await tx.paymentAllocation.deleteMany({ where: { paymentId: { in: ids } } })).count,
            callbacks: (await tx.paymentCallback.deleteMany({ where: { paymentId: { in: ids } } })).count,
            transactions: (await tx.paymentTransaction.deleteMany({ where: { paymentId: { in: ids } } })).count,
            refunds: (await tx.paymentRefund.deleteMany({ where: { paymentId: { in: ids } } })).count,
            settlements: (await tx.paymentSettlement.deleteMany({ where: { merchTxnId: { in: merch } } })).count,
            payments: (await tx.payment.deleteMany({ where: { id: { in: ids } } })).count,
          }
          await this.resetReceiptSequences(tx)
          await enqueuePublicSync(tx, {
            eventType: "PRODUCTION_RESET",
            uniqueSuffix: run.id,
          })
          await tx.auditLog.create({
            data: {
              action: "PRODUCTION_RESET_EXECUTED",
              entity: "ProductionResetRun",
              entityId: run.id,
              actorId: user.id,
              oldValue: { paymentIds: ids } as Prisma.InputJsonValue,
              newValue: counts as Prisma.InputJsonValue,
              metadata: {
                reason: dto.reason.trim(),
                backupSha256: run.backupSha256,
                requestedById: run.requestedById,
                approvedById: run.approvedById,
              } as Prisma.InputJsonValue,
            },
          })
          await tx.productionResetRun.update({
            where: { id: run.id },
            data: {
              status: "EXECUTED",
              executedById: user.id,
              executedAt: new Date(),
              reason: dto.reason.trim(),
            },
          })
          return counts
        },
        { timeout: 120_000 }
      )
      const report = await this.postResetReport(ids, deleted, before)
      const updated = await this.prisma.productionResetRun.update({
        where: { id: run.id },
        data: { report: report as unknown as Prisma.InputJsonValue },
      })
      return { ...this.toRunDto(updated), report }
    } catch (error) {
      if (error instanceof ConflictException) throw error
      const failure = error instanceof Error ? error.message : String(error)
      await this.prisma.productionResetRun.update({
        where: { id: run.id },
        data: { status: "FAILED", failure: failure.slice(0, 1000) },
      })
      await this.prisma.auditLog.create({
        data: {
          action: "PRODUCTION_RESET_FAILED",
          entity: "ProductionResetRun",
          entityId: run.id,
          actorId: user.id,
          newValue: { failure: failure.slice(0, 1000) },
        },
      })
      throw new ConflictException({
        code: "RESET_FAILED",
        message: "The reset failed and was rolled back. Nothing was cleared.",
      })
    }
  }

  /** Each counter continues after the highest receipt still on record, so no number is issued twice. */
  private async resetReceiptSequences(tx: Prisma.TransactionClient) {
    const sequences = await tx.receiptSequence.findMany()
    for (const sequence of sequences) {
      const prefix = formatReceiptNumber(sequence.yearCode, 0).replace(/\d+$/, "")
      const remaining = await tx.payment.findMany({
        where: { receiptNumber: { startsWith: prefix } },
        select: { receiptNumber: true },
      })
      const highest = remaining.reduce((max, row) => {
        const value = Number(row.receiptNumber?.slice(prefix.length))
        return Number.isFinite(value) && value > max ? value : max
      }, 0)
      if (highest === 0) {
        await tx.receiptSequence.delete({ where: { yearCode: sequence.yearCode } })
      } else {
        await tx.receiptSequence.update({
          where: { yearCode: sequence.yearCode },
          data: { lastValue: highest },
        })
      }
    }
  }

  private async postResetReport(
    ids: string[],
    deleted: Record<string, number>,
    before: Awaited<ReturnType<ProductionResetService["preservedCounts"]>>
  ) {
    const after = await this.preservedCounts()
    const [paymentsLeft, allocationsLeft, duplicates, orphanAllocations, remainingCollected] = await Promise.all([
      this.prisma.payment.count({ where: { id: { in: ids } } }),
      this.prisma.paymentAllocation.count({ where: { paymentId: { in: ids } } }),
      this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count FROM (
          SELECT "paymentId", "assessmentDemandId" FROM payment_allocation
          GROUP BY 1, 2 HAVING COUNT(*) > 1
        ) dup`,
      this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count FROM payment_allocation a
        LEFT JOIN payment p ON p.id = a."paymentId"
        WHERE p.id IS NULL`,
      this.prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    ])
    const mastersPreserved = (Object.keys(after) as Array<keyof typeof after>)
      .filter((key) => key !== "auditLogs")
      .every((key) => after[key] === before[key])
    const stats = await this.stats.statsFresh()
    return {
      deleted,
      checks: {
        selectedPaymentsCleared: paymentsLeft === 0 && allocationsLeft === 0,
        noOrphanAllocations: Number(orphanAllocations[0]?.count ?? 0) === 0,
        noDuplicateAllocations: Number(duplicates[0]?.count ?? 0) === 0,
        masterDataPreserved: mastersPreserved,
        auditTrailRetained: after.auditLogs >= before.auditLogs,
      },
      before,
      after,
      remainingSuccessfulPayments: moneyString(remainingCollected._sum.amount ?? 0),
      publicStatistics: {
        assessmentYear: stats.assessmentYear?.name ?? null,
        collected: stats.collectionsInternal.collected,
        propertyTax: stats.collectionsInternal.propertyTax,
        waterTax: stats.collectionsInternal.waterTax,
        drainageTax: stats.collectionsInternal.drainageTax,
      },
      note: "Receipt counters continue after the highest receipt still on record. Printed test receipts are no longer valid.",
    }
  }

  private toRunDto(run: {
    id: string
    status: string
    counts: Prisma.JsonValue
    backupSha256: string | null
    backupBytes: number | null
    backupVerifiedAt: Date | null
    reason: string | null
    requestedById: string
    approvedById: string | null
    executedAt: Date | null
    report: Prisma.JsonValue
    failure: string | null
  }) {
    return {
      id: run.id,
      status: run.status,
      counts: run.counts,
      backupSha256: run.backupSha256,
      backupBytes: run.backupBytes,
      backupVerifiedAt: run.backupVerifiedAt,
      reason: run.reason,
      requestedById: run.requestedById,
      approvedById: run.approvedById,
      executedAt: run.executedAt,
      report: run.report,
      failure: run.failure,
    }
  }
}
