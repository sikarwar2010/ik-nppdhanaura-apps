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
  subMoney,
  sumMoney,
} from "../demands/money"
import { renderDemandNoticePdfFromHtml } from "../reports/demand-notice/demand-notice-pdf"
import { PrismaService } from "../prisma/prisma.service"
import {
  allocateOldestFirst,
  CollectionRuleError,
  formatReceiptNumber,
  idempotencyDecision,
  replayedReceipt,
  settlesImmediately,
} from "./collection-rules"
import type {
  CollectTaxDto,
  CollectionListQueryDto,
  ReceiptListQueryDto,
} from "./collections.dto"
import { renderReceiptHtml, type ReceiptSnapshot } from "./receipt-html"
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

  async search(term: string, user: AuthUser) {
    const q = term.trim()
    if (q.length < 2) return []
    const includeMobile = canReadMobile(user)
    const surveys = await this.prisma.survey.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        OR: [
          { surveyId: { contains: q, mode: "insensitive" } },
          { ownerName: { contains: q, mode: "insensitive" } },
          { parcelNo: { contains: q, mode: "insensitive" } },
          { houseNo: { contains: q, mode: "insensitive" } },
          { propertyNo: { contains: q, mode: "insensitive" } },
          ...(includeMobile ? [{ mobile: { contains: q } }] : []),
        ],
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
        wardName: survey.ward.name,
        address: addressOf(survey),
        mobile: includeMobile ? survey.mobile : null,
      },
      assessmentYear: { id: year.id, code: year.code, name: year.name },
      demandReference: demand?.demandReference ?? null,
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
    const collectedAt = this.collectionInstant(dto.paymentDate)
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

  async receiptHtml(paymentId: string): Promise<string> {
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
        at: payment.reversedAt
          ? new Intl.DateTimeFormat("en-IN", {
              timeZone: "Asia/Kolkata",
              dateStyle: "medium",
              timeStyle: "short",
            }).format(payment.reversedAt)
          : "—",
        by: actor?.name ?? "—",
        reason: payment.reversalReason ?? "—",
      }
    }
    return renderReceiptHtml({ ...snapshot, reversal })
  }

  async receiptPdf(paymentId: string): Promise<Buffer> {
    const html = await this.receiptHtml(paymentId)
    return renderDemandNoticePdfFromHtml(html)
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
    let lines: ReturnType<typeof allocateOldestFirst>
    try {
      lines = allocateOldestFirst(moneyString(payment.amount), years)
    } catch (error) {
      if (error instanceof CollectionRuleError) {
        throw new BadRequestException({ code: error.code, message: error.message })
      }
      throw error
    }
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
    const outstandingBefore = sumMoney(years.map((year) => year.unpaid))
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
      remaining: moneyString(subMoney(outstandingBefore, payment.amount)),
      amountInWords: rupeesInWords(moneyString(payment.amount)),
      cashierName: user.name,
      counterCode: payment.counterCode ?? "",
      allocationText: lines
        .map((line) => `${line.assessmentYearCode} ₹ ${line.amount}`)
        .join("; "),
      fatherName: survey.ownerFatherName ?? undefined,
      wardNumber: String(survey.ward.number),
      houseNo: survey.houseNo ?? undefined,
      locality: survey.locality ?? survey.colony ?? undefined,
      mobileMasked: survey.mobile ? maskMobile(survey.mobile) : undefined,
      paymentReference: payment.chequeDdReference ?? undefined,
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
      allocationText: snapshot?.allocationText ?? null,
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

  private collectionInstant(day: string | undefined): Date {
    if (!day) return new Date()
    if (day > kolkataDay()) {
      throw new BadRequestException({
        code: "COLLECTION_DATE_IN_FUTURE",
        message: "Collection date cannot be in the future",
      })
    }
    return new Date(`${day}T12:00:00+05:30`)
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
