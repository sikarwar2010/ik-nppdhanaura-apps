/**
 * Separate tax accounting, online settlement, website sync and production reset
 * against a real PostgreSQL database. Runs only when COLLECTIONS_IT_DATABASE_URL
 * points at a disposable copy, because it runs a real production reset:
 *
 *   COLLECTIONS_IT_DATABASE_URL=postgresql://…/npdh_it pnpm exec jest \
 *     --config ./test/jest-e2e.json test/separate-tax.e2e-spec.ts
 */
import { createServer, type Server } from "node:http"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { Prisma } from "@prisma/client"

import { AuditService } from "../src/audit/audit.service"
import type { AuthUser } from "../src/auth/auth.decorators"
import { CollectionsService } from "../src/collections/collections.service"
import type { CollectTaxDto } from "../src/collections/collections.dto"
import { PaymentSettlementService } from "../src/collections/payment-settlement.service"
import { DemandsService } from "../src/demands/demands.service"
import { PaymentsService } from "../src/payments/payments.service"
import { PrismaService } from "../src/prisma/prisma.service"
import { RESET_CONFIRMATION_PHRASE } from "../src/production-reset/production-reset.rules"
import { ProductionResetService } from "../src/production-reset/production-reset.service"
import { onlineTaxPlan } from "../src/public-property-tax/public-property-tax.service"
import { PublicSyncService } from "../src/public-ward-stats/public-sync.service"
import { PublicWardStatsService } from "../src/public-ward-stats/public-ward-stats.service"
import { outstandingToNoticeLedger } from "../src/reports/demand-notice/demand-notice-view-model"
import { StorageService } from "../src/storage/storage.service"
import { TaxConfigsService } from "../src/tax-configs/tax-configs.service"

const url = process.env.COLLECTIONS_IT_DATABASE_URL
const suite = url ? describe : describe.skip

