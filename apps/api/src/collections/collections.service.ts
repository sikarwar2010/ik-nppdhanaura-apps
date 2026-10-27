import { randomUUID } from "node:crypto"

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { PaymentMode, PaymentStatus, Prisma } from "@prisma/client"
import ExcelJS from "exceljs"

import type { AuthUser } from "../auth/auth.decorators"
import { AuditService } from "../audit/audit.service"
import { DemandsService } from "../demands/demands.service"
import {
  isPositiveMoney,
  money,
  moneyString,
  sumMoney,
} from "../demands/money"
import { renderDemandNoticePdfFromHtml } from "../reports/demand-notice/demand-notice-pdf"
import { PrismaService } from "../prisma/prisma.service"
import {
  allocateWithComponents,
  allocationSummary,
  CollectionRuleError,
  collectionInstant,
  formatReceiptNumber,
  idempotencyDecision,
  replayedReceipt,
  settlesImmediately,
  type AllocationLine,
} from "./collection-rules"
import type {
  CollectTaxDto,
  CollectionListQueryDto,
  CollectionPreviewDto,
  LedgerQueryDto,
  ReceiptListQueryDto,
  YearEndCloseDto,
} from "./collections.dto"
import {
  buildConsumerLedger,
  filterLedgerEntries,
  type LedgerDemandInput,
} from "./consumer-ledger"
import {
  renderReceiptHtml,
  type ReceiptAllocation,
  type ReceiptCopy,
  type ReceiptSnapshot,
} from "./receipt-html"
import { buildYearEndReport, type YearEndLine } from "./year-end"
import type { ComponentAmounts } from "../demands/outstanding"
import { maskMobile } from "../public-property-tax/masking.util"
import { rupeesInWords } from "./rupees-in-words"

const MUNICIPALITY = "Nagar Palika Parishad Dhanaura"

type LedgerRow = {
  survey_pk: string
  survey_id: string
  owner_name: string | null
  ward_name: string
  property_tax: Prisma.Decimal | string | number
  water_tax: Prisma.Decimal | string | number
  drainage_tax: Prisma.Decimal | string | number
  penalty: Prisma.Decimal | string | number
  interest: Prisma.Decimal | string | number
  current_year_demand: Prisma.Decimal | string | number
  previous_arrears: Prisma.Decimal | string | number
  rebate: Prisma.Decimal | string | number
  payable: Prisma.Decimal | string | number
  collected: Prisma.Decimal | string | number
  outstanding: Prisma.Decimal | string | number
  demand_reference: string | null
  total_count?: number
}

function kolkataDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date)
}

function dayStart(day: string): Date {
  return new Date(`${day}T00:00:00+05:30`)
}

function addressOf(survey: {
  houseNo: string | null
  streetName: string | null
  locality: string | null
  colony: string | null
  city: string | null
  pincode: string | null
}): string {
  const parts = [
    survey.houseNo,
    survey.streetName,
    survey.locality,
    survey.colony,
    survey.city,
    survey.pincode,
  ].filter((part) => part && part.trim())
  return parts.join(", ") || "—"
}

function canReadMobile(user: AuthUser): boolean {
  return user.roles.includes("SUPER_ADMIN") || user.permissions.includes("survey:pii:read")
}

function asSnapshot(value: Prisma.JsonValue | null): ReceiptSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  if (typeof row.receiptNumber !== "string") return null
  return row as unknown as ReceiptSnapshot
}

function istDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function toReceiptAllocation(line: AllocationLine): ReceiptAllocation {
  return {
    assessmentYearCode: line.assessmentYearCode,
    assessmentYearName: line.assessmentYearName,
    closingBalanceOnly: line.closingBalanceOnly,
    amount: line.amount,
    outstandingAfter: line.outstandingAfter,
    parts: {
      propertyTax: line.parts.propertyTax,
      waterTax: line.parts.waterTax,
      drainageTax: line.parts.drainageTax,
      penalty: line.parts.penalty,
      interest: line.parts.interest,
    },
  }
}

