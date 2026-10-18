import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import { PaymentMode, PaymentStatus, Prisma } from "@prisma/client"
import { randomUUID } from "node:crypto"

import { AuditService } from "../audit/audit.service"
import { DemandsService } from "../demands/demands.service"
import { PrismaService } from "../prisma/prisma.service"
import {
  redactSensitivePaymentPayload,
  shouldReprocessProcessedCallback,
  toClientGatewayResult,
} from "./payments.safety"
import {
  AtomNdpsProvider,
  extractAtomTxnFields,
  parseAtomEncryptedCallback,
} from "./providers/atom-ndps.provider"
import type { PaymentGatewayProvider } from "./providers/payment-provider"
import { SandboxPaymentProvider } from "./providers/sandbox.provider"

const AMOUNT_TOLERANCE = 0.01

export function buildPaymentCallbackIdempotencyKey(input: {
  merchTxnId?: string
  atomTxnId?: string
  idempotencyKey?: string
}) {
  return (
    input.idempotencyKey ||
    `${input.merchTxnId ?? "na"}:${input.atomTxnId ?? "na"}`
  )
}

export function amountsMatchWithinTolerance(
  expected: number,
  actual: number,
  tolerance = AMOUNT_TOLERANCE
) {
  return Math.abs(expected - actual) <= tolerance
}

function isGatewaySuccess(statusCode: string) {
  return (
    statusCode === "OTS0000" ||
    statusCode === "SUCCESS" ||
    statusCode.toUpperCase() === "SUCCESS"
  )
}

function defaultCitizenReturnUrl() {
  return (
    process.env.ATOM_RETURN_URL ??
    "http://localhost:3001/propertytax/payment/return"
  )
}

function defaultCallbackUrl() {
  return (
    process.env.ATOM_CALLBACK_URL ??
    "http://localhost:4000/api/v1/payments/gateway/callback"
  )
}

/** Browser return target Atom should POST/GET to (API then 302s to citizen web). */
function defaultGatewayReturnUrl() {
  if (process.env.ATOM_GATEWAY_RETURN_URL?.trim()) {
    return process.env.ATOM_GATEWAY_RETURN_URL.trim()
  }
  const callback = defaultCallbackUrl()
  if (callback.includes("/gateway/callback")) {
    return callback.replace("/gateway/callback", "/gateway/return")
  }
  return "http://localhost:4000/api/v1/payments/gateway/return"
}