suite("separate tax accounting on a real database", () => {
  let prisma: PrismaService
  let collections: CollectionsService
  let demands: DemandsService
  let payments: PaymentsService
  let stats: PublicWardStatsService
  let sync: PublicSyncService
  let reset: ProductionResetService
  let clerk: AuthUser
  let superAdmin: AuthUser
  let free: Array<{ id: string; surveyId: string; wardId: string; ownerName: string | null; mobile: string | null }>
  let nextFree = 0
  const Y1 = { id: "", code: "AY_2181_2182", name: "2181-2182" }
  const Y2 = { id: "", code: "AY_2182_2183", name: "2182-2183" }
  const run = Date.now().toString(36)

  async function year(y: typeof Y1, startsOn: string, endsOn: string) {
    const category = await prisma.referenceCategory.findFirstOrThrow({
      where: { code: "ASSESSMENT_YEAR" },
    })
    const entry = await prisma.referenceEntry.create({
      data: { categoryId: category.id, code: y.code, name: y.name, status: "ACTIVE", sortOrder: 9000 },
    })
    await prisma.assessmentYearProfile.create({
      data: { referenceEntryId: entry.id, startsOn: new Date(startsOn), endsOn: new Date(endsOn), status: "ACTIVE" },
    })
    y.id = entry.id
  }

  async function publish(surveyId: string, y: typeof Y1, property: string, water: string) {
    const survey = await prisma.survey.findUniqueOrThrow({ where: { id: surveyId } })
    return prisma.assessmentDemand.create({
      data: {
        surveyId,
        wardId: survey.wardId,
        assessmentYearId: y.id,
        demandReference: `IT-${run}-${y.code}-${surveyId}`,
        status: "PUBLISHED",
        source: "CALCULATED",
        propertyTax: property,
        waterTax: water,
        drainageTax: "0",
        currentYearDemand: (Number(property) + Number(water)).toFixed(2),
        verificationStatus: "VERIFIED",
        publishedAt: new Date(),
        publishedById: clerk.id,
      },
    })
  }

  /** A property with verified nil history and ₹2,400 property + ₹1,800 water for Y1. */
  async function newConsumer(property = "2400.00", water = "1800.00") {
    const consumer = free[nextFree++]
    if (!consumer) throw new Error("Not enough free properties in the copy")
    const earlier = await prisma.referenceEntry.findMany({
      where: { category: { code: "ASSESSMENT_YEAR" }, code: { lt: Y1.code }, yearProfile: { isNot: null } },
    })
    for (const entry of earlier) {
      await prisma.assessmentDemand.create({
        data: {
          surveyId: consumer.id,
          wardId: consumer.wardId,
          assessmentYearId: entry.id,
          demandReference: `IT-${run}-${entry.code}-${consumer.id}`,
          status: "PUBLISHED",
          source: "OPENING_BALANCE",
          balanceKind: "CLOSING_ONLY",
          propertyTax: "0",
          waterTax: "0",
          drainageTax: "0",
          currentYearDemand: "0",
          verificationStatus: "VERIFIED",
          verifiedById: clerk.id,
          verifiedAt: new Date(),
          publishedAt: new Date(),
          publishedById: clerk.id,
        },
      })
    }
    await publish(consumer.id, Y1, property, water)
    return consumer
  }

  let keyCounter = 0
  const collect = (
    surveyId: string,
    amount: string,
    tax: Pick<CollectTaxDto, "taxKind" | "parts" | "remarks" | "paymentMode" | "reference">,
    y = Y1
  ) =>
    collections.collect(
      { surveyId, assessmentYearId: y.id, amount, paymentMode: "CASH", ...tax },
      clerk,
      `it-${run}-${++keyCounter}`
    )

  const position = async (surveyId: string, y = Y1) =>
    (await demands.outstanding(surveyId, y.id)).taxPosition

  const useFakeGateway = () => {
    ;(payments as unknown as { provider: unknown }).provider = {
      name: "uat-test",
      createPayment: async () => ({ raw: { test: true } }),
      requery: async () => ({ statusCode: "OTS0000", success: true, amount: 0, raw: {} }),
      refund: async () => ({ statusCode: "OTS0000", success: true, raw: {} }),
    }
  }

  async function startOnline(surveyId: string, wardId: string, kind: "PROPERTY_TAX" | "WATER_TAX" | "COMBINED") {
    const tax = await position(surveyId)
    const plan = onlineTaxPlan(kind, tax.outstanding)
    const total = Object.values(plan.parts).reduce((sum, value) => sum + Number(value), 0)
    const { payment } = await payments.createCitizenOnline({
      amount: total,
      surveyId,
      wardId,
      payerMobile: "9000000000",
      assessmentYearId: Y1.id,
      taxPlan: plan,
    })
    return payment
  }

  const gatewaySays = (merchTxnId: string, statusCode = "OTS0000", atomTxnId = `ATOM-${merchTxnId}`) =>
    payments.handleCallback({ merchTxnId, atomTxnId, statusCode })

  beforeAll(async () => {
    process.env.DATABASE_URL = url
    process.env.PUBLIC_DISCLOSE_COLLECTIONS = "true"
    process.env.STORAGE_DIR = mkdtempSync(join(tmpdir(), "reset-it-"))
    delete process.env.WEB_REVALIDATE_URL
    prisma = new PrismaService()
    await prisma.$connect()
    const audit = new AuditService(prisma)
    demands = new DemandsService(prisma, audit, new TaxConfigsService(prisma, audit))
    const settlement = new PaymentSettlementService(demands)
    collections = new CollectionsService(prisma, demands, audit, settlement)
    payments = new PaymentsService(prisma, audit, settlement)
    useFakeGateway()
    stats = new PublicWardStatsService(prisma)
    sync = new PublicSyncService(prisma, stats)
    const storage = new StorageService()
    storage.onModuleInit()
    reset = new ProductionResetService(prisma, storage, stats)
    const admin = await prisma.user.findFirstOrThrow({ orderBy: { createdAt: "asc" } })
    clerk = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      status: "ACTIVE",
      roles: ["CLERK"],
      permissions: ["demand:read", "payment:collect"],
    }
    superAdmin = { ...clerk, roles: ["SUPER_ADMIN"], permissions: [] }
    await year(Y1, "2181-04-01", "2182-03-31")
    await year(Y2, "2182-04-01", "2183-03-31")
    free = await prisma.survey.findMany({
      where: { deletedAt: null, status: "ACTIVE", demands: { none: {} }, payments: { none: {} } },
      take: 30,
      orderBy: { surveyId: "desc" },
      select: { id: true, surveyId: true, wardId: true, ownerName: true, mobile: true },
    })
  }, 60_000)

  afterAll(async () => {
    await prisma?.$disconnect()
  })

  describe("offline collection", () => {
    it("1, 9, 17: full property tax clears property tax and leaves water untouched", async () => {
      const ram = await newConsumer()
      const result = await collect(ram.id, "2400.00", { taxKind: "PROPERTY_TAX" })
      expect(result.status).toBe("SUCCESS")
      expect(result.remaining).toBe("1800.00")
      const tax = await position(ram.id)
      expect(tax.current.propertyTax).toBe("0.00")
      expect(tax.current.waterTax).toBe("1800.00")
      expect(tax.total).toBe("1800.00")
      const row = await prisma.paymentAllocation.findFirstOrThrow({ where: { paymentId: result.paymentId } })
      expect(row.propertyTaxAmount?.toFixed(2)).toBe("2400.00")
      expect(row.waterTaxAmount?.toFixed(2)).toBe("0.00")
      const html = await collections.receiptHtml(result.paymentId, "consumer", clerk)
      expect(html).toContain("Property Tax Receipt")
      expect(html).toContain("Unpaid / अवैतनिक")
    })

    it("2, 18: partial property tax leaves the rest as property tax", async () => {
      const ram = await newConsumer()
      await collect(ram.id, "1000.00", { taxKind: "PROPERTY_TAX" })
      const tax = await position(ram.id)
      expect(tax.current).toMatchObject({ propertyTax: "1400.00", waterTax: "1800.00" })
    })

    it("3, 19: full water tax", async () => {
      const ram = await newConsumer()
      const result = await collect(ram.id, "1800.00", { taxKind: "WATER_TAX" })
      const tax = await position(ram.id)
      expect(tax.current).toMatchObject({ propertyTax: "2400.00", waterTax: "0.00" })
      expect(await collections.receiptHtml(result.paymentId, "office", clerk)).toContain("Water Tax Receipt")
    })

    it("4, 20: partial water tax", async () => {
      const ram = await newConsumer()
      await collect(ram.id, "300.00", { taxKind: "WATER_TAX" })
      expect((await position(ram.id)).current).toMatchObject({ propertyTax: "2400.00", waterTax: "1500.00" })
    })

    it("5, 21: a combined payment gives one receipt with both taxes", async () => {
      const ram = await newConsumer()
      const result = await collect(ram.id, "4200.00", {
        taxKind: "COMBINED",
        parts: { propertyTax: "2400.00", waterTax: "1800.00" },
      })
      expect(result.remaining).toBe("0.00")
      expect(await prisma.payment.count({ where: { surveyId: ram.id } })).toBe(1)
      const html = await collections.receiptHtml(result.paymentId, "both", clerk)
      expect(html).toContain("Combined Tax Receipt")
    })

    it("6: different partial amounts: ₹1,500 + ₹500 leaves ₹900 + ₹1,300", async () => {
      const ram = await newConsumer()
      const result = await collect(ram.id, "2000.00", {
        taxKind: "COMBINED",
        parts: { propertyTax: "1500.00", waterTax: "500.00" },
      })
      expect(result.remaining).toBe("2200.00")
      expect((await position(ram.id)).current).toMatchObject({ propertyTax: "900.00", waterTax: "1300.00" })
    })

    it("refuses an amount above that tax's balance and saves nothing", async () => {
      const ram = await newConsumer()
      await expect(collect(ram.id, "2401.00", { taxKind: "PROPERTY_TAX" })).rejects.toMatchObject({ status: 400 })
      await expect(
        collect(ram.id, "100.00", { taxKind: "COMBINED", parts: { propertyTax: "60.00", waterTax: "30.00" } })
      ).rejects.toMatchObject({ status: 400 })
      await expect(collect(ram.id, "100.00", {})).rejects.toMatchObject({ status: 400 })
      expect(await prisma.payment.count({ where: { surveyId: ram.id } })).toBe(0)
    })

    it("22: the same key twice, or two at once, posts once", async () => {
      const ram = await newConsumer()
      const key = `it-${run}-dup`
      const dto = {
        surveyId: ram.id,
        assessmentYearId: Y1.id,
        amount: "500.00",
        paymentMode: "CASH" as const,
        taxKind: "WATER_TAX" as const,
      }
      const [one, two] = await Promise.all([
        collections.collect(dto, clerk, key),
        collections.collect(dto, clerk, key),
      ])
      expect(one.paymentId).toBe(two.paymentId)
      expect(await prisma.payment.count({ where: { idempotencyKey: key } })).toBe(1)
      expect((await position(ram.id)).current.waterTax).toBe("1300.00")
    })

    it("a cheque keeps its tax until it clears, and a reversal restores only that tax", async () => {
      const ram = await newConsumer()
      const pending = await collect(ram.id, "800.00", {
        taxKind: "WATER_TAX",
        paymentMode: "CHEQUE",
        reference: "CHQ-1",
      })
      expect(pending.status).toBe("PENDING")
      expect((await position(ram.id)).current.waterTax).toBe("1800.00")
      const cleared = await collections.confirm(pending.paymentId, clerk)
      expect(cleared.status).toBe("SUCCESS")
      expect((await position(ram.id)).current).toMatchObject({ propertyTax: "2400.00", waterTax: "1000.00" })
      await demands.reversePayment(cleared.paymentId, { reason: "Cheque bounced" }, clerk.id)
      expect((await position(ram.id)).current).toMatchObject({ propertyTax: "2400.00", waterTax: "1800.00" })
    })

    it("a cheque accepted before this change still clears, with no tax plan on it", async () => {
      const ram = await newConsumer()
      const pending = await collect(ram.id, "2000.00", {
        taxKind: "COMBINED",
        parts: { waterTax: "1800.00", propertyTax: "200.00" },
        paymentMode: "CHEQUE",
        reference: "CHQ-OLD",
      })
      await prisma.payment.update({ where: { id: pending.paymentId }, data: { taxPlan: Prisma.DbNull } })
      const cleared = await collections.confirm(pending.paymentId, clerk)
      expect(cleared.status).toBe("SUCCESS")
      expect((await position(ram.id)).current).toMatchObject({ propertyTax: "2200.00", waterTax: "0.00" })
    })

    it("24: the ledger shows each tax and reconciles", async () => {
      const ram = await newConsumer()
      await collect(ram.id, "2400.00", { taxKind: "PROPERTY_TAX" })
      const ledger = await collections.ledger({ surveyId: ram.id, assessmentYearId: Y1.id }, clerk)
      expect(ledger.reconciles).toBe(true)
      expect(ledger.closingBalance).toBe("1800.00")
      expect(ledger.taxPosition?.outstanding).toMatchObject({ propertyTax: "0.00", waterTax: "1800.00" })
      const paid = ledger.entries.find((entry) => entry.type === "PAYMENT")!
      expect(paid.parts.propertyTax).toBe("-2400.00")
      expect(paid.parts.waterTax).toBe("0.00")
    })
  })

  describe("carry-forward", () => {
    it("7, 8, 10: each tax carries forward under its own name, once", async () => {
      const ram = await newConsumer()
      await collect(ram.id, "2400.00", { taxKind: "PROPERTY_TAX" })
      await publish(ram.id, Y2, "0.00", "2000.00")
      const breakdown = await demands.outstanding(ram.id, Y2.id)
      const tax = breakdown.taxPosition
      expect(tax.arrears).toMatchObject({ propertyTax: "0.00", waterTax: "1800.00" })
      expect(tax.current.waterTax).toBe("2000.00")
      expect(tax.outstanding.waterTax).toBe("3800.00")
      expect(breakdown.netOutstanding).toBe("3800.00")
      expect(breakdown.previousWaterTaxOutstanding).toBe("1800.00")
      expect(breakdown.previousPropertyTaxOutstanding).toBe("0.00")

      // The next water payment goes to the original year first.
      const result = await collect(ram.id, "1800.00", { taxKind: "WATER_TAX" }, Y2)
      expect(result.allocations?.[0]?.assessmentYearCode).toBe(Y1.code)
      expect((await position(ram.id, Y2)).arrears.waterTax).toBe("0.00")
      expect((await position(ram.id, Y2)).current.waterTax).toBe("2000.00")
    })

    it("the demand notice shows the same per-tax arrears", async () => {
      const ram = await newConsumer()
      await collect(ram.id, "1800.00", { taxKind: "WATER_TAX" })
      await publish(ram.id, Y2, "1000.00", "500.00")
      const breakdown = await demands.outstanding(ram.id, Y2.id)
      const { ledger } = outstandingToNoticeLedger(breakdown)
      expect(ledger.previousArrears).toBe(2400)
      expect(breakdown.previousPropertyTaxOutstanding).toBe("2400.00")
      expect(breakdown.previousWaterTaxOutstanding).toBe("0.00")
    })

    it("year-end reports each tax's carry-forward, adding up to the closing total", async () => {
      const preview = await collections.yearEndPreview(Y1.id)
      const parts = preview.taxCarryForward
      const sum =
        Number(parts.propertyTax) + Number(parts.waterTax) + Number(parts.drainageTax) +
        Number(parts.charges) + Number(parts.historical)
      expect(sum.toFixed(2)).toBe(preview.report.closingCarryForward)
    })
  })

  describe("online collection", () => {
    it("11: a verified property-tax payment reduces only property tax, with a receipt", async () => {
      const ram = await newConsumer()
      const payment = await startOnline(ram.id, ram.wardId, "PROPERTY_TAX")
      expect(payment.amount.toFixed(2)).toBe("2400.00")
      expect((await position(ram.id)).total).toBe("4200.00") // not paid until verified
      await gatewaySays(payment.merchTxnId!)
      expect((await position(ram.id)).current).toMatchObject({ propertyTax: "0.00", waterTax: "1800.00" })
      const html = await collections.receiptHtml(payment.id, "consumer", clerk)
      expect(html).toContain("Property Tax Receipt")
      expect(html).toContain("Online")
    })

    it("12: a verified water-tax payment reduces only water tax", async () => {
      const ram = await newConsumer()
      const payment = await startOnline(ram.id, ram.wardId, "WATER_TAX")
      await gatewaySays(payment.merchTxnId!)
      expect((await position(ram.id)).current).toMatchObject({ propertyTax: "2400.00", waterTax: "0.00" })
    })

    it("13: a combined payment is split between both", async () => {
      const ram = await newConsumer()
      const payment = await startOnline(ram.id, ram.wardId, "COMBINED")
      expect(payment.amount.toFixed(2)).toBe("4200.00")
      await gatewaySays(payment.merchTxnId!)
      expect((await position(ram.id)).total).toBe("0.00")
      const row = await prisma.paymentAllocation.findFirstOrThrow({ where: { paymentId: payment.id } })
      expect(row.propertyTaxAmount?.toFixed(2)).toBe("2400.00")
      expect(row.waterTaxAmount?.toFixed(2)).toBe("1800.00")
    })

    it("pays arrears too: a defect fix, the old code allocated only the selected year", async () => {
      const ram = await newConsumer()
      await publish(ram.id, Y2, "1000.00", "0.00")
      const tax = await position(ram.id, Y2)
      const plan = onlineTaxPlan("PROPERTY_TAX", tax.outstanding)
      const { payment } = await payments.createCitizenOnline({
        amount: 3400,
        surveyId: ram.id,
        wardId: ram.wardId,
        payerMobile: "9000000000",
        assessmentYearId: Y2.id,
        taxPlan: plan,
      })
      await gatewaySays(payment.merchTxnId!)
      const after = await position(ram.id, Y2)
      expect(after.outstanding.propertyTax).toBe("0.00")
      const rows = await prisma.paymentAllocation.findMany({ where: { paymentId: payment.id } })
      expect(rows).toHaveLength(2)
    })

    it("14: failed and pending payments change no balance and issue no receipt", async () => {
      const ram = await newConsumer()
      const failed = await startOnline(ram.id, ram.wardId, "COMBINED")
      expect((await position(ram.id)).total).toBe("4200.00")
      await gatewaySays(failed.merchTxnId!, "F", "ATOM-F")
      const row = await prisma.payment.findUniqueOrThrow({ where: { id: failed.id } })
      expect(row.status).toBe("FAILED")
      expect(row.receiptSnapshot).toBeNull()
      expect((await position(ram.id)).total).toBe("4200.00")
      await expect(collections.receiptHtml(failed.id, "consumer", clerk)).rejects.toMatchObject({ status: 409 })
    })

    it("15: duplicate and concurrent callbacks post once", async () => {
      const ram = await newConsumer()
      const payment = await startOnline(ram.id, ram.wardId, "PROPERTY_TAX")
      const merch = payment.merchTxnId!
      await Promise.allSettled([gatewaySays(merch), gatewaySays(merch), gatewaySays(merch)])
      await gatewaySays(merch)
      expect(await prisma.paymentAllocation.count({ where: { paymentId: payment.id } })).toBe(1)
      expect((await position(ram.id)).current.propertyTax).toBe("0.00")
      expect(await prisma.publicSyncEvent.count({ where: { paymentId: payment.id } })).toBe(1)
    })

    it("a payment overtaken at the counter is held, never moved to the other tax", async () => {
      const ram = await newConsumer()
      const payment = await startOnline(ram.id, ram.wardId, "PROPERTY_TAX")
      await collect(ram.id, "2000.00", { taxKind: "PROPERTY_TAX" })
      await gatewaySays(payment.merchTxnId!)
      expect((await position(ram.id)).current).toMatchObject({ propertyTax: "0.00", waterTax: "1800.00" })
      const list = await collections.onlineTransactions({ search: ram.surveyId })
      expect(list.items[0]).toMatchObject({ status: "SUCCESS", allocated: "400.00", unallocated: "2000.00" })
      expect(await collections.receiptHtml(payment.id, "office", clerk)).toContain("held for reconciliation")
    })

    it("16: requery checks the gateway's amount before recognising money", async () => {
      const ram = await newConsumer()
      const payment = await startOnline(ram.id, ram.wardId, "WATER_TAX")
      const provider = (payments as unknown as { provider: { name: string; requery: unknown } }).provider
      provider.name = "atom-ndps"
      provider.requery = async () => ({ statusCode: "OTS0000", success: true, atomTxnId: "A-R", amount: 1, raw: {} })
      const refused = await payments.syncCitizenPaymentByMerchTxnId(payment.merchTxnId!)
      expect(refused.status).toBe("PENDING")
      expect((await position(ram.id)).current.waterTax).toBe("1800.00")
      provider.requery = async () => ({ statusCode: "OTS0000", success: true, atomTxnId: "A-R", amount: 1800, raw: {} })
      const ok = await payments.syncCitizenPaymentByMerchTxnId(payment.merchTxnId!)
      expect(ok.status).toBe("SUCCESS")
      expect((await position(ram.id)).current.waterTax).toBe("0.00")
      useFakeGateway()
    })
  })

  describe("website statistics", () => {
    let server: Server
    let replies: number[] = []
    let calls = 0

    beforeAll(async () => {
      server = createServer((_req, res) => {
        calls += 1
        res.statusCode = replies.shift() ?? 200
        res.end()
      })
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
      const address = server.address() as { port: number }
      process.env.WEB_REVALIDATE_URL = `http://127.0.0.1:${address.port}/api/revalidate`
    })

    afterAll(async () => {
      delete process.env.WEB_REVALIDATE_URL
      await new Promise((resolve) => server.close(resolve))
    })

    const collected = async (wardId: string) => {
      const ward = await prisma.ward.findUniqueOrThrow({ where: { id: wardId } })
      const data = await stats.stats(Y1.id)
      return data.wards.find((row) => row.wardNumber === ward.number)!
    }

    it("25–28: online and offline payments reach the public figures at once, per tax", async () => {
      const ram = await newConsumer()
      const before = await collected(ram.wardId)
      await collect(ram.id, "1000.00", { taxKind: "PROPERTY_TAX" })
      const afterOffline = await collected(ram.wardId)
      expect(Number(afterOffline.propertyTaxCollected) - Number(before.propertyTaxCollected)).toBe(1000)
      expect(afterOffline.waterTaxCollected).toBe(before.waterTaxCollected)

      const online = await startOnline(ram.id, ram.wardId, "WATER_TAX")
      await gatewaySays(online.merchTxnId!)
      const afterOnline = await collected(ram.wardId)
      expect(Number(afterOnline.waterTaxCollected) - Number(before.waterTaxCollected)).toBe(1800)
      expect(Number(afterOnline.collected) - Number(before.collected)).toBe(2800)
    })

    it("29, 30: a failed website refresh retries and never counts money twice", async () => {
      const ram = await newConsumer()
      await sync.processDue(500)
      replies = [500]
      await collect(ram.id, "100.00", { taxKind: "WATER_TAX" })
      const figuresBefore = await collected(ram.wardId)
      const first = await sync.processDue()
      expect(first.failed).toBe(1)
      const failed = await prisma.publicSyncEvent.findFirstOrThrow({ where: { status: "FAILED" }, orderBy: { createdAt: "desc" } })
      expect(failed.lastError).toContain("500")
      expect(failed.nextAttemptAt.getTime()).toBeGreaterThan(Date.now())
      expect((await sync.processDue()).sent).toBe(0) // waits for its retry time
      const retried = await sync.retryFailed()
      expect(retried.sent).toBeGreaterThan(0)
      expect((await prisma.publicSyncEvent.findUniqueOrThrow({ where: { id: failed.id } })).status).toBe("SENT")
      expect(await collected(ram.wardId)).toEqual(figuresBefore)
      expect(calls).toBeGreaterThanOrEqual(2)
    })

    it("31: the public response holds no private data", async () => {
      const ram = await newConsumer()
      await collect(ram.id, "100.00", { taxKind: "WATER_TAX", remarks: "private-remark" })
      const text = JSON.stringify(await stats.stats(Y1.id))
      expect(text).not.toContain(ram.surveyId)
      if (ram.ownerName) expect(text).not.toContain(ram.ownerName)
      if (ram.mobile) expect(text).not.toContain(ram.mobile)
      expect(text).not.toContain("private-remark")
      expect(text).not.toContain("receipt")
      expect(text).not.toContain("collectionsInternal")
    })

    it("the reconciliation compares the website figure with the ledger", async () => {
      const result = await sync.reconcile(Y1.id, clerk.id)
      expect(result.matches).toBe(true)
      expect(Number(result.ledgerCollected)).toBeGreaterThan(0)
    })
  })

  describe("production reset", () => {
    it("32: anyone but a Super Admin is refused, even with the permission", async () => {
      const admin = { ...clerk, roles: ["DEPARTMENT_ADMIN"], permissions: ["system:production-reset"] }
      await expect(reset.preview(admin)).rejects.toMatchObject({ status: 403 })
    })

    it("33–40: preview, backup, confirmation, execution, verification", async () => {
      const testConsumer = await newConsumer()
      const genuine = await newConsumer()
      const taught = await newConsumer()
      const marked = await collect(testConsumer.id, "2400.00", { taxKind: "PROPERTY_TAX", remarks: "TEST entry" })
      const real = await collect(genuine.id, "1800.00", { taxKind: "WATER_TAX" })
      const reviewed = await collect(taught.id, "500.00", { taxKind: "WATER_TAX" })
      const online = await startOnline(genuine.id, genuine.wardId, "PROPERTY_TAX")
      await gatewaySays(online.merchTxnId!)

      // 33: classification never guesses.
      const preview = await reset.preview(superAdmin)
      expect(preview.autoIncluded.map((row) => row.id)).toContain(marked.paymentId)
      expect(preview.autoIncluded.map((row) => row.id)).not.toContain(real.paymentId)
      const review = preview.needsReview.find((row) => row.id === online.id)!
      expect(review.gatewayConfirmed).toBe(true)
      expect(preview.preserved.demands).toBeGreaterThan(0)

      const preparedRun = await reset.prepare(superAdmin, [reviewed.paymentId])
      const execute = (over: { confirmationPhrase?: string; reason?: string } = {}) =>
        reset.execute(
          preparedRun.id,
          { confirmationPhrase: RESET_CONFIRMATION_PHRASE, reason: "Clearing IT entries before go-live", ...over },
          superAdmin
        )

      // 35: switched off, no backup, wrong phrase, no reason: all refused.
      delete process.env.PRODUCTION_RESET_ENABLED
      await expect(execute()).rejects.toMatchObject({ status: 409 })
      process.env.PRODUCTION_RESET_ENABLED = "true"
      await expect(execute()).rejects.toMatchObject({ status: 409 }) // no backup

      // 34: the backup is written, read back and checked.
      const backedUp = await reset.createBackup(preparedRun.id, superAdmin)
      expect(backedUp.status).toBe("BACKUP_VERIFIED")
      expect(backedUp.backupSha256).toMatch(/^[0-9a-f]{64}$/)
      const { buffer } = await reset.downloadBackup(preparedRun.id, superAdmin)
      const document = JSON.parse(buffer.toString("utf8"))
      expect(document.payments.map((row: { id: string }) => row.id).sort()).toEqual(
        expect.arrayContaining([marked.paymentId, reviewed.paymentId])
      )

      await expect(execute({ confirmationPhrase: "yes" })).rejects.toMatchObject({ status: 409 })
      await expect(execute({ reason: "short" })).rejects.toMatchObject({ status: 409 })

      // A payment changing after review stops everything.
      await prisma.payment.update({ where: { id: marked.paymentId }, data: { remarks: "TEST entry edited" } })
      await expect(execute()).rejects.toMatchObject({
        response: expect.objectContaining({ code: "RESET_SCOPE_CHANGED" }),
      })
      expect(await prisma.payment.count({ where: { id: marked.paymentId } })).toBe(1)
      const second = await reset.prepare(superAdmin, [reviewed.paymentId])
      await reset.createBackup(second.id, superAdmin)

      const before = {
        surveys: await prisma.survey.count(),
        demands: await prisma.assessmentDemand.count(),
        rebates: await prisma.rebatePolicy.count(),
      }
      const genuineBefore = await position(genuine.id)
      const done = await reset.execute(
        second.id,
        { confirmationPhrase: RESET_CONFIRMATION_PHRASE, reason: "Clearing IT entries before go-live" },
        superAdmin
      )

      // 36: approved test transactions cleared and their balances restored.
      expect(done.status).toBe("EXECUTED")
      expect(await prisma.payment.count({ where: { id: { in: [marked.paymentId, reviewed.paymentId] } } })).toBe(0)
      expect((await position(testConsumer.id)).total).toBe("4200.00")
      expect((await position(taught.id)).total).toBe("4200.00")

      // 37, 38: masters, liabilities and genuine payments preserved.
      expect(await prisma.survey.count()).toBe(before.surveys)
      expect(await prisma.assessmentDemand.count()).toBe(before.demands)
      expect(await prisma.rebatePolicy.count()).toBe(before.rebates)
      expect(await prisma.payment.count({ where: { id: real.paymentId } })).toBe(1)
      expect(await prisma.payment.count({ where: { id: online.id } })).toBe(1)
      expect(await position(genuine.id)).toEqual(genuineBefore)

      // 39: audit retained and the run itself kept.
      const audit = await prisma.auditLog.findFirstOrThrow({
        where: { action: "PRODUCTION_RESET_EXECUTED", entityId: second.id },
      })
      expect((audit.oldValue as { paymentIds: string[] }).paymentIds).toContain(marked.paymentId)
      expect(await prisma.auditLog.count({ where: { action: "OFFLINE_COLLECTION", entityId: marked.paymentId } })).toBe(1)

      // 40: report checks all pass and the public figures match the ledger.
      const report = done.report as { checks: Record<string, boolean> }
      expect(Object.values(report.checks).every(Boolean)).toBe(true)
      expect((await sync.reconcile(Y1.id, clerk.id)).matches).toBe(true)

      // It cannot run twice.
      await expect(
        reset.execute(second.id, { confirmationPhrase: RESET_CONFIRMATION_PHRASE, reason: "Clearing IT entries again" }, superAdmin)
      ).rejects.toMatchObject({ status: 409 })
      delete process.env.PRODUCTION_RESET_ENABLED
    }, 60_000)

    it("a second approver must be a different Super Admin", async () => {
      const ram = await newConsumer()
      const marked = await collect(ram.id, "100.00", { taxKind: "WATER_TAX", remarks: "test second approver" })
      const prepared = await reset.prepare(superAdmin, [])
      expect((prepared.counts as { offlineTransactions: number }).offlineTransactions).toBeGreaterThan(0)
      await reset.createBackup(prepared.id, superAdmin)
      process.env.PRODUCTION_RESET_ENABLED = "true"
      process.env.PRODUCTION_RESET_REQUIRE_SECOND_APPROVAL = "true"
      const args = { confirmationPhrase: RESET_CONFIRMATION_PHRASE, reason: "Second approver check run" }
      await expect(reset.execute(prepared.id, args, superAdmin)).rejects.toMatchObject({
        response: expect.objectContaining({ code: "RESET_APPROVAL_REQUIRED" }),
      })
      await reset.requestApproval(prepared.id, args.reason, superAdmin)
      await expect(reset.approve(prepared.id, superAdmin)).rejects.toMatchObject({
        response: expect.objectContaining({ code: "RESET_SELF_APPROVAL" }),
      })
      await reset.cancel(prepared.id, superAdmin)
      expect(await prisma.payment.count({ where: { id: marked.paymentId } })).toBe(1)
      delete process.env.PRODUCTION_RESET_ENABLED
      delete process.env.PRODUCTION_RESET_REQUIRE_SECOND_APPROVAL
    })
  })
})