/** The tax-wise split stored on a receipt for one year, if that receipt has one. */
function postedPartsFor(
  value: Prisma.JsonValue | null,
  yearCode: string
): ComponentAmounts | null {
  const snapshot = asSnapshot(value)
  const line = snapshot?.allocations?.find((row) => row.assessmentYearCode === yearCode)
  if (!line) return null
  return {
    interest: line.parts.interest,
    penalty: line.parts.penalty,
    drainageTax: line.parts.drainageTax,
    waterTax: line.parts.waterTax,
    propertyTax: line.parts.propertyTax,
  }
}

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly demands: DemandsService,
    private readonly audit: AuditService
  ) {}

  async summary(query: CollectionListQueryDto) {
    const year = await this.yearOrThrow(query.assessmentYearId)
    const [totals] = await this.prisma.$queryRaw<
      Array<{
        current_year_demand: Prisma.Decimal | null
        previous_arrears: Prisma.Decimal | null
        payable: Prisma.Decimal | null
        collected: Prisma.Decimal | null
        outstanding: Prisma.Decimal | null
        with_dues: number
        fully_paid: number
        partial: number
      }>
    >`
      WITH line AS (${this.ledgerLines()}),
      per_survey AS (
        SELECT
          survey_id,
          SUM(CASE WHEN year_code = ${year.code} THEN current_year ELSE 0 END) AS current_year_demand,
          SUM(CASE WHEN year_code < ${year.code} THEN own_outstanding ELSE 0 END) AS previous_arrears,
          SUM(CASE WHEN year_code = ${year.code} THEN current_year + interest + debits - rebate - credits ELSE 0 END) AS current_before_payments,
          SUM(CASE WHEN year_code = ${year.code} THEN paid + historical ELSE 0 END) AS collected,
          SUM(CASE WHEN year_code <= ${year.code} THEN own_outstanding ELSE 0 END) AS outstanding,
          MAX(CASE WHEN year_code = ${year.code} THEN 1 ELSE 0 END) AS has_year
        FROM line
        WHERE year_code <= ${year.code}
          AND (${query.wardId ?? null}::text IS NULL OR ward_id = ${query.wardId ?? null})
        GROUP BY survey_id
      )
      SELECT
        COALESCE(SUM(current_year_demand), 0) AS current_year_demand,
        COALESCE(SUM(previous_arrears), 0) AS previous_arrears,
        COALESCE(SUM(previous_arrears + current_before_payments), 0) AS payable,
        COALESCE(SUM(collected), 0) AS collected,
        COALESCE(SUM(outstanding), 0) AS outstanding,
        COUNT(*) FILTER (WHERE outstanding > 0)::int AS with_dues,
        COUNT(*) FILTER (WHERE has_year = 1 AND outstanding <= 0)::int AS fully_paid,
        COUNT(*) FILTER (WHERE outstanding > 0 AND collected > 0)::int AS partial
      FROM per_survey
    `
    const today = kolkataDay()
    const from = query.dateFrom ? dayStart(query.dateFrom) : dayStart(today)
    const to = query.dateTo
      ? new Date(dayStart(query.dateTo).getTime() + 24 * 60 * 60 * 1000)
      : new Date(dayStart(today).getTime() + 24 * 60 * 60 * 1000)
    const todayOnlyFrom = dayStart(today)
    const todayOnlyTo = new Date(todayOnlyFrom.getTime() + 24 * 60 * 60 * 1000)
    const offlineWhere = {
      status: PaymentStatus.SUCCESS,
      paymentMode: { not: PaymentMode.ONLINE },
      ...(query.wardId ? { wardId: query.wardId } : {}),
    }
    const [todaySum, rangeSum] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          ...offlineWhere,
          collectionDate: { gte: todayOnlyFrom, lt: todayOnlyTo },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: {
          ...offlineWhere,
          collectionDate: { gte: from, lt: to },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ])
    return {
      municipality: MUNICIPALITY,
      assessmentYearId: year.id,
      assessmentYear: year.name,
      currentYearDemand: moneyString(totals?.current_year_demand ?? 0),
      previousArrears: moneyString(totals?.previous_arrears ?? 0),
      totalPayable: moneyString(totals?.payable ?? 0),
      totalCollected: moneyString(totals?.collected ?? 0),
      totalOutstanding: moneyString(totals?.outstanding ?? 0),
      propertiesWithDues: Number(totals?.with_dues ?? 0),
      fullyPaid: Number(totals?.fully_paid ?? 0),
      partialPayments: Number(totals?.partial ?? 0),
      todayOfflineAmount: moneyString(todaySum._sum.amount ?? 0),
      todayOfflineCount: todaySum._count,
      rangeOfflineAmount: moneyString(rangeSum._sum.amount ?? 0),
      rangeOfflineCount: rangeSum._count,
    }
  }

  async list(query: CollectionListQueryDto, user: AuthUser) {
    const year = await this.yearOrThrow(query.assessmentYearId)
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const pattern = query.search?.trim() ? `%${query.search.trim()}%` : null
    const receiptPattern = query.receiptNumber?.trim()
      ? `%${query.receiptNumber.trim()}%`
      : null
    const includeMobile = canReadMobile(user)
    const sort =
      query.sortBy === "ownerName"
        ? Prisma.sql`s."ownerName"`
        : query.sortBy === "surveyId"
          ? Prisma.sql`s."surveyId"`
          : Prisma.sql`ps.outstanding`
    const direction = query.sortOrder === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`
    const statusSql =
      query.status === "UNPAID"
        ? Prisma.sql`ps.outstanding > 0 AND ps.collected = 0`
        : query.status === "PARTIAL"
          ? Prisma.sql`ps.outstanding > 0 AND ps.collected > 0`
          : query.status === "PAID"
            ? Prisma.sql`ps.has_year = 1 AND ps.outstanding <= 0`
            : query.status === "PENDING"
              ? Prisma.sql`EXISTS (
                  SELECT 1 FROM payment pp
                  WHERE pp."surveyId" = s.id
                    AND pp.status::text = 'PENDING'
                    AND pp."paymentMode"::text <> 'ONLINE'
                )`
              : Prisma.sql`TRUE`
    const dateFrom = query.dateFrom ? dayStart(query.dateFrom) : null
    const dateTo = query.dateTo
      ? new Date(dayStart(query.dateTo).getTime() + 24 * 60 * 60 * 1000)
      : null
    const rows = await this.prisma.$queryRaw<LedgerRow[]>`
      WITH line AS (${this.ledgerLines()}),
      per_survey AS (
        SELECT
          survey_id,
          SUM(CASE WHEN year_code = ${year.code} THEN property_tax ELSE 0 END) AS property_tax,
          SUM(CASE WHEN year_code = ${year.code} THEN water_tax ELSE 0 END) AS water_tax,
          SUM(CASE WHEN year_code = ${year.code} THEN drainage_tax ELSE 0 END) AS drainage_tax,
          SUM(CASE WHEN year_code = ${year.code} THEN penalty ELSE 0 END) AS penalty,
          SUM(CASE WHEN year_code = ${year.code} THEN interest ELSE 0 END) AS interest,
          SUM(CASE WHEN year_code = ${year.code} THEN current_year ELSE 0 END) AS current_year_demand,
          SUM(CASE WHEN year_code < ${year.code} THEN own_outstanding ELSE 0 END) AS previous_arrears,
          SUM(CASE WHEN year_code = ${year.code} THEN rebate ELSE 0 END) AS rebate,
          SUM(CASE WHEN year_code = ${year.code} THEN current_year + interest + debits - rebate - credits ELSE 0 END) AS current_before_payments,
          SUM(CASE WHEN year_code = ${year.code} THEN paid + historical ELSE 0 END) AS collected,
          SUM(CASE WHEN year_code <= ${year.code} THEN own_outstanding ELSE 0 END) AS outstanding,
          MAX(CASE WHEN year_code = ${year.code} THEN demand_reference END) AS demand_reference,
          MAX(CASE WHEN year_code = ${year.code} THEN 1 ELSE 0 END) AS has_year
        FROM line
        WHERE year_code <= ${year.code}
          AND (${query.wardId ?? null}::text IS NULL OR ward_id = ${query.wardId ?? null})
        GROUP BY survey_id
      )
      SELECT
        s.id AS survey_pk,
        s."surveyId" AS survey_id,
        s."ownerName" AS owner_name,
        w.name AS ward_name,
        ps.property_tax,
        ps.water_tax,
        ps.drainage_tax,
        ps.penalty,
        ps.interest,
        ps.current_year_demand,
        ps.previous_arrears,
        ps.rebate,
        (ps.previous_arrears + ps.current_before_payments) AS payable,
        ps.collected,
        ps.outstanding,
        ps.demand_reference,
        (COUNT(*) OVER())::int AS total_count
      FROM per_survey ps
      JOIN survey s ON s.id = ps.survey_id
      JOIN ward w ON w.id = s."wardId"
      WHERE s."deletedAt" IS NULL
        AND ${statusSql}
        AND (
          ${pattern}::text IS NULL
          OR s."surveyId" ILIKE ${pattern}
          OR COALESCE(s."ownerName", '') ILIKE ${pattern}
          OR COALESCE(s."parcelNo", '') ILIKE ${pattern}
          OR COALESCE(s."houseNo", '') ILIKE ${pattern}
          OR COALESCE(s."propertyNo", '') ILIKE ${pattern}
          OR (${includeMobile} AND COALESCE(s.mobile, '') ILIKE ${pattern})
        )
        AND (
          ${receiptPattern}::text IS NULL
          OR EXISTS (
            SELECT 1 FROM payment rp
            WHERE rp."surveyId" = s.id AND rp."receiptNumber" ILIKE ${receiptPattern}
          )
        )
        AND (
          ${dateFrom}::timestamp IS NULL
          OR EXISTS (
            SELECT 1 FROM payment dp
            WHERE dp."surveyId" = s.id
              AND dp."paymentMode"::text <> 'ONLINE'
              AND dp.status::text = 'SUCCESS'
              AND dp."collectionDate" >= ${dateFrom}
              AND (${dateTo}::timestamp IS NULL OR dp."collectionDate" < ${dateTo})
          )
        )
      ORDER BY ${sort} ${direction}
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `
    const total = Number(rows[0]?.total_count ?? 0)
    return {
      items: rows.map((row) => ({
        surveyId: row.survey_pk,
        propertyId: row.survey_id,
        ownerName: row.owner_name,
        wardName: row.ward_name,
        propertyTax: moneyString(row.property_tax),
        waterTax: moneyString(row.water_tax),
        drainageTax: moneyString(row.drainage_tax),
        penalty: moneyString(row.penalty),
        interest: moneyString(row.interest),
        currentYearDemand: moneyString(row.current_year_demand),
        previousArrears: moneyString(row.previous_arrears),
        rebate: moneyString(row.rebate),
        payable: moneyString(row.payable),
        collected: moneyString(row.collected),
        outstanding: moneyString(row.outstanding),
        demandReference: row.demand_reference,
        status: money(row.outstanding).lte(0)
          ? "PAID"
          : money(row.collected).gt(0)
            ? "PARTIAL"
            : "UNPAID",
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    }
  }

  async exportDues(query: CollectionListQueryDto, user: AuthUser): Promise<Buffer> {
    const listed = await this.list({ ...query, page: 1, pageSize: 100 }, user)
    const pages = [listed.items]
    for (let page = 2; page <= Math.min(listed.meta.totalPages, 50); page += 1) {
      const next = await this.list({ ...query, page, pageSize: 100 }, user)
      pages.push(next.items)
    }
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Outstanding dues")
    sheet.addRow([
      "Property ID",
      "Owner",
      "Ward",
      "Current-year demand",
      "Previous arrears",
      "Rebate",
      "Penalty",
      "Payable",
      "Collected",
      "Outstanding",
      "Status",
      "Demand reference",
    ])
    for (const row of pages.flat()) {
      sheet.addRow([
        row.propertyId,
        row.ownerName,
        row.wardName,
        row.currentYearDemand,
        row.previousArrears,
        row.rebate,
        row.penalty,
        row.payable,
        row.collected,
        row.outstanding,
        row.status,
        row.demandReference,
      ])
    }
    const bytes = await workbook.xlsx.writeBuffer()
    return Buffer.from(bytes)
  }

  async search(term: string, user: AuthUser, wardId?: string) {
    const q = term.trim()
    // Inside a ward a single character is enough (house numbers like "7").
    if (wardId ? false : q.length < 2) return []
    const includeMobile = canReadMobile(user)
    const surveys = await this.prisma.survey.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        ...(wardId ? { wardId } : {}),
        OR: q ? [
          { surveyId: { contains: q, mode: "insensitive" } },
          { ownerName: { contains: q, mode: "insensitive" } },
          { parcelNo: { contains: q, mode: "insensitive" } },
          { houseNo: { contains: q, mode: "insensitive" } },
          { propertyNo: { contains: q, mode: "insensitive" } },
          ...(includeMobile ? [{ mobile: { contains: q } }] : []),
        ] : undefined,
      },
      include: { ward: { select: { name: true, number: true } } },
      take: 20,
      orderBy: { surveyId: "asc" },
    })
    return surveys.map((survey) => ({
      surveyId: survey.id,
      propertyId: survey.surveyId,
      ownerName: survey.ownerName,
      wardName: survey.ward.name,
      wardNumber: survey.ward.number,
      houseNo: survey.houseNo,
      address: addressOf(survey),
      mobile: includeMobile ? survey.mobile : null,
    }))
  }

  async quote(surveyKey: string, assessmentYearId: string, user: AuthUser) {
    const survey = await this.surveyOrThrow(surveyKey)
    const year = await this.yearOrThrow(assessmentYearId)
    const breakdown = await this.demands.outstanding(survey.id, assessmentYearId)
    const demand = breakdown.publishedDemandId
      ? await this.prisma.assessmentDemand.findUnique({
          where: { id: breakdown.publishedDemandId },
          select: { demandReference: true },
        })
      : null
    const payments = await this.prisma.payment.findMany({
      where: { surveyId: survey.id, paymentMode: { not: PaymentMode.ONLINE } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        collectedBy: { select: { name: true } },
        allocations: { where: { status: "ACTIVE" }, select: { amount: true, assessmentDemandId: true } },
      },
    })
    const includeMobile = canReadMobile(user)
    return {
      municipality: MUNICIPALITY,
      property: {
        surveyId: survey.id,
        propertyId: survey.surveyId,
        ownerName: survey.ownerName,
        fatherName: survey.ownerFatherName,
        wardName: survey.ward.name,
        wardNumber: survey.ward.number,
        houseNo: survey.houseNo,
        address: addressOf(survey),
        mobile: includeMobile ? survey.mobile : null,
      },
      assessmentYear: { id: year.id, code: year.code, name: year.name },
      openingArrears: breakdown.openingArrears,
      approvedCredits: breakdown.approvedCredits,
      approvedDebits: breakdown.approvedDebits,
      demandReference: demand?.demandReference ?? null,
      demandPublished: Boolean(breakdown.publishedDemandId && demand?.demandReference),
      propertyTax: breakdown.propertyTax,
      waterTax: breakdown.waterTax,
      drainageTax: breakdown.drainageTax,
      penalty: breakdown.penalty,
      interest: breakdown.interest,
      previousDues: breakdown.openingArrears,
      rebate: breakdown.rebateAmount,
      totalPayable: breakdown.totalPayable,
      netOutstanding: breakdown.netOutstanding,
      paymentsAllocated: breakdown.paymentsAllocated,
      authoritative: breakdown.authoritative,
      warning: breakdown.authoritative
        ? null
        : "Historical balances are incomplete. Missing years are not treated as zero.",
      years: breakdown.years,
      receipts: payments.map((payment) => ({
        id: payment.id,
        receiptNumber: payment.receiptNumber,
        amount: moneyString(payment.amount),
        status: payment.status,
        paymentMode: payment.paymentMode,
        collectionDate: payment.collectionDate,
        cashierName: payment.collectedBy?.name ?? null,
      })),
    }
  }

  async collect(dto: CollectTaxDto, user: AuthUser, idempotencyKey: string | undefined) {
    const key = idempotencyKey?.trim() || dto.idempotencyKey?.trim()
    if (!key) {
      throw new BadRequestException({
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Send an Idempotency-Key header so a retry cannot collect twice",
      })
    }
    if (dto.paymentMode !== "CASH" && !dto.reference?.trim()) {
      throw new BadRequestException({
        code: "REFERENCE_REQUIRED",
        message: "Cheque, draft, UPI, and bank transfer need a reference number",
      })
    }
    const collectedAt = this.collectedAtOrThrow(dto.paymentDate, dto.paymentTime)
    const survey = await this.surveyOrThrow(dto.surveyId)
    const year = await this.yearOrThrow(dto.assessmentYearId)
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: key },
    })
    const decision = idempotencyDecision(
      existing
        ? { amount: moneyString(existing.amount), surveyId: existing.surveyId }
        : null,
      { amount: dto.amount, surveyId: survey.id }
    )
    if (decision === "conflict") {
      throw new ConflictException({
        code: "IDEMPOTENCY_CONFLICT",
        message: "This idempotency key was already used for a different collection",
      })
    }
    if (decision === "replay" && existing) {
      return {
        ...this.paymentResult(existing),
        ...replayedReceipt(existing),
      }
    }
    const breakdown = await this.demands.outstanding(survey.id, year.id)
    if (!breakdown.authoritative || !breakdown.publishedDemandId) {
      throw new ConflictException({
        code: "DEMAND_NOT_READY",
        message:
          "Publish a verified demand before collection. Missing historical years are not treated as zero.",
      })
    }
    if (!isPositiveMoney(dto.amount) || money(dto.amount).gt(money(breakdown.netOutstanding))) {
      throw new BadRequestException({
        code: "OVERPAYMENT",
        message: "Amount must be greater than zero and not above the outstanding balance",
      })
    }
    const immediate = settlesImmediately(dto.paymentMode)
    try {
      const payment = await this.prisma.$transaction(async (tx) => {
        const created = await tx.payment.create({
          data: {
            paymentReference: `OFF-${randomUUID()}`,
            idempotencyKey: key,
            amount: dto.amount,
            paymentMode: dto.paymentMode,
            status: immediate ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
            surveyId: survey.id,
            wardId: survey.wardId,
            assessmentYearId: year.id,
            payerName: survey.ownerName,
            collectionDate: collectedAt,
            chequeDdReference: dto.reference?.trim() || null,
            remarks: dto.remarks?.trim() || null,
            collectedById: user.id,
            counterCode: dto.counterCode?.trim() || null,
            refundableAmount: immediate ? dto.amount : "0.00",
          },
        })
        if (!immediate) return created
        return this.settleInTransaction(tx, created.id, user, year.code)
      })
      await this.audit.log({
        action: immediate ? "OFFLINE_COLLECTION" : "OFFLINE_COLLECTION_PENDING",
        entity: "Payment",
        entityId: payment.id,
        actorId: user.id,
        newValue: {
          amount: moneyString(payment.amount),
          paymentMode: payment.paymentMode,
          status: payment.status,
          receiptNumber: payment.receiptNumber,
          surveyId: survey.id,
        },
      })
      return { ...this.paymentResult(payment), created: true }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const raced = await this.prisma.payment.findUnique({
          where: { idempotencyKey: key },
        })
        if (raced) return { ...this.paymentResult(raced), ...replayedReceipt(raced) }
      }
      if (error instanceof CollectionRuleError) {
        throw new BadRequestException({ code: error.code, message: error.message })
      }
      throw error
    }
  }

  async confirm(paymentId: string, user: AuthUser) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) {
      throw new NotFoundException({
        code: "PAYMENT_NOT_FOUND",
        message: "Payment was not found",
      })
    }
    if (payment.paymentMode === PaymentMode.ONLINE) {
      throw new BadRequestException({
        code: "ONLINE_PAYMENT",
        message: "Online payments are confirmed by the gateway",
      })
    }
    if (payment.status === PaymentStatus.SUCCESS && payment.receiptNumber) {
      return { ...this.paymentResult(payment), ...replayedReceipt(payment) }
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException({
        code: "PAYMENT_NOT_PENDING",
        message: "Only a pending cheque, draft, or bank transfer can be confirmed",
      })
    }
    const year = payment.assessmentYearId
      ? await this.yearOrThrow(payment.assessmentYearId)
      : null
    if (!year) {
      throw new ConflictException({
        code: "ASSESSMENT_YEAR_REQUIRED",
        message: "This payment has no assessment year",
      })
    }
    const settled = await this.prisma.$transaction((tx) =>
      this.settleInTransaction(tx, payment.id, user, year.code)
    )
    await this.audit.log({
      action: "OFFLINE_COLLECTION_CONFIRMED",
      entity: "Payment",
      entityId: settled.id,
      actorId: user.id,
      oldValue: { status: PaymentStatus.PENDING },
      newValue: {
        status: settled.status,
        receiptNumber: settled.receiptNumber,
      },
    })
    return { ...this.paymentResult(settled), created: false }
  }

  async receipts(query: ReceiptListQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where: Prisma.PaymentWhereInput = {
      paymentMode: { not: PaymentMode.ONLINE },
      ...(query.status ? { status: query.status as PaymentStatus } : {}),
      ...(query.assessmentYearId ? { assessmentYearId: query.assessmentYearId } : {}),
      ...(query.receiptNumber
        ? { receiptNumber: { contains: query.receiptNumber.trim(), mode: "insensitive" } }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            collectionDate: {
              ...(query.dateFrom ? { gte: dayStart(query.dateFrom) } : {}),
              ...(query.dateTo
                ? { lt: new Date(dayStart(query.dateTo).getTime() + 86400000) }
                : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { payerName: { contains: query.search.trim(), mode: "insensitive" } },
              { paymentReference: { contains: query.search.trim(), mode: "insensitive" } },
              { survey: { surveyId: { contains: query.search.trim(), mode: "insensitive" } } },
            ],
          }
        : {}),
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        include: {
          survey: { select: { surveyId: true, ownerName: true } },
          collectedBy: { select: { name: true } },
          assessmentYear: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    return {
      items: items.map((payment) => ({
        id: payment.id,
        receiptNumber: payment.receiptNumber,
        amount: moneyString(payment.amount),
        status: payment.status,
        paymentMode: payment.paymentMode,
        collectionDate: payment.collectionDate,
        propertyId: payment.survey?.surveyId ?? null,
        ownerName: payment.survey?.ownerName ?? payment.payerName,
        assessmentYear: payment.assessmentYear?.name ?? null,
        cashierName: payment.collectedBy?.name ?? null,
        remarks: payment.remarks,
        reversedAt: payment.reversedAt,
        reversalReason: payment.reversalReason,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    }
  }

  /**
   * Shows how an amount would be applied (oldest year first, then tax by tax)
   * using the same rule as posting. Nothing is saved.
   */
  async previewCollection(dto: CollectionPreviewDto) {
    const survey = await this.surveyOrThrow(dto.surveyId)
    const year = await this.yearOrThrow(dto.assessmentYearId)
    if (!isPositiveMoney(dto.amount)) {
      throw new BadRequestException({
        code: "AMOUNT_REQUIRED",
        message: "Enter an amount greater than zero",
      })
    }
    const breakdown = await this.demands.outstanding(survey.id, year.id)
    if (!breakdown.authoritative || !breakdown.publishedDemandId) {
      throw new ConflictException({
        code: "DEMAND_NOT_READY",
        message:
          "Publish a verified demand before collection. Missing historical years are not treated as zero.",
      })
    }
    const allocation = await this.prisma.$transaction(async (tx) => {
      const years = await this.demands.lockedCollectableYears(tx, survey.id, year.code)
      try {
        return allocateWithComponents(moneyString(dto.amount), years)
      } catch (error) {
        if (error instanceof CollectionRuleError) {
          throw new BadRequestException({ code: error.code, message: error.message })
        }
        throw error
      }
    })
    return {
      surveyId: survey.id,
      assessmentYearId: year.id,
      amount: moneyString(dto.amount),
      outstandingBefore: allocation.outstandingBefore,
      outstandingAfter: allocation.outstandingAfter,
      paymentStatus: money(allocation.outstandingAfter).gt(0) ? "PARTIALLY_PAID" : "PAID",
      lines: allocation.lines.map(toReceiptAllocation),
      rule:
        "Oldest year first. Within a year: interest and other charges, penalty, drainage tax, water tax, then property tax.",
    }
  }

  async receiptHtml(
    paymentId: string,
    copy: ReceiptCopy = "both",
    viewer?: AuthUser
  ): Promise<string> {
    const snapshot = await this.snapshotOrThrow(paymentId)
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { status: true, reversedAt: true, reversedById: true, reversalReason: true },
    })
    // A reversed payment reprints its original receipt with a REVERSED stamp.
    let reversal: { at: string; by: string; reason: string } | null = null
    if (payment && (payment.status === PaymentStatus.REFUNDED || payment.reversedAt)) {
      const actor = payment.reversedById
        ? await this.prisma.user.findUnique({
            where: { id: payment.reversedById },
            select: { name: true },
          })
        : null
      reversal = {
        at: payment.reversedAt ? istDateTime(payment.reversedAt) : "—",
        by: actor?.name ?? "—",
        reason: payment.reversalReason ?? "—",
      }
    }
    const now = new Date()
    if (viewer) {
      await this.audit.log({
        action: "RECEIPT_PRINTED",
        entity: "Payment",
        entityId: paymentId,
        actorId: viewer.id,
        newValue: { receiptNumber: snapshot.receiptNumber, copy },
      })
    }
    return renderReceiptHtml(
      { ...snapshot, reversal },
      {
        copy,
        office: {
          paymentStatus:
            payment?.status === PaymentStatus.REFUNDED ? "REVERSED" : (payment?.status ?? "—"),
          printedBy: viewer?.name ?? "—",
          printedAt: istDateTime(now),
        },
      }
    )
  }

  async receiptPdf(paymentId: string, copy: ReceiptCopy = "both", viewer?: AuthUser): Promise<Buffer> {
    const html = await this.receiptHtml(paymentId, copy, viewer)
    return renderDemandNoticePdfFromHtml(html)
  }

  /** Year-wise and transaction-wise ledger for one property. Read-only. */
  async ledger(query: LedgerQueryDto, user: AuthUser) {
    const survey = await this.surveyOrThrow(query.surveyId)
    const demands = await this.prisma.assessmentDemand.findMany({
      where: { surveyId: survey.id, status: "PUBLISHED" },
      include: {
        assessmentYear: { select: { id: true, code: true, name: true } },
        publishedBy: { select: { name: true } },
        adjustments: { include: { createdBy: { select: { name: true } } } },
        allocations: {
          include: {
            payment: {
              include: { collectedBy: { select: { name: true } } },
            },
          },
        },
      },
    })
    const pending = await this.prisma.payment.findMany({
      where: { surveyId: survey.id, status: PaymentStatus.PENDING },
      include: {
        collectedBy: { select: { name: true } },
        assessmentYear: { select: { code: true, name: true } },
      },
    })
    const inputs: LedgerDemandInput[] = demands.map((demand) => ({
      id: demand.id,
      assessmentYearId: demand.assessmentYear.id,
      assessmentYearCode: demand.assessmentYear.code,
      assessmentYearName: demand.assessmentYear.name,
      demandReference: demand.demandReference,
      publishedAt: demand.publishedAt ?? demand.createdAt,
      verificationStatus: demand.verificationStatus,
      balanceKind: demand.balanceKind,
      propertyTax: demand.propertyTax.toString(),
      waterTax: demand.waterTax.toString(),
      drainageTax: demand.drainageTax.toString(),
      penalty: demand.penalty.toString(),
      interest: demand.interest.toString(),
      currentYearDemand: demand.currentYearDemand.toString(),
      rebateAmount: demand.rebateAmount.toString(),
      historicalPayments: demand.historicalPayments.toString(),
      sourceReference: demand.sourceReference,
      publishedByName: demand.publishedBy?.name ?? null,
      adjustments: demand.adjustments.map((row) => ({
        id: row.id,
        kind: row.kind,
        amount: row.amount.toString(),
        reason: row.reason,
        createdAt: row.createdAt,
        createdByName: row.createdBy?.name ?? null,
      })),
      allocations: demand.allocations.map((row) => ({
        id: row.id,
        amount: row.amount.toString(),
        status: row.status,
        createdAt: row.createdAt,
        reversedAt: row.reversedAt,
        payment: {
          id: row.payment.id,
          status: row.payment.status,
          receiptNumber: row.payment.receiptNumber,
          paymentReference: row.payment.paymentReference,
          gatewayReference: row.payment.gatewayReference,
          remarks: row.payment.remarks,
          paymentMode: row.payment.paymentMode,
          collectionDate: row.payment.collectionDate,
          createdAt: row.payment.createdAt,
          collectedByName: row.payment.collectedBy?.name ?? null,
          chequeDdReference: row.payment.chequeDdReference,
          reversedAt: row.payment.reversedAt,
          reversalReason: row.payment.reversalReason,
          postedParts: postedPartsFor(row.payment.receiptSnapshot, demand.assessmentYear.code),
        },
      })),
    }))
    const built = buildConsumerLedger({
      demands: inputs,
      pendingPayments: pending.map((row) => ({
        id: row.id,
        amount: row.amount.toString(),
        paymentMode: row.paymentMode,
        collectionDate: row.collectionDate,
        createdAt: row.createdAt,
        collectedByName: row.collectedBy?.name ?? null,
        chequeDdReference: row.chequeDdReference,
        assessmentYearCode: row.assessmentYear?.code ?? null,
        assessmentYearName: row.assessmentYear?.name ?? null,
      })),
    })

    // Header figures come from the outstanding engine for the chosen year.
    const latestCode = [...built.years].sort((a, b) =>
      b.assessmentYearCode.localeCompare(a.assessmentYearCode)
    )[0]?.assessmentYearId
    const headerYearId = query.assessmentYearId || latestCode
    const breakdown = headerYearId
      ? await this.demands.outstanding(survey.id, headerYearId)
      : null
    const yearFilter = query.assessmentYearId
      ? built.years.find((year) => year.assessmentYearId === query.assessmentYearId)
          ?.assessmentYearCode ?? "__none__"
      : undefined
    const entries = filterLedgerEntries(built.entries, {
      assessmentYearCode: yearFilter,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      category: query.category,
      status: query.status,
    })
    const includeMobile = canReadMobile(user)
    return {
      municipality: MUNICIPALITY,
      property: {
        surveyId: survey.id,
        propertyId: survey.surveyId,
        ownerName: survey.ownerName,
        fatherName: survey.ownerFatherName,
        wardName: survey.ward.name,
        wardNumber: survey.ward.number,
        houseNo: survey.houseNo,
        address: addressOf(survey),
        mobile: includeMobile ? survey.mobile : null,
      },
      header: breakdown
        ? {
            assessmentYearId: breakdown.selectedYearId,
            assessmentYear: breakdown.selectedYearName,
            openingBalance: breakdown.openingArrears,
            currentDemand: moneyString(
              sumMoney([breakdown.propertyTax, breakdown.waterTax, breakdown.drainageTax])
            ),
            propertyTax: breakdown.propertyTax,
            waterTax: breakdown.waterTax,
            drainageTax: breakdown.drainageTax,
            penaltyAndInterest: moneyString(
              sumMoney([breakdown.penalty, breakdown.interest, breakdown.approvedDebits])
            ),
            rebatesAndCredits: moneyString(
              sumMoney([breakdown.rebateAmount, breakdown.approvedCredits])
            ),
            totalPayments: breakdown.paymentsAllocated,
            closingOutstanding: breakdown.netOutstanding,
            authoritative: breakdown.authoritative,
            warning: breakdown.authoritative
              ? null
              : "Historical balances are incomplete. Missing or unverified years are not treated as zero.",
            unreconciledYears: [
              ...breakdown.unreconciledYears,
              ...breakdown.missingHistoryYears,
            ].map((year) => ({ name: year.name, reason: year.reason })),
          }
        : null,
      years: built.years,
      yearsWithArrears: built.years
        .filter((year) => year.verificationStatus === "VERIFIED" && money(year.outstanding).gt(0))
        .map((year) => ({ name: year.assessmentYearName, outstanding: year.outstanding })),
      entries,
      totalEntries: built.entries.length,
      closingBalance: built.closingBalance,
      reconciles: built.reconciles,
      engineOutstanding: built.engineOutstanding,
    }
  }

  /** Carry-forward reconciliation for one year. Read-only; safe to run any time. */
  async yearEndPreview(assessmentYearId: string) {
    const year = await this.yearOrThrow(assessmentYearId)
    const profile = await this.prisma.assessmentYearProfile.findUnique({
      where: { referenceEntryId: year.id },
    })
    const allYears = await this.prisma.referenceEntry.findMany({
      where: { category: { code: "ASSESSMENT_YEAR" } },
      select: { id: true, code: true, name: true },
    })
    const next =
      allYears
        .filter((row) => row.code.localeCompare(year.code) > 0)
        .sort((a, b) => a.code.localeCompare(b.code))[0] ?? null
    const lines = await this.prisma.$queryRaw<
      Array<{
        survey_id: string
        year_code: string
        demand: Prisma.Decimal
        rebate: Prisma.Decimal
        credits: Prisma.Decimal
        payments: Prisma.Decimal
        own_outstanding: Prisma.Decimal
      }>
    >`
      WITH line AS (${this.ledgerLines()})
      SELECT survey_id, year_code,
        (current_year + interest + debits) AS demand,
        rebate, credits, (paid + historical) AS payments, own_outstanding
      FROM line
      WHERE year_code <= ${year.code}
    `
    const nextStored = next
      ? await this.prisma.assessmentDemand.findMany({
          where: {
            assessmentYearId: next.id,
            status: "PUBLISHED",
            verificationStatus: "VERIFIED",
          },
          select: { surveyId: true, openingArrears: true },
        })
      : []
    const [flagRow] = await this.prisma.$queryRaw<
      Array<{
        unverified: number
        unverified_amount: Prisma.Decimal | null
        pending: number
        pending_amount: Prisma.Decimal | null
        without_demand: number
        unassigned: number
        gaps: number
      }>
    >`
      SELECT
        (SELECT COUNT(*)::int FROM assessment_demand d JOIN reference_entry y ON y.id = d."assessmentYearId"
          WHERE d.status::text = 'PUBLISHED' AND d."verificationStatus"::text = 'UNVERIFIED' AND y.code <= ${year.code}) AS unverified,
        (SELECT COALESCE(SUM(d."currentYearDemand"), 0) FROM assessment_demand d JOIN reference_entry y ON y.id = d."assessmentYearId"
          WHERE d.status::text = 'PUBLISHED' AND d."verificationStatus"::text = 'UNVERIFIED' AND y.code <= ${year.code}) AS unverified_amount,
        (SELECT COUNT(*)::int FROM payment p WHERE p.status::text = 'PENDING' AND p."paymentMode"::text <> 'ONLINE'
          AND p."assessmentYearId" = ${year.id}) AS pending,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payment p WHERE p.status::text = 'PENDING' AND p."paymentMode"::text <> 'ONLINE'
          AND p."assessmentYearId" = ${year.id}) AS pending_amount,
        (SELECT COUNT(*)::int FROM payment p WHERE p.status::text = 'SUCCESS' AND p."assessmentYearId" = ${year.id}
          AND (p.gateway IS NULL OR p.gateway <> 'sandbox')
          AND NOT EXISTS (SELECT 1 FROM assessment_demand d WHERE d."surveyId" = p."surveyId"
            AND d."assessmentYearId" = p."assessmentYearId" AND d.status::text = 'PUBLISHED')) AS without_demand,
        (SELECT COUNT(*)::int FROM payment p WHERE p.status::text = 'SUCCESS' AND p."assessmentYearId" IS NULL
          AND (p.gateway IS NULL OR p.gateway <> 'sandbox')
          AND p.amount > COALESCE((SELECT SUM(a.amount) FROM payment_allocation a
            WHERE a."paymentId" = p.id AND a.status::text = 'ACTIVE'), 0)) AS unassigned,
        (SELECT COUNT(DISTINCT later."surveyId")::int FROM assessment_demand later
          JOIN reference_entry ly ON ly.id = later."assessmentYearId"
          WHERE later.status::text = 'PUBLISHED' AND ly.code > ${year.code}
            AND NOT EXISTS (SELECT 1 FROM assessment_demand cur WHERE cur."surveyId" = later."surveyId"
              AND cur."assessmentYearId" = ${year.id} AND cur.status::text = 'PUBLISHED'
              AND cur."verificationStatus"::text = 'VERIFIED')
            AND EXISTS (SELECT 1 FROM assessment_demand old JOIN reference_entry oy ON oy.id = old."assessmentYearId"
              WHERE old."surveyId" = later."surveyId" AND old.status::text = 'PUBLISHED' AND oy.code < ${year.code})) AS gaps
    `
    const report = buildYearEndReport({
      yearCode: year.code,
      lines: lines.map(
        (row): YearEndLine => ({
          surveyId: row.survey_id,
          yearCode: row.year_code,
          demand: row.demand.toString(),
          rebate: row.rebate.toString(),
          credits: row.credits.toString(),
          payments: row.payments.toString(),
          ownOutstanding: row.own_outstanding.toString(),
        })
      ),
      nextYear: next
        ? {
            yearCode: next.code,
            storedOpening: nextStored.map((row) => ({
              surveyId: row.surveyId,
              openingArrears: row.openingArrears.toString(),
            })),
          }
        : null,
      flags: {
        unverifiedDemands: Number(flagRow?.unverified ?? 0),
        unverifiedAmount: moneyString(flagRow?.unverified_amount ?? 0),
        pendingInstruments: Number(flagRow?.pending ?? 0),
        pendingAmount: moneyString(flagRow?.pending_amount ?? 0),
        paymentsWithoutDemand: Number(flagRow?.without_demand ?? 0),
        unassignedPayments: Number(flagRow?.unassigned ?? 0),
        gapProperties: Number(flagRow?.gaps ?? 0),
      },
    })
    const lastClose = await this.prisma.auditLog.findFirst({
      where: { action: "YEAR_END_CLOSED", entity: "AssessmentYear", entityId: year.id },
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true } } },
    })
    return {
      assessmentYear: { id: year.id, code: year.code, name: year.name },
      nextYear: next ? { id: next.id, code: next.code, name: next.name } : null,
      status: profile?.status ?? "NOT_CONFIGURED",
      canClose:
        Boolean(profile) && (profile?.status === "ACTIVE" || profile?.status === "DRAFT"),
      lastClose: lastClose
        ? {
            at: lastClose.createdAt.toISOString(),
            by: lastClose.actor?.name ?? null,
            reason:
              (lastClose.metadata as { reason?: string } | null)?.reason ?? null,
          }
        : null,
      report,
    }
  }

  /**
   * Closes the year after an authorised review. Nothing is copied or
   * rewritten: the next year's arrears stay computed from these balances.
   * Running it again on a closed year changes nothing.
   */
  async yearEndClose(dto: YearEndCloseDto, user: AuthUser) {
    const reason = dto.reason?.trim() ?? ""
    if (reason.length < 5) {
      throw new BadRequestException({
        code: "YEAR_END_REASON_REQUIRED",
        message: "Give a reason or approval reference (at least 5 characters)",
      })
    }
    const preview = await this.yearEndPreview(dto.assessmentYearId)
    if (preview.status === "CLOSED" || preview.status === "ARCHIVED") {
      throw new ConflictException({
        code: "YEAR_ALREADY_CLOSED",
        message: "This assessment year is already closed. Nothing was changed.",
      })
    }
    if (!preview.canClose) {
      throw new ConflictException({
        code: "ASSESSMENT_YEAR_NOT_CONFIGURED",
        message: "Set the assessment year's dates before closing it",
      })
    }
    if (preview.report.blockingIssues.length > 0 && !dto.acknowledgeIssues) {
      throw new ConflictException({
        code: "YEAR_END_ISSUES",
        message:
          "Review the listed issues and confirm that they are acknowledged before closing the year.",
        details: { issues: preview.report.blockingIssues },
      })
    }
    const closed = await this.prisma.assessmentYearProfile.updateMany({
      where: {
        referenceEntryId: dto.assessmentYearId,
        status: { in: ["ACTIVE", "DRAFT"] },
      },
      data: { status: "CLOSED" },
    })
    if (closed.count === 0) {
      throw new ConflictException({
        code: "YEAR_ALREADY_CLOSED",
        message: "This assessment year was closed by someone else. Nothing was changed.",
      })
    }
    const { report } = preview
    await this.audit.log({
      action: "YEAR_END_CLOSED",
      entity: "AssessmentYear",
      entityId: dto.assessmentYearId,
      actorId: user.id,
      oldValue: { status: preview.status },
      newValue: {
        status: "CLOSED",
        openingArrears: report.openingArrears,
        demand: report.demand,
        rebateAndCredits: report.rebateAndCredits,
        payments: report.payments,
        closingCarryForward: report.closingCarryForward,
        propertiesWithArrears: report.propertiesWithArrears,
        chainOk: report.chainOk,
      },
      metadata: { reason, issuesAcknowledged: report.blockingIssues },
    })
    return this.yearEndPreview(dto.assessmentYearId)
  }

  private async settleInTransaction(
    tx: Prisma.TransactionClient,
    paymentId: string,
    user: AuthUser,
    yearCode: string
  ) {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } })
    if (!payment?.surveyId || !payment.assessmentYearId) {
      throw new ConflictException({
        code: "PAYMENT_PROPERTY_REQUIRED",
        message: "Payment is not linked to a property and assessment year",
      })
    }
    const collector =
      payment.collectedById && payment.collectedById !== user.id
        ? await tx.user.findUnique({
            where: { id: payment.collectedById },
            select: { id: true, name: true },
          })
        : { id: user.id, name: user.name }
    const survey = await tx.survey.findUnique({
      where: { id: payment.surveyId },
      include: { ward: true },
    })
    const demand = await tx.assessmentDemand.findFirst({
      where: {
        surveyId: payment.surveyId,
        assessmentYearId: payment.assessmentYearId,
        status: "PUBLISHED",
      },
    })
    if (!survey || !demand) {
      throw new ConflictException({
        code: "DEMAND_NOT_READY",
        message: "Published demand was not found",
      })
    }
    const years = await this.demands.lockedCollectableYears(
      tx,
      payment.surveyId,
      yearCode
    )
    let allocation: ReturnType<typeof allocateWithComponents>
    try {
      allocation = allocateWithComponents(moneyString(payment.amount), years)
    } catch (error) {
      if (error instanceof CollectionRuleError) {
        throw new BadRequestException({ code: error.code, message: error.message })
      }
      throw error
    }
    const lines = allocation.lines
    for (const line of lines) {
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          assessmentDemandId: line.assessmentDemandId,
          amount: line.amount,
          createdById: user.id,
        },
      })
    }
    const outstandingBefore = allocation.outstandingBefore
    const previousDues = sumMoney(
      years
        .filter((year) => year.assessmentYearCode.localeCompare(yearCode) < 0)
        .map((year) => year.unpaid)
    )
    const receiptNumber = await this.nextReceiptNumber(tx, yearCode)
    const snapshot: ReceiptSnapshot = {
      municipality: MUNICIPALITY,
      receiptNumber,
      receiptAt: new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(payment.collectionDate ?? new Date()),
      propertyId: survey.surveyId,
      ownerName: survey.ownerName ?? "—",
      address: addressOf(survey),
      ward: survey.ward.name,
      assessmentYear: yearCode,
      demandReference: demand.demandReference,
      propertyTax: moneyString(demand.propertyTax),
      waterTax: moneyString(demand.waterTax),
      drainageTax: moneyString(demand.drainageTax),
      previousDues: moneyString(previousDues),
      rebate: moneyString(demand.rebateAmount),
      penalty: moneyString(demand.penalty),
      interest: moneyString(demand.interest),
      totalPayable: moneyString(outstandingBefore),
      amountReceived: moneyString(payment.amount),
      paymentMode: payment.paymentMode,
      remaining: allocation.outstandingAfter,
      amountInWords: rupeesInWords(moneyString(payment.amount)),
      cashierName: collector?.name ?? user.name,
      counterCode: payment.counterCode ?? "",
      allocationText: allocationSummary(lines),
      fatherName: survey.ownerFatherName ?? undefined,
      wardNumber: String(survey.ward.number),
      houseNo: survey.houseNo ?? undefined,
      locality: survey.locality ?? survey.colony ?? undefined,
      mobileMasked: survey.mobile ? maskMobile(survey.mobile) : undefined,
      paymentReference: payment.chequeDdReference ?? undefined,
      paymentId: payment.id,
      collectorId: collector?.id ?? user.id,
      confirmedBy: collector && collector.id !== user.id ? user.name : undefined,
      allocations: lines.map(toReceiptAllocation),
    }
    return tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        receiptNumber,
        receiptSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        refundableAmount: payment.amount,
      },
    })
  }

  private async nextReceiptNumber(
    tx: Prisma.TransactionClient,
    yearCode: string
  ): Promise<string> {
    const rows = await tx.$queryRaw<Array<{ lastValue: number }>>`
      INSERT INTO receipt_sequence ("yearCode", "lastValue")
      VALUES (${yearCode}, 1)
      ON CONFLICT ("yearCode")
      DO UPDATE SET "lastValue" = receipt_sequence."lastValue" + 1
      RETURNING "lastValue"
    `
    const value = Number(rows[0]?.lastValue ?? 0)
    if (!value) {
      throw new ConflictException({
        code: "RECEIPT_NUMBER_FAILED",
        message: "Receipt number could not be issued",
      })
    }
    return formatReceiptNumber(yearCode, value)
  }

  private paymentResult(payment: {
    id: string
    status: PaymentStatus
    amount: Prisma.Decimal
    receiptNumber: string | null
    paymentMode: PaymentMode
    receiptSnapshot: Prisma.JsonValue | null
  }) {
    const snapshot = asSnapshot(payment.receiptSnapshot)
    return {
      paymentId: payment.id,
      status: payment.status,
      amount: moneyString(payment.amount),
      receiptNumber: payment.receiptNumber,
      paymentMode: payment.paymentMode,
      remaining: snapshot?.remaining ?? null,
      outstandingBefore: snapshot?.totalPayable ?? null,
      allocationText: snapshot?.allocationText ?? null,
      allocations: snapshot?.allocations ?? null,
    }
  }

  private async snapshotOrThrow(paymentId: string): Promise<ReceiptSnapshot> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) {
      throw new NotFoundException({
        code: "PAYMENT_NOT_FOUND",
        message: "Payment was not found",
      })
    }
    const snapshot = asSnapshot(payment.receiptSnapshot)
    if (!snapshot || !payment.receiptNumber) {
      throw new ConflictException({
        code: "RECEIPT_NOT_ISSUED",
        message: "This payment does not have a confirmed receipt to reprint",
      })
    }
    return snapshot
  }

  private collectedAtOrThrow(day: string | undefined, time: string | undefined): Date {
    try {
      return collectionInstant(day, time)
    } catch (error) {
      if (error instanceof CollectionRuleError) {
        throw new BadRequestException({ code: error.code, message: error.message })
      }
      throw error
    }
  }

  private ledgerLines(): Prisma.Sql {
    return Prisma.sql`
      SELECT
        d."surveyId" AS survey_id,
        d."wardId" AS ward_id,
        y.code AS year_code,
        d."propertyTax" AS property_tax,
        d."waterTax" AS water_tax,
        d."drainageTax" AS drainage_tax,
        d.penalty AS penalty,
        d.interest AS interest,
        d."currentYearDemand" AS current_year,
        d."rebateAmount" AS rebate,
        d."historicalPayments" AS historical,
        d."demandReference" AS demand_reference,
        COALESCE(adj.credits, 0) AS credits,
        COALESCE(adj.debits, 0) AS debits,
        COALESCE(paid.paid, 0) AS paid,
        (
          d."currentYearDemand" + d.interest + COALESCE(adj.debits, 0)
          - d."rebateAmount" - COALESCE(adj.credits, 0)
          - COALESCE(paid.paid, 0) - d."historicalPayments"
        ) AS own_outstanding
      FROM assessment_demand d
      INNER JOIN reference_entry y ON y.id = d."assessmentYearId"
      LEFT JOIN (
        SELECT "assessmentDemandId" AS demand_id,
          COALESCE(SUM(CASE WHEN kind::text = 'CREDIT' THEN amount ELSE 0 END), 0) AS credits,
          COALESCE(SUM(CASE WHEN kind::text = 'DEBIT' THEN amount ELSE 0 END), 0) AS debits
        FROM demand_adjustment
        GROUP BY "assessmentDemandId"
      ) adj ON adj.demand_id = d.id
      LEFT JOIN (
        SELECT a."assessmentDemandId" AS demand_id,
          COALESCE(SUM(a.amount), 0) AS paid
        FROM payment_allocation a
        INNER JOIN payment p ON p.id = a."paymentId"
        WHERE a.status::text = 'ACTIVE'
          AND p.status::text = 'SUCCESS'
          AND (p.gateway IS NULL OR p.gateway <> 'sandbox')
        GROUP BY a."assessmentDemandId"
      ) paid ON paid.demand_id = d.id
      WHERE d.status::text = 'PUBLISHED'
        AND d."verificationStatus"::text = 'VERIFIED'
    `
  }

  private async yearOrThrow(id: string) {
    const year = await this.prisma.referenceEntry.findFirst({
      where: { id, category: { code: "ASSESSMENT_YEAR" } },
      select: { id: true, code: true, name: true },
    })
    if (!year) {
      throw new NotFoundException({
        code: "ASSESSMENT_YEAR_NOT_FOUND",
        message: "Assessment year was not found",
      })
    }
    return year
  }

  private async surveyOrThrow(key: string) {
    const survey = await this.prisma.survey.findFirst({
      where: { OR: [{ id: key }, { surveyId: key }], deletedAt: null },
      include: { ward: true },
    })
    if (!survey || survey.status !== "ACTIVE") {
      throw new NotFoundException({
        code: "PROPERTY_NOT_FOUND",
        message: "Property was not found",
      })
    }
    return survey
  }
}
