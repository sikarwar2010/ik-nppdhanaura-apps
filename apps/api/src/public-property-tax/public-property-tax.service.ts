import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common"
import { PaymentStatus, Prisma } from "@prisma/client"

import { DemandsService } from "../demands/demands.service"
import { moneyToNumber } from "../demands/money"
import { PaymentsService } from "../payments/payments.service"
import { PrismaService } from "../prisma/prisma.service"
import type { CreatePublicPropertyTaxPaymentDto } from "./dto/create-public-payment.dto"
import type { PublicPropertyTaxSearchQueryDto } from "./dto/public-property-tax.dto"
import {
  resolveDueStatus,
  resolveLedgerDueStatus,
  type PublicPropertyTaxDueStatus,
} from "./due-status.util"
import {
  computePublicDuesPayload,
  pickLatestPublishedConfig,
} from "./dues.util"
import {
  assertOwnerSearchInput,
  maskMobile,
  maskOwnerName,
  normalizeMobileDigits,
} from "./masking.util"
import {
  CITIZEN_PAYMENT_IN_PROGRESS_WINDOW_MS,
  hasRecentOpenCitizenPayment,
} from "./payment-in-progress.util"

export type PublicPropertyTaxResultItem = {
  id: string
  surveyId: string
  wardNumber: number
  wardName: string
  propertyNo: string | null
  parcelNo: string | null
  ownerNameMasked: string
  mobileMasked: string
  locality: string | null
  dueStatus: PublicPropertyTaxDueStatus
}

