/// <reference lib="dom" />
/**
 * Offline collection against a real PostgreSQL database (brief tests A–K).
 * Runs only when COLLECTIONS_IT_DATABASE_URL points at a disposable copy:
 *
 *   COLLECTIONS_IT_DATABASE_URL=postgresql://…/npdh_it pnpm exec jest \
 *     --config ./test/jest-e2e.json test/offline-collection.e2e-spec.ts
 *
 * It creates two far-future assessment years and uses properties that have
 * no demands yet, so the copy's existing figures are not touched.
 */
import { ForbiddenException, type ExecutionContext } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { chromium } from "playwright"

import { AuditService } from "../src/audit/audit.service"
import type { AuthUser } from "../src/auth/auth.decorators"
import { PermissionGuard } from "../src/auth/permission.guard"
import { CollectionsController } from "../src/collections/collections.controller"
import { CollectionsService } from "../src/collections/collections.service"
import { DemandsController } from "../src/demands/demands.controller"
import { DemandsService } from "../src/demands/demands.service"
import { PrismaService } from "../src/prisma/prisma.service"
import { renderDemandNoticePdfFromHtml } from "../src/reports/demand-notice/demand-notice-pdf"
import { outstandingToNoticeLedger } from "../src/reports/demand-notice/demand-notice-view-model"
import { TaxConfigsService } from "../src/tax-configs/tax-configs.service"

const url = process.env.COLLECTIONS_IT_DATABASE_URL
const suite = url ? describe : describe.skip