function citizenReturnRedirectUrl(merchTxnId: string | undefined) {
  const base = defaultCitizenReturnUrl()
  const url = new URL(base)
  if (merchTxnId) url.searchParams.set("merchTxnId", merchTxnId)
  return url.toString()
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)
  private provider: PaymentGatewayProvider

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly demands: DemandsService
  ) {
    const mode = process.env.PAYMENT_PROVIDER ?? "sandbox"
    this.provider =
      mode === "atom" ? new AtomNdpsProvider() : new SandboxPaymentProvider()
  }

  /** Citizen website online payment — no staff collector. */
  async createCitizenOnline(input: {
    amount: number
    surveyId: string
    wardId: string
    payerName?: string
    payerMobile: string
    payerEmail?: string
    assessmentYearId?: string
  }) {
    return this.createOnlinePayment(input, null)
  }

  private async createOnlinePayment(
    input: {
      amount: number
      surveyId?: string
      wardId?: string
      payerName?: string
      payerMobile?: string
      payerEmail?: string
      assessmentYearId?: string
    },
    collectedById: string | null
  ) {
    const merchTxnId = `CHH-${Date.now()}-${randomUUID().slice(0, 8)}`
    const payment = await this.prisma.payment.create({
      data: {
        paymentReference: merchTxnId,
        merchTxnId,
        amount: input.amount,
        paymentMode: PaymentMode.ONLINE,
        status: PaymentStatus.INITIATED,
        gateway: this.provider.name,
        surveyId: input.surveyId,
        wardId: input.wardId,
        assessmentYearId: input.assessmentYearId?.trim() || null,
        payerName: input.payerName,
        payerMobile: input.payerMobile,
        payerEmail: input.payerEmail,
        collectedById: collectedById ?? undefined,
        refundableAmount: input.amount,
      },
    })

    // Atom posts encData to API return endpoint; API redirects to citizen web.
    const returnUrl = defaultGatewayReturnUrl()
    const result = await this.provider.createPayment({
      merchTxnId,
      amount: input.amount,
      customerName: input.payerName,
      customerEmail: input.payerEmail,
      customerMobile: input.payerMobile,
      returnUrl,
      callbackUrl: defaultCallbackUrl(),
    })

    await this.prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        direction: "outbound",
        requestPayload: result.raw as Prisma.InputJsonValue,
        statusCode: "INIT",
      },
    })

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PENDING },
    })

    return { payment: updated, gateway: toClientGatewayResult(result) }
  }

  /**
   * Normalize Atom gateway bodies for sandbox / legacy paths.
   * Production Atom callbacks must use parseAtomEncryptedCallback instead.
   */
  normalizeGatewayPayload(
    payload: Record<string, unknown>
  ): Record<string, unknown> {
    let decoded: unknown = payload
    const encData =
      typeof payload.encData === "string" ? payload.encData.trim() : ""
    if (encData && this.provider.decryptPayload) {
      decoded = this.provider.decryptPayload(encData)
    }

    const fields = extractAtomTxnFields(decoded)
    const flatFields = extractAtomTxnFields(payload)
    const merchTxnId = fields.merchTxnId ?? flatFields.merchTxnId
    const atomTxnId = fields.atomTxnId ?? flatFields.atomTxnId
    const statusCode =
      fields.statusCode !== "UNKNOWN"
        ? fields.statusCode
        : flatFields.statusCode
    const gatewayAmount = fields.gatewayAmount ?? flatFields.gatewayAmount

    return {
      ...payload,
      ...(typeof decoded === "object" && decoded !== null
        ? (decoded as Record<string, unknown>)
        : {}),
      merchTxnId,
      atomTxnId,
      statusCode,
      gatewayAmount,
      _decoded: decoded,
    }
  }

  private parseCallbackPayload(payload: Record<string, unknown>): {
    normalized: Record<string, unknown>
    merchTxnId?: string
    atomTxnId?: string
    statusCode: string
    gatewayAmount?: number
  } {
    if (this.provider.name === "atom-ndps") {
      const parsed = parseAtomEncryptedCallback(
        payload,
        this.provider as AtomNdpsProvider
      )
      return {
        normalized: parsed.normalized,
        merchTxnId: parsed.fields.merchTxnId,
        atomTxnId: parsed.fields.atomTxnId,
        statusCode: parsed.fields.statusCode,
        gatewayAmount: parsed.fields.gatewayAmount,
      }
    }

    const normalized = this.normalizeGatewayPayload(payload)
    const fields = extractAtomTxnFields(normalized)
    return {
      normalized,
      merchTxnId:
        fields.merchTxnId ??
        (normalized.merchTxnId as string | undefined) ??
        (normalized.merchantTxnId as string | undefined),
      atomTxnId:
        fields.atomTxnId ?? (normalized.atomTxnId as string | undefined),
      statusCode: fields.statusCode,
      gatewayAmount: fields.gatewayAmount,
    }
  }

  private async rejectWebhook(
    reason: string,
    context: {
      payload: Record<string, unknown>
      merchTxnId?: string
      atomTxnId?: string
      paymentId?: string
      code: string
    }
  ) {
    await this.audit.log({
      action: "PAYMENT_WEBHOOK_REJECTED",
      entity: "Payment",
      entityId: context.paymentId,
      newValue: {
        code: context.code,
        reason,
        merchTxnId: context.merchTxnId,
        atomTxnId: context.atomTxnId,
      },
      metadata: {
        payload: redactSensitivePaymentPayload(
          context.payload
        ) as Prisma.InputJsonValue,
      },
    })

    return {
      rejected: true,
      reason,
      code: context.code,
      merchTxnId: context.merchTxnId,
    }
  }

  async handleCallback(payload: Record<string, unknown>) {
    await this.audit.log({
      action: "PAYMENT_WEBHOOK_RECEIVED",
      entity: "PaymentCallback",
      newValue: {
        provider: this.provider.name,
        hasEncData:
          typeof payload.encData === "string" &&
          payload.encData.trim().length > 0,
      },
      metadata: {
        payload: redactSensitivePaymentPayload(
          payload
        ) as Prisma.InputJsonValue,
      },
    })

    let parsed: ReturnType<PaymentsService["parseCallbackPayload"]>
    try {
      parsed = this.parseCallbackPayload(payload)
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : "Invalid gateway callback payload"
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code: unknown }).code === "string"
          ? (error as { code: string }).code
          : "CALLBACK_PARSE_FAILED"
      return this.rejectWebhook(reason, {
        payload,
        code,
      })
    }

    const { normalized, merchTxnId, atomTxnId, statusCode, gatewayAmount } =
      parsed
    const storedPayload = redactSensitivePaymentPayload(normalized) as Record<
      string,
      unknown
    >
    const idempotencyKey = buildPaymentCallbackIdempotencyKey({
      idempotencyKey: payload.idempotencyKey as string | undefined,
      merchTxnId,
      atomTxnId,
    })

    if (!merchTxnId) {
      return this.rejectWebhook("merchTxnId is required", {
        payload: storedPayload,
        atomTxnId,
        code: "MISSING_MERCH_TXN_ID",
      })
    }

    const payment = await this.prisma.payment.findFirst({
      where: { merchTxnId },
    })
    if (!payment) {
      return this.rejectWebhook("Payment not found for merchTxnId", {
        payload: storedPayload,
        merchTxnId,
        atomTxnId,
        code: "UNKNOWN_MERCH_TXN_ID",
      })
    }

    const existing = await this.prisma.paymentCallback.findUnique({
      where: { idempotencyKey },
    })
    if (
      existing?.processed &&
      !shouldReprocessProcessedCallback({
        existingProcessed: true,
        newStatusIsSuccess: isGatewaySuccess(statusCode),
        paymentStatus: payment.status,
      })
    ) {
      return { duplicate: true, callback: existing, merchTxnId }
    }

    if (
      this.provider.name === "atom-ndps" &&
      (gatewayAmount === undefined ||
        !amountsMatchWithinTolerance(Number(payment.amount), gatewayAmount))
    ) {
      return this.rejectWebhook(
        "Gateway amount does not match payment amount",
        {
          payload: storedPayload,
          merchTxnId,
          atomTxnId,
          paymentId: payment.id,
          code: "AMOUNT_MISMATCH",
        }
      )
    }

    const success = isGatewaySuccess(statusCode)
    const nextStatus = success
      ? PaymentStatus.SUCCESS
      : statusCode === "UNKNOWN"
        ? payment.status
        : PaymentStatus.FAILED

    const effectiveStatus =
      payment.status === PaymentStatus.SUCCESS && !success
        ? PaymentStatus.SUCCESS
        : nextStatus

    const statusChanged = effectiveStatus !== payment.status
    const result = await this.prisma.$transaction(async (tx) => {
      const callback = await tx.paymentCallback.upsert({
        where: { idempotencyKey },
        update: {
          statusCode,
          atomTxnId,
          rawPayload: storedPayload as Prisma.InputJsonValue,
        },
        create: {
          paymentId: payment.id,
          merchTxnId,
          atomTxnId,
          statusCode,
          rawPayload: storedPayload as Prisma.InputJsonValue,
          idempotencyKey,
          processed: false,
        },
      })

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: effectiveStatus,
          atomTxnId: atomTxnId ?? payment.atomTxnId,
          gatewayReference: atomTxnId ?? payment.gatewayReference,
          ...(success && !payment.receiptNumber
            ? {
                receiptNumber: `RCP-${payment.merchTxnId ?? payment.paymentReference}`,
                collectionDate: new Date(),
              }
            : {}),
        },
      })

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          direction: "callback",
          responsePayload: storedPayload as Prisma.InputJsonValue,
          statusCode,
        },
      })

      const processedCallback = await tx.paymentCallback.update({
        where: { id: callback.id },
        data: { processed: true },
      })

      return { callback: processedCallback, payment: updatedPayment }
    })

    if (success && statusChanged) {
      try {
        await this.demands.tryAllocateTaggedPayment(payment.id)
      } catch (err) {
        this.logger.warn(
          `Tagged payment ${payment.id} was not allocated: ${String(err)}`
        )
      }
      await this.audit.log({
        action: "PAYMENT_SUCCESS",
        entity: "Payment",
        entityId: payment.id,
        oldValue: { status: payment.status },
        newValue: {
          status: effectiveStatus,
          merchTxnId,
          atomTxnId,
          gatewayAmount,
        },
      })
    } else if (
      !success &&
      statusChanged &&
      effectiveStatus === PaymentStatus.FAILED
    ) {
      await this.audit.log({
        action: "PAYMENT_FAILED",
        entity: "Payment",
        entityId: payment.id,
        oldValue: { status: payment.status },
        newValue: {
          status: effectiveStatus,
          merchTxnId,
          atomTxnId,
          statusCode,
        },
      })
    }

    return {
      duplicate: false,
      callback: result.callback,
      merchTxnId,
      payment: result.payment,
    }
  }

  /**
   * Atom browser return: process payload like callback, then redirect citizen UI.
   */
  async handleGatewayReturn(payload: Record<string, unknown>) {
    const result = await this.handleCallback(payload)
    const merchTxnId =
      result.merchTxnId ??
      (this.normalizeGatewayPayload(payload).merchTxnId as string | undefined)
    return {
      ...result,
      redirectUrl: citizenReturnRedirectUrl(merchTxnId),
      merchTxnId,
    }
  }

  /** Public citizen return-page sync — requery gateway for PENDING payments. */
  async syncCitizenPaymentByMerchTxnId(merchTxnId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { merchTxnId },
    })
    if (!payment?.merchTxnId) {
      throw new NotFoundException({
        code: "PAYMENT_NOT_FOUND",
        message: "Payment was not found",
      })
    }

    if (
      payment.status === PaymentStatus.SUCCESS ||
      payment.status === PaymentStatus.FAILED ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      return payment
    }

    const result = await this.provider.requery({
      merchTxnId: payment.merchTxnId,
    })
    await this.prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        direction: "requery",
        responsePayload: result.raw as Prisma.InputJsonValue,
        statusCode: result.statusCode,
      },
    })

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: result.success
          ? PaymentStatus.SUCCESS
          : payment.status === PaymentStatus.PENDING
            ? PaymentStatus.PENDING
            : payment.status,
        atomTxnId: result.atomTxnId ?? payment.atomTxnId,
        ...(result.success && !payment.receiptNumber
          ? {
              receiptNumber: `RCP-${payment.merchTxnId}`,
              collectionDate: payment.collectionDate ?? new Date(),
            }
          : {}),
      },
    })
    if (result.success) {
      try {
        await this.demands.tryAllocateTaggedPayment(updated.id)
      } catch (err) {
        this.logger.warn(
          `Tagged payment ${updated.id} was not allocated: ${String(err)}`
        )
      }
    }
    return updated
  }
}