@Injectable()
export class PublicPropertyTaxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly demands: DemandsService
  ) {}

  async listWards() {
    const wards = await this.prisma.ward.findMany({
      where: { isActive: true },
      orderBy: { number: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        number: true,
      },
    })
    return wards
  }

  async getDues(surveyCuid: string) {
    const id = surveyCuid?.trim()
    if (!id) {
      throw new BadRequestException({
        code: "SURVEY_ID_REQUIRED",
        message: "Survey id is required",
      })
    }

    const survey = await this.prisma.survey.findFirst({
      where: {
        id,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        id: true,
        surveyId: true,
        ownerName: true,
        ownerFatherName: true,
        mobile: true,
        propertyNo: true,
        parcelNo: true,
        houseNo: true,
        streetName: true,
        locality: true,
        colony: true,
        city: true,
        pincode: true,
        propertyUse: true,
        propertyType: true,
        taxRateZone: true,
        roadType: true,
        hasMunicipalWaterSupply: true,
        plotAreaSqFt: true,
        plinthAreaSqFt: true,
        totalBuiltUpAreaSqFt: true,
        ward: { select: { id: true, number: true, name: true } },
        floors: {
          orderBy: { sortOrder: "asc" },
          select: {
            floorLabel: true,
            usageType: true,
            usageFactor: true,
            buildingType: true,
            areaSqFt: true,
          },
        },
      },
    })

    if (!survey) {
      throw new NotFoundException({
        code: "SURVEY_NOT_FOUND",
        message: "Property record was not found",
      })
    }

    const published = await this.prisma.taxConfig.findMany({
      where: {
        wardId: survey.ward.id,
        status: "PUBLISHED",
      },
      include: {
        assessmentYear: {
          select: { id: true, code: true, name: true },
        },
        cells: {
          include: {
            roadWidthEntry: { select: { code: true } },
            constructionEntry: { select: { code: true } },
          },
        },
      },
    })

    const config = pickLatestPublishedConfig(published)
    if (!config) {
      throw new NotFoundException({
        code: "TAX_CONFIG_NOT_PUBLISHED",
        message:
          "Published tax rates are not available for this ward yet. Please contact the municipal office.",
      })
    }

    const breakdown = await this.demands.outstanding(
      survey.id,
      config.assessmentYear.id
    )
    const paidForAssessmentYear = breakdown.publishedDemandId
      ? resolveLedgerDueStatus(breakdown) === "NO_DUE"
      : await this.hasSuccessfulPaymentForYear(
          survey.id,
          config.assessmentYear.id
        )
    const onlinePaymentEnabled =
      process.env.PAYMENT_PROVIDER?.trim().toLowerCase() === "atom"

    return {
      ...computePublicDuesPayload(survey, config),
      paidForAssessmentYear,
      onlinePaymentEnabled,
      ledger: breakdown,
    }
  }

  async createPayment(dto: CreatePublicPropertyTaxPaymentDto) {
    if (process.env.PAYMENT_PROVIDER?.trim().toLowerCase() !== "atom") {
      throw new ServiceUnavailableException({
        code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
        message:
          "Online payment is not available yet because this municipality has not configured a live payment gateway.",
      })
    }

    const dues = await this.getDues(dto.surveyId)
    if (dues.ledger.publishedDemandId && !dues.ledger.authoritative) {
      throw new ConflictException({
        code: "UNRECONCILED_BALANCE",
        message:
          "Outstanding balance cannot be confirmed because earlier assessment years are not reconciled.",
      })
    }
    const amount = dues.ledger.publishedDemandId
      ? moneyToNumber(dues.ledger.netOutstanding)
      : Number(dues.tax.totalDemand)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException({
        code: "DUES_NOT_PAYABLE",
        message:
          "Tax dues are not payable for this property yet. Published rates may be missing or zero.",
      })
    }

    if (dues.paidForAssessmentYear) {
      throw new ConflictException({
        code: "ALREADY_PAID_FOR_YEAR",
        message: `Property tax for assessment year ${dues.assessmentYear.name} has already been paid.`,
      })
    }

    const survey = await this.prisma.survey.findFirst({
      where: { id: dues.id, status: "ACTIVE", deletedAt: null },
      select: { id: true, wardId: true, ownerName: true },
    })
    if (!survey) {
      throw new NotFoundException({
        code: "SURVEY_NOT_FOUND",
        message: "Property record was not found",
      })
    }

    const openPayments = await this.prisma.payment.findMany({
      where: {
        surveyId: survey.id,
        assessmentYearId: dues.assessmentYear.id,
        paymentMode: "ONLINE",
        status: { in: [PaymentStatus.INITIATED, PaymentStatus.PENDING] },
        createdAt: {
          gte: new Date(Date.now() - CITIZEN_PAYMENT_IN_PROGRESS_WINDOW_MS),
        },
      },
      select: { id: true, status: true, createdAt: true },
      take: 5,
    })
    if (hasRecentOpenCitizenPayment(openPayments)) {
      throw new ConflictException({
        code: "PAYMENT_IN_PROGRESS",
        message:
          "A payment for this property is already in progress. Please wait a few minutes and try again, or check your payment status if you already paid.",
      })
    }

    const { payment, gateway } = await this.payments.createCitizenOnline({
      amount,
      surveyId: survey.id,
      wardId: survey.wardId,
      payerName: survey.ownerName ?? undefined,
      payerMobile: dto.payerMobile,
      payerEmail: dto.payerEmail?.trim() || undefined,
      assessmentYearId: dues.assessmentYear.id,
    })

    const gatewayReturnUrl =
      process.env.ATOM_GATEWAY_RETURN_URL?.trim() ||
      (() => {
        const callback =
          process.env.ATOM_CALLBACK_URL?.trim() ||
          "http://localhost:4000/api/v1/payments/gateway/callback"
        return callback.includes("/gateway/callback")
          ? callback.replace("/gateway/callback", "/gateway/return")
          : "http://localhost:4000/api/v1/payments/gateway/return"
      })()

    const citizenEmailDomain =
      process.env.PUBLIC_CITIZEN_EMAIL_DOMAIN?.trim().replace(/^@/, "") ||
      "citizen.local"
    const custEmail =
      dto.payerEmail?.trim() || `${dto.payerMobile}@${citizenEmailDomain}`
    const checkoutEnv = (
      process.env.ATOM_CHECKOUT_ENV?.trim().toLowerCase() === "prod"
        ? "prod"
        : "uat"
    ) as "uat" | "prod"
    const cdnUrl =
      process.env.ATOM_CHECKOUT_CDN?.trim() ||
      (checkoutEnv === "prod"
        ? "https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js"
        : "https://pgtest.atomtech.in/staticdata/ots/js/atomcheckout.js")

    if (gateway.atomTokenId && gateway.merchId) {
      return {
        paymentId: payment.id,
        merchTxnId: payment.merchTxnId,
        amount: Number(payment.amount),
        currency: payment.currency,
        checkout: {
          mode: "aipay" as const,
          atomTokenId: gateway.atomTokenId,
          merchId: gateway.merchId,
          custEmail,
          custMobile: dto.payerMobile,
          returnUrl: gatewayReturnUrl,
          cdnUrl,
          env: checkoutEnv,
        },
        assessmentYear: dues.assessmentYear.name,
        surveyId: dues.surveyId,
      }
    }

    if (!gateway.redirectUrl) {
      throw new BadRequestException({
        code: "GATEWAY_CHECKOUT_MISSING",
        message:
          "Payment gateway did not return a checkout token or redirect URL. Check Atom UAT credentials and PAYMENT_PROVIDER=atom.",
      })
    }

    return {
      paymentId: payment.id,
      merchTxnId: payment.merchTxnId,
      amount: Number(payment.amount),
      currency: payment.currency,
      redirectUrl: gateway.redirectUrl,
      assessmentYear: dues.assessmentYear.name,
      surveyId: dues.surveyId,
    }
  }

  async getPaymentByMerchTxnId(merchTxnId: string, sync = false) {
    const id = merchTxnId?.trim()
    if (!id) {
      throw new BadRequestException({
        code: "MERCH_TXN_REQUIRED",
        message: "merchTxnId is required",
      })
    }

    const payment = sync
      ? await this.payments.syncCitizenPaymentByMerchTxnId(id)
      : await this.prisma.payment.findFirst({ where: { merchTxnId: id } })

    if (!payment) {
      throw new NotFoundException({
        code: "PAYMENT_NOT_FOUND",
        message: "Payment was not found",
      })
    }

    const survey = payment.surveyId
      ? await this.prisma.survey.findUnique({
          where: { id: payment.surveyId },
          select: {
            surveyId: true,
            ward: { select: { number: true, name: true } },
            propertyNo: true,
            parcelNo: true,
          },
        })
      : null

    return {
      paymentId: payment.id,
      merchTxnId: payment.merchTxnId,
      status: payment.status,
      sandbox: payment.gateway === "sandbox",
      amount: Number(payment.amount),
      currency: payment.currency,
      payerMobileMasked: maskMobile(payment.payerMobile),
      id: payment.surveyId,
      surveyId: survey?.surveyId ?? null,
      wardNumber: survey?.ward.number ?? null,
      wardName: survey?.ward.name ?? null,
      propertyNo: survey?.propertyNo ?? null,
      parcelNo: survey?.parcelNo ?? null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    }
  }

  async search(query: PublicPropertyTaxSearchQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 10, 20)
    const where = await this.buildWhere(query)

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.survey.count({ where }),
      this.prisma.survey.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ ward: { number: "asc" } }, { surveyId: "asc" }],
        select: {
          id: true,
          surveyId: true,
          propertyNo: true,
          parcelNo: true,
          ownerName: true,
          mobile: true,
          locality: true,
          wardId: true,
          ward: {
            select: {
              id: true,
              number: true,
              name: true,
            },
          },
        },
      }),
    ])

    const dueStatusBySurveyId = await this.resolveSearchDueStatuses(rows)

    const items: PublicPropertyTaxResultItem[] = rows.map((row) => ({
      id: row.id,
      surveyId: row.surveyId,
      wardNumber: row.ward.number,
      wardName: row.ward.name,
      propertyNo: row.propertyNo,
      parcelNo: row.parcelNo,
      ownerNameMasked: maskOwnerName(row.ownerName),
      mobileMasked: maskMobile(row.mobile),
      locality: row.locality,
      dueStatus: dueStatusBySurveyId.get(row.id) ?? "DUE",
    }))

    return { items, page, pageSize, total }
  }

  private async hasSuccessfulPaymentForYear(
    surveyId: string,
    assessmentYearId: string
  ): Promise<boolean> {
    const count = await this.prisma.payment.count({
      where: {
        surveyId,
        assessmentYearId,
        status: PaymentStatus.SUCCESS,
        OR: [{ gateway: null }, { gateway: { not: "sandbox" } }],
      },
    })
    return count > 0
  }

  private async resolveSearchDueStatuses(
    rows: Array<{ id: string; wardId: string }>
  ): Promise<Map<string, PublicPropertyTaxDueStatus>> {
    const result = new Map<string, PublicPropertyTaxDueStatus>()
    if (rows.length === 0) return result

    const wardIds = [...new Set(rows.map((r) => r.wardId))]
    const published = await this.prisma.taxConfig.findMany({
      where: {
        wardId: { in: wardIds },
        status: "PUBLISHED",
      },
      include: {
        assessmentYear: {
          select: { id: true, code: true, name: true },
        },
        cells: {
          include: {
            roadWidthEntry: { select: { code: true } },
            constructionEntry: { select: { code: true } },
          },
        },
      },
    })

    const yearByWardId = new Map<string, string>()
    for (const wardId of wardIds) {
      const forWard = published.filter((c) => c.wardId === wardId)
      const latest = pickLatestPublishedConfig(forWard)
      if (latest) yearByWardId.set(wardId, latest.assessmentYear.id)
    }

    const surveyIds = rows.map((r) => r.id)
    const yearIds = [...new Set(yearByWardId.values())]
    const successPayments =
      yearIds.length === 0
        ? []
        : await this.prisma.payment.findMany({
            where: {
              surveyId: { in: surveyIds },
              status: PaymentStatus.SUCCESS,
              assessmentYearId: { in: yearIds },
              OR: [{ gateway: null }, { gateway: { not: "sandbox" } }],
            },
            select: {
              surveyId: true,
              assessmentYearId: true,
            },
          })

    const paidYearsBySurvey = new Map<string, Set<string>>()
    for (const payment of successPayments) {
      if (!payment.surveyId || !payment.assessmentYearId) continue
      const set = paidYearsBySurvey.get(payment.surveyId) ?? new Set<string>()
      set.add(payment.assessmentYearId)
      paidYearsBySurvey.set(payment.surveyId, set)
    }

    for (const row of rows) {
      result.set(
        row.id,
        resolveDueStatus({
          currentAssessmentYearId: yearByWardId.get(row.wardId),
          paidAssessmentYearIds: paidYearsBySurvey.get(row.id) ?? new Set(),
        })
      )
    }

    const publishedDemands =
      yearIds.length === 0
        ? []
        : await this.prisma.assessmentDemand.findMany({
            where: {
              surveyId: { in: surveyIds },
              assessmentYearId: { in: yearIds },
              status: "PUBLISHED",
            },
            select: { surveyId: true, assessmentYearId: true },
          })
    for (const demand of publishedDemands) {
      const expectedYear = yearByWardId.get(
        rows.find((row) => row.id === demand.surveyId)?.wardId ?? ""
      )
      if (expectedYear !== demand.assessmentYearId) continue
      const breakdown = await this.demands.outstanding(
        demand.surveyId,
        demand.assessmentYearId
      )
      result.set(demand.surveyId, resolveLedgerDueStatus(breakdown))
    }

    return result
  }

  private async buildWhere(
    query: PublicPropertyTaxSearchQueryDto
  ): Promise<Prisma.SurveyWhereInput> {
    const base: Prisma.SurveyWhereInput = {
      status: "ACTIVE",
      deletedAt: null,
    }

    if (query.mode === "ward") {
      if (query.wardNumber == null || !Number.isFinite(query.wardNumber)) {
        throw new BadRequestException({
          code: "WARD_NUMBER_REQUIRED",
          message: "wardNumber is required for ward search",
        })
      }

      const ward = await this.prisma.ward.findFirst({
        where: { number: query.wardNumber, isActive: true },
        select: { id: true },
      })
      if (!ward) {
        throw new NotFoundException({
          code: "WARD_NOT_FOUND",
          message: `Ward ${query.wardNumber} was not found`,
        })
      }

      const propertyHint = query.propertyNo?.trim()
      const and: Prisma.SurveyWhereInput[] = [{ wardId: ward.id }]
      if (propertyHint) {
        and.push({
          OR: [
            { propertyNo: { contains: propertyHint, mode: "insensitive" } },
            { parcelNo: { contains: propertyHint, mode: "insensitive" } },
            { houseNo: { contains: propertyHint, mode: "insensitive" } },
          ],
        })
      }
      return { ...base, AND: and }
    }

    if (query.mode === "propertyId") {
      const propertyId = query.propertyId?.trim()
      if (!propertyId) {
        throw new BadRequestException({
          code: "PROPERTY_ID_REQUIRED",
          message: "propertyId is required for property ID search",
        })
      }
      return {
        ...base,
        OR: [
          { surveyId: { equals: propertyId, mode: "insensitive" } },
          { parcelNo: { equals: propertyId, mode: "insensitive" } },
          { propertyNo: { equals: propertyId, mode: "insensitive" } },
        ],
      }
    }

    // owner
    const ownerName = query.ownerName?.trim() ?? ""
    const mobile = query.mobile?.trim() ?? ""
    const ownerError = assertOwnerSearchInput(ownerName, mobile)
    if (ownerError) {
      throw new BadRequestException({
        code: "OWNER_SEARCH_INVALID",
        message: ownerError,
      })
    }

    return {
      ...base,
      ownerName: { contains: ownerName, mode: "insensitive" },
      mobile: normalizeMobileDigits(mobile),
    }
  }
}