suite("offline collection on a real database", () => {
  let prisma: PrismaService
  let collections: CollectionsService
  let demands: DemandsService
  let clerk: AuthUser
  let ram: { id: string; surveyId: string }
  let other: { id: string }
  const Y1 = { id: "", code: "AY_2191_2192", name: "2191-2192" }
  const Y2 = { id: "", code: "AY_2192_2193", name: "2192-2193" }
  const run = Date.now().toString(36)

  async function year(y: typeof Y1, startsOn: string, endsOn: string) {
    const category = await prisma.referenceCategory.findFirstOrThrow({
      where: { code: "ASSESSMENT_YEAR" },
    })
    const entry =
      (await prisma.referenceEntry.findFirst({ where: { categoryId: category.id, code: y.code } })) ??
      (await prisma.referenceEntry.create({
        data: { categoryId: category.id, code: y.code, name: y.name, status: "ACTIVE", sortOrder: 9000 },
      }))
    await prisma.assessmentYearProfile.upsert({
      where: { referenceEntryId: entry.id },
      create: { referenceEntryId: entry.id, startsOn: new Date(startsOn), endsOn: new Date(endsOn), status: "ACTIVE" },
      update: { status: "ACTIVE" },
    })
    y.id = entry.id
  }

  async function publish(surveyId: string, y: typeof Y1, property: string, water: string, opening = "0") {
    const survey = await prisma.survey.findUniqueOrThrow({ where: { id: surveyId } })
    const total = (Number(property) + Number(water)).toFixed(2)
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
        currentYearDemand: total,
        openingArrears: opening,
        verificationStatus: "VERIFIED",
        publishedAt: new Date(),
        publishedById: clerk.id,
      },
    })
  }

  const collect = (amount: string, key: string, y = Y1, surveyId = ram.id) =>
    collections.collect(
      { surveyId, assessmentYearId: y.id, amount, paymentMode: "CASH", counterCode: "IT-1" },
      clerk,
      key
    )

  beforeAll(async () => {
    process.env.DATABASE_URL = url
    prisma = new PrismaService()
    await prisma.$connect()
    const audit = new AuditService(prisma)
    demands = new DemandsService(prisma, audit, new TaxConfigsService(prisma, audit))
    collections = new CollectionsService(prisma, demands, audit)
    const admin = await prisma.user.findFirstOrThrow({ orderBy: { createdAt: "asc" } })
    clerk = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      status: "ACTIVE",
      roles: ["CLERK"],
      permissions: ["demand:read", "payment:collect"],
    }
    await year(Y1, "2191-04-01", "2192-03-31")
    await year(Y2, "2192-04-01", "2193-03-31")
    const free = await prisma.survey.findMany({
      where: { deletedAt: null, status: "ACTIVE", demands: { none: {} }, payments: { none: {} } },
      take: 2,
      orderBy: { surveyId: "desc" },
    })
    if (free.length < 2) throw new Error("Need two properties without demands in the copy")
    ram = { id: free[0]!.id, surveyId: free[0]!.surveyId }
    other = { id: free[1]!.id }
    // The municipality verifies that Ram owed nothing for earlier configured years.
    const earlier = await prisma.referenceEntry.findMany({
      where: {
        category: { code: "ASSESSMENT_YEAR" },
        code: { lt: Y1.code },
        yearProfile: { isNot: null },
      },
    })
    for (const entry of earlier) {
      const survey = await prisma.survey.findUniqueOrThrow({ where: { id: ram.id } })
      await prisma.assessmentDemand.create({
        data: {
          surveyId: ram.id,
          wardId: survey.wardId,
          assessmentYearId: entry.id,
          demandReference: `IT-${run}-${entry.code}-${ram.id}`,
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
    await publish(ram.id, Y1, "3000.00", "2000.00")
  }, 60_000)

  afterAll(async () => {
    await prisma?.$disconnect()
  })

  let firstPaymentId = ""

  it("A: ₹3,000 of ₹5,000 is posted once with a receipt, ₹2,000 stays outstanding", async () => {
    const preview = await collections.previewCollection({
      surveyId: ram.id,
      assessmentYearId: Y1.id,
      amount: "3000.00",
    })
    expect(preview.outstandingAfter).toBe("2000.00")
    expect(preview.paymentStatus).toBe("PARTIALLY_PAID")
    expect(await prisma.payment.count({ where: { surveyId: ram.id } })).toBe(0) // preview saved nothing

    const result = await collect("3000.00", `it-${run}-a`)
    firstPaymentId = result.paymentId
    expect(result.status).toBe("SUCCESS")
    expect(result.amount).toBe("3000.00")
    expect(result.remaining).toBe("2000.00")
    expect(result.receiptNumber).toMatch(/^RCP-AY21912192-\d{6}$/)
    expect(result.allocations?.[0]?.parts).toMatchObject({ waterTax: "2000.00", propertyTax: "1000.00" })

    const quote = await collections.quote(ram.id, Y1.id, clerk)
    expect(quote.netOutstanding).toBe("2000.00")
    const ledger = await collections.ledger({ surveyId: ram.id, assessmentYearId: Y1.id }, clerk)
    expect(ledger.closingBalance).toBe("2000.00")
    expect(ledger.reconciles).toBe(true)
    expect(ledger.header?.closingOutstanding).toBe("2000.00")
    const listed = await collections.list({ assessmentYearId: Y1.id, search: ram.surveyId }, clerk)
    expect(listed.items[0]).toMatchObject({ collected: "3000.00", outstanding: "2000.00", status: "PARTIAL" })
  })

  it("Search by ward and house number; the payment time is recorded and never in the future", async () => {
    const survey = await prisma.survey.findUniqueOrThrow({ where: { id: ram.id } })
    expect(await collections.search("x", clerk)).toEqual([]) // one character needs a ward
    const inWard = await collections.search(survey.houseNo ?? "", clerk, survey.wardId)
    expect(inWard.length).toBeGreaterThan(0)
    expect(inWard.every((hit) => hit.wardNumber === inWard[0]!.wardNumber)).toBe(true)
    const byId = await collections.search(ram.surveyId, clerk, survey.wardId)
    expect(byId.map((hit) => hit.surveyId)).toContain(ram.id)
    expect(await collections.search(ram.surveyId, clerk, "no-such-ward")).toEqual([])

    const later = new Date(Date.now() + 2 * 3600_000)
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(later)
    const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(later)
    await expect(
      collections.collect(
        { surveyId: ram.id, assessmentYearId: Y1.id, amount: "1.00", paymentMode: "CASH", paymentDate: day, paymentTime: time },
        clerk,
        `it-${run}-future`
      )
    ).rejects.toMatchObject({ status: 400 })
    expect(await prisma.payment.count({ where: { idempotencyKey: `it-${run}-future` } })).toBe(0)
    const posted = await prisma.payment.findUniqueOrThrow({ where: { id: firstPaymentId } })
    expect(Math.abs(posted.collectionDate!.getTime() - Date.now())).toBeLessThan(10 * 60_000) // today, no time typed: now
  })

  it("E: the same request twice, or two at once, posts one payment and one receipt", async () => {
    const again = await collect("3000.00", `it-${run}-a`)
    expect(again.created).toBe(false)
    expect(again.paymentId).toBe(firstPaymentId)

    const key = `it-${run}-e`
    const [one, two] = await Promise.all([collect("500.00", key), collect("500.00", key)])
    expect(one.paymentId).toBe(two.paymentId)
    expect(await prisma.payment.count({ where: { idempotencyKey: key } })).toBe(1)
    expect(await prisma.paymentAllocation.count({ where: { paymentId: one.paymentId } })).toBe(1)
    await expect(collect("700.00", key)).rejects.toMatchObject({ status: 409 })

    // Correct the mistake by reversal: the receipt is kept and stamped, the balance restored.
    await demands.reversePayment(one.paymentId, { reason: "IT duplicate correction" }, clerk.id)
    const html = await collections.receiptHtml(one.paymentId, "consumer", clerk)
    expect(html).toContain("REVERSED")
    expect((await collections.quote(ram.id, Y1.id, clerk)).netOutstanding).toBe("2000.00")
    const ledger = await collections.ledger({ surveyId: ram.id, status: "REVERSED" }, clerk)
    expect(ledger.entries.map((entry) => entry.receiptNumber)).toContain(one.receiptNumber)
  })

  it("F: consumer and office copies print the same receipt number from the stored snapshot", async () => {
    const consumer = await collections.receiptHtml(firstPaymentId, "consumer", clerk)
    const office = await collections.receiptHtml(firstPaymentId, "office", clerk)
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: firstPaymentId } })
    for (const html of [consumer, office]) {
      expect(html).toContain(`data-receipt="${payment.receiptNumber}"`)
      expect(html).toContain("₹ 3,000.00")
      expect(html).toContain("₹ 2,000.00")
    }
    expect(office).toContain(firstPaymentId)
    expect(consumer).not.toContain(firstPaymentId)
    const printed = await prisma.auditLog.count({
      where: { action: "RECEIPT_PRINTED", entityId: firstPaymentId },
    })
    expect(printed).toBeGreaterThanOrEqual(2)
    expect(await prisma.payment.count({ where: { surveyId: ram.id, status: "SUCCESS" } })).toBe(1)
  })

  it("B: next year opens with ₹2,000 arrears and ₹4,000 current demand (₹6,000)", async () => {
    await publish(ram.id, Y2, "2500.00", "1500.00", "2000.00")
    const breakdown = await demands.outstanding(ram.id, Y2.id)
    expect(breakdown.openingArrears).toBe("2000.00")
    expect(breakdown.currentYearDemand).toBe("4000.00")
    expect(breakdown.totalPayable).toBe("6000.00")
    expect(breakdown.authoritative).toBe(true)
    const { ledger } = outstandingToNoticeLedger(breakdown)
    expect(ledger.previousArrears).toBe(2000)
    expect(ledger.currentYearDemand).toBe(4000)
    // Earlier years only (verified nil years included); never the current year.
    expect(ledger.years.map((row) => row.assessmentYear)).toContain(Y1.name)
    expect(ledger.years.map((row) => row.assessmentYear)).not.toContain(Y2.name)
    expect(ledger.years.find((row) => row.assessmentYear === Y1.name)?.outstanding).toBe(2000)
  })

  it("C: ₹1,000 paid later reduces 2191-92 property tax, not the new year", async () => {
    const result = await collect("1000.00", `it-${run}-c`, Y2)
    expect(result.allocations).toHaveLength(1)
    expect(result.allocations?.[0]).toMatchObject({
      assessmentYearCode: Y1.code,
      outstandingAfter: "1000.00",
      parts: { propertyTax: "1000.00", waterTax: "0.00" },
    })
    const y1 = await demands.outstanding(ram.id, Y1.id)
    expect(y1.netOutstanding).toBe("1000.00")
    const y2 = await demands.outstanding(ram.id, Y2.id)
    expect(y2.openingArrears).toBe("1000.00")
    expect(y2.currentYearDemand).toBe("4000.00")
    expect(y2.netOutstanding).toBe("5000.00")
  })

  it("D and J: full payment leaves ₹0 and every view agrees", async () => {
    await expect(collect("5000.01", `it-${run}-over`, Y2)).rejects.toMatchObject({ status: 400 })
    const result = await collect("5000.00", `it-${run}-d`, Y2)
    expect(result.remaining).toBe("0.00")
    const quote = await collections.quote(ram.id, Y2.id, clerk)
    const ledger = await collections.ledger({ surveyId: ram.id }, clerk)
    const listed = await collections.list({ assessmentYearId: Y2.id, search: ram.surveyId }, clerk)
    expect(quote.netOutstanding).toBe("0.00")
    expect(ledger.closingBalance).toBe("0.00")
    expect(ledger.reconciles).toBe(true)
    expect(listed.items[0]).toMatchObject({ outstanding: "0.00", status: "PAID" })
    const payments = await prisma.payment.aggregate({
      where: { surveyId: ram.id, status: "SUCCESS" },
      _sum: { amount: true },
    })
    expect(payments._sum.amount?.toFixed(2)).toBe("9000.00") // 3,000 + 1,000 + 5,000
  })

  it("G: year-end preview reconciles, closes once, and explains changed arrears", async () => {
    const preview = await collections.yearEndPreview(Y1.id)
    expect(preview.report.chainOk).toBe(true)
    expect(preview.report.nextYear?.storedOpeningArrears).toBe("2000.00")
    expect(preview.report.nextYear?.mismatchedProperties).toBeGreaterThanOrEqual(1)
    await expect(
      collections.yearEndClose({ assessmentYearId: Y1.id, reason: "x" }, clerk)
    ).rejects.toMatchObject({ status: 400 })
    const closed = await collections.yearEndClose(
      { assessmentYearId: Y1.id, reason: "IT year-end approval", acknowledgeIssues: true },
      clerk
    )
    expect(closed.status).toBe("CLOSED")
    await expect(
      collections.yearEndClose({ assessmentYearId: Y1.id, reason: "IT again", acknowledgeIssues: true }, clerk)
    ).rejects.toMatchObject({ status: 409 })
    expect(
      await prisma.auditLog.count({ where: { action: "YEAR_END_CLOSED", entityId: Y1.id } })
    ).toBe(1)
    // Closing changed no balances.
    expect((await demands.outstanding(ram.id, Y2.id)).netOutstanding).toBe("0.00")
  })

  it("H: a property without a verified earlier year cannot be collected against", async () => {
    await publish(other.id, Y2, "800.00", "200.00")
    const breakdown = await demands.outstanding(other.id, Y2.id)
    expect(breakdown.authoritative).toBe(false)
    expect(breakdown.missingHistoryYears.map((row) => row.code)).toContain(Y1.code)
    await expect(collect("100.00", `it-${run}-h`, Y2, other.id)).rejects.toMatchObject({
      status: 409,
    })
  })

  it("I: the receipt PDF renders and no copy or cell overflows", async () => {
    const html = await collections.receiptHtml(firstPaymentId, "both", clerk)
    const pdf = await renderDemandNoticePdfFromHtml(html)
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF")
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 794, height: 1123 } })
      await page.setContent(html)
      const layout = await page.evaluate(() => {
        const mm = 96 / 25.4
        const sheet = document.querySelector(".sheet") as HTMLElement
        const cells = [...document.querySelectorAll("td, th")] as HTMLElement[]
        return {
          sheetMm: sheet.getBoundingClientRect().height / mm,
          clipped: cells.filter((cell) => cell.scrollWidth > cell.clientWidth + 1).length,
          emblem: (document.querySelector(".emblem") as HTMLImageElement).naturalWidth > 0,
          text: document.body.innerText,
        }
      })
      expect(layout.clipped).toBe(0)
      expect(layout.emblem).toBe(true)
      expect(layout.sheetMm).toBeLessThanOrEqual(283) // two copies on one A4 page (297 − 2×7 mm)
      for (const text of ["नगर पालिका परिषद", "Property Tax Receipt", "Authorised signatory", "प्राप्त राशि"]) {
        expect(layout.text).toContain(text)
      }
    } finally {
      await browser.close()
    }
  }, 60_000)

  it("K: a clerk cannot reverse a receipt, adjust a balance or close a year", () => {
    const guard = new PermissionGuard(new Reflector())
    const context = (handler: (...args: never[]) => unknown, user: AuthUser) =>
      ({
        getHandler: () => handler,
        getClass: () => Object,
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
      }) as unknown as ExecutionContext
    expect(() => guard.canActivate(context(DemandsController.prototype.reverse, clerk))).toThrow(ForbiddenException)
    expect(() => guard.canActivate(context(DemandsController.prototype.adjust, clerk))).toThrow(ForbiddenException)
    expect(() => guard.canActivate(context(CollectionsController.prototype.closeYear, clerk))).toThrow(ForbiddenException)
    expect(guard.canActivate(context(CollectionsController.prototype.collect, clerk))).toBe(true)
    const viewer = { ...clerk, permissions: ["demand:read"] }
    expect(() => guard.canActivate(context(CollectionsController.prototype.collect, viewer))).toThrow(ForbiddenException)
  })
})
