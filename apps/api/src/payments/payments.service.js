var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { BadRequestException, Injectable, NotFoundException, } from "@nestjs/common";
import { PaymentMode, PaymentStatus, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { assertPaymentAccess, assertSurveyAccess, } from "../auth/resource-access";
import { computePublicDuesPayload, pickLatestPublishedConfig, } from "../public-property-tax/dues.util";
import { canApplyRefundToPayment, redactSensitivePaymentPayload, shouldReprocessProcessedCallback, toClientGatewayResult, } from "./payments.safety";
import { AtomNdpsProvider, extractAtomTxnFields, parseAtomEncryptedCallback, } from "./providers/atom-ndps.provider";
import { SandboxPaymentProvider } from "./providers/sandbox.provider";
const AMOUNT_TOLERANCE = 0.01;
export function buildPaymentCallbackIdempotencyKey(input) {
    return (input.idempotencyKey ||
        `${input.merchTxnId ?? "na"}:${input.atomTxnId ?? "na"}`);
}
export function amountsMatchWithinTolerance(expected, actual, tolerance = AMOUNT_TOLERANCE) {
    return Math.abs(expected - actual) <= tolerance;
}
function isGatewaySuccess(statusCode) {
    return (statusCode === "OTS0000" ||
        statusCode === "SUCCESS" ||
        statusCode.toUpperCase() === "SUCCESS");
}
function defaultCitizenReturnUrl() {
    return (process.env.ATOM_RETURN_URL ??
        "http://localhost:3001/propertytax/payment/return");
}
function defaultCallbackUrl() {
    return (process.env.ATOM_CALLBACK_URL ??
        "http://localhost:4000/api/v1/payments/gateway/callback");
}
/** Browser return target Atom should POST/GET to (API then 302s to citizen web). */
function defaultGatewayReturnUrl() {
    if (process.env.ATOM_GATEWAY_RETURN_URL?.trim()) {
        return process.env.ATOM_GATEWAY_RETURN_URL.trim();
    }
    const callback = defaultCallbackUrl();
    if (callback.includes("/gateway/callback")) {
        return callback.replace("/gateway/callback", "/gateway/return");
    }
    return "http://localhost:4000/api/v1/payments/gateway/return";
}
function citizenReturnRedirectUrl(merchTxnId) {
    const base = defaultCitizenReturnUrl();
    const url = new URL(base);
    if (merchTxnId)
        url.searchParams.set("merchTxnId", merchTxnId);
    return url.toString();
}
let PaymentsService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PaymentsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PaymentsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        prisma;
        audit;
        provider;
        constructor(prisma, audit) {
            this.prisma = prisma;
            this.audit = audit;
            const mode = process.env.PAYMENT_PROVIDER ?? "sandbox";
            this.provider =
                mode === "atom" ? new AtomNdpsProvider() : new SandboxPaymentProvider();
        }
        async createOnline(input, user) {
            if (!input.surveyId?.trim()) {
                throw new BadRequestException({
                    code: "SURVEY_REQUIRED",
                    message: "Select a property/survey before starting online payment",
                });
            }
            const { amount, survey, wardId, assessmentYearId } = await this.resolveSurveyPayableAmount(input.surveyId);
            assertSurveyAccess(user, survey, "read");
            assertPaymentAccess(user, { id: "", collectedById: user.id }, "create");
            return this.createOnlinePayment({
                amount,
                surveyId: survey.id,
                wardId: input.wardId?.trim() || wardId,
                payerName: input.payerName?.trim() || survey.ownerName || undefined,
                payerMobile: input.payerMobile?.trim() || survey.mobile || undefined,
                payerEmail: input.payerEmail?.trim() || undefined,
                assessmentYearId,
            }, user.id);
        }
        /** Citizen website online payment — no staff collector. */
        async createCitizenOnline(input) {
            return this.createOnlinePayment(input, null);
        }
        async resolveLatestPublishedAssessmentYearId(wardId) {
            const published = await this.prisma.taxConfig.findMany({
                where: { wardId, status: "PUBLISHED" },
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
            });
            const config = pickLatestPublishedConfig(published);
            return config?.assessmentYear.id ?? null;
        }
        async resolveSurveyPayableAmount(surveyId) {
            const id = surveyId.trim();
            const survey = await this.prisma.survey.findFirst({
                where: { id, status: "ACTIVE", deletedAt: null },
                select: {
                    id: true,
                    surveyId: true,
                    ownerName: true,
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
                    taxRateZone: true,
                    roadType: true,
                    hasMunicipalWaterSupply: true,
                    plotAreaSqFt: true,
                    plinthAreaSqFt: true,
                    totalBuiltUpAreaSqFt: true,
                    wardId: true,
                    createdById: true,
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
            });
            if (!survey) {
                throw new NotFoundException({
                    code: "SURVEY_NOT_FOUND",
                    message: "Property/survey was not found",
                });
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
            });
            const config = pickLatestPublishedConfig(published);
            if (!config) {
                throw new NotFoundException({
                    code: "TAX_CONFIG_NOT_PUBLISHED",
                    message: "Published tax rates are not available for this ward yet. Please contact the municipal office.",
                });
            }
            const dues = computePublicDuesPayload(survey, config);
            const amount = Number(dues.tax.totalDemand);
            if (!Number.isFinite(amount) || amount <= 0) {
                throw new BadRequestException({
                    code: "DUES_NOT_PAYABLE",
                    message: "Tax dues are not payable for this property yet. Published rates may be missing or zero.",
                });
            }
            return {
                amount,
                survey,
                wardId: survey.wardId,
                assessmentYearId: config.assessmentYear.id,
            };
        }
        async createOnlinePayment(input, collectedById) {
            const merchTxnId = `CHH-${Date.now()}-${randomUUID().slice(0, 8)}`;
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
            });
            // Atom posts encData to API return endpoint; API redirects to citizen web.
            const returnUrl = defaultGatewayReturnUrl();
            const result = await this.provider.createPayment({
                merchTxnId,
                amount: input.amount,
                customerName: input.payerName,
                customerEmail: input.payerEmail,
                customerMobile: input.payerMobile,
                returnUrl,
                callbackUrl: defaultCallbackUrl(),
            });
            await this.prisma.paymentTransaction.create({
                data: {
                    paymentId: payment.id,
                    direction: "outbound",
                    requestPayload: result.raw,
                    statusCode: "INIT",
                },
            });
            const updated = await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.PENDING },
            });
            return { payment: updated, gateway: toClientGatewayResult(result) };
        }
        static MODES_REQUIRING_REFERENCE = new Set([
            PaymentMode.CHEQUE,
            PaymentMode.DD,
            PaymentMode.UPI_MANUAL,
        ]);
        receiptSurveySelect = {
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
            taxRateZone: true,
            roadType: true,
            wardId: true,
        };
        async createOffline(input, user) {
            if (input.paymentMode === PaymentMode.ONLINE) {
                throw new BadRequestException("Use online endpoint for gateway payments");
            }
            if (!input.surveyId?.trim()) {
                throw new BadRequestException({
                    code: "SURVEY_REQUIRED",
                    message: "Select a property/survey before recording offline payment",
                });
            }
            if (PaymentsService.MODES_REQUIRING_REFERENCE.has(input.paymentMode) &&
                !input.chequeDdReference?.trim()) {
                throw new BadRequestException({
                    code: "REFERENCE_REQUIRED",
                    message: "Cheque / DD / UPI reference is required for this payment mode",
                });
            }
            const survey = await this.prisma.survey.findUnique({
                where: { id: input.surveyId },
                select: {
                    ...this.receiptSurveySelect,
                    createdById: true,
                },
            });
            if (!survey) {
                throw new NotFoundException({
                    code: "SURVEY_NOT_FOUND",
                    message: "Property/survey was not found",
                });
            }
            assertSurveyAccess(user, survey, "read");
            assertPaymentAccess(user, { id: "", collectedById: user.id }, "create_offline");
            const wardId = input.wardId?.trim() || survey.wardId;
            const assessmentYearId = await this.resolveLatestPublishedAssessmentYearId(wardId);
            const paymentReference = `OFF-${Date.now()}-${randomUUID().slice(0, 8)}`;
            const receiptNumber = input.receiptNumber?.trim() || paymentReference;
            let payment;
            try {
                payment = await this.prisma.payment.create({
                    data: {
                        paymentReference,
                        amount: input.amount,
                        paymentMode: input.paymentMode,
                        status: PaymentStatus.SUCCESS,
                        surveyId: survey.id,
                        wardId,
                        assessmentYearId,
                        payerName: input.payerName?.trim() || survey.ownerName,
                        payerMobile: input.payerMobile?.trim() || survey.mobile,
                        receiptNumber,
                        collectionDate: input.collectionDate
                            ? new Date(input.collectionDate)
                            : new Date(),
                        chequeDdReference: input.chequeDdReference?.trim() || null,
                        remarks: input.remarks?.trim() || null,
                        collectedById: user.id,
                        refundableAmount: input.amount,
                    },
                    include: {
                        survey: { select: this.receiptSurveySelect },
                        ward: { select: { id: true, number: true, name: true, code: true } },
                        collectedBy: { select: { id: true, name: true } },
                    },
                });
            }
            catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError &&
                    err.code === "P2002") {
                    throw new BadRequestException({
                        code: "RECEIPT_NUMBER_EXISTS",
                        message: "Receipt number already exists. Enter a different receipt number.",
                    });
                }
                throw err;
            }
            await this.audit.log({
                action: "PAYMENT_OFFLINE_CREATED",
                entity: "Payment",
                entityId: payment.id,
                actorId: user.id,
                newValue: {
                    paymentReference,
                    amount: input.amount,
                    surveyId: survey.id,
                    receiptNumber,
                },
            });
            return this.toStaffReceipt(payment);
        }
        async getStaffReceipt(paymentId, user) {
            const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId },
                include: {
                    survey: { select: this.receiptSurveySelect },
                    ward: { select: { id: true, number: true, name: true, code: true } },
                    collectedBy: { select: { id: true, name: true } },
                },
            });
            if (!payment) {
                throw new NotFoundException({
                    code: "PAYMENT_NOT_FOUND",
                    message: "Payment was not found",
                });
            }
            assertPaymentAccess(user, payment, "read");
            if (payment.status !== PaymentStatus.SUCCESS) {
                throw new BadRequestException({
                    code: "RECEIPT_NOT_AVAILABLE",
                    message: "Receipt is only available for successful payments",
                });
            }
            return this.toStaffReceipt(payment);
        }
        toStaffReceipt(payment) {
            const survey = payment.survey;
            const addressParts = survey
                ? [
                    survey.houseNo,
                    survey.streetName,
                    survey.locality,
                    survey.colony,
                    survey.city ?? "Nagar Panchayat Chhata",
                    survey.pincode,
                ].filter(Boolean)
                : [];
            return {
                paymentId: payment.id,
                paymentReference: payment.paymentReference,
                receiptNumber: payment.receiptNumber ?? payment.paymentReference,
                amount: Number(payment.amount),
                currency: payment.currency,
                paymentMode: payment.paymentMode,
                status: payment.status,
                payerName: payment.payerName,
                payerMobile: payment.payerMobile,
                chequeDdReference: payment.chequeDdReference,
                remarks: payment.remarks,
                collectionDate: (payment.collectionDate ?? payment.createdAt).toISOString(),
                collectedBy: payment.collectedBy
                    ? { id: payment.collectedBy.id, name: payment.collectedBy.name }
                    : null,
                survey: survey
                    ? {
                        id: survey.id,
                        surveyId: survey.surveyId,
                        ownerName: survey.ownerName,
                        ownerFatherName: survey.ownerFatherName,
                        mobile: survey.mobile,
                        propertyNo: survey.propertyNo,
                        parcelNo: survey.parcelNo,
                        houseNo: survey.houseNo,
                        streetName: survey.streetName,
                        locality: survey.locality,
                        colony: survey.colony,
                        city: survey.city,
                        pincode: survey.pincode,
                        propertyUse: survey.propertyUse,
                        taxRateZone: survey.taxRateZone,
                        roadType: survey.roadType,
                        address: addressParts.length > 0 ? addressParts.join(", ") : null,
                    }
                    : null,
                ward: payment.ward
                    ? {
                        id: payment.ward.id,
                        number: payment.ward.number,
                        name: payment.ward.name,
                        code: payment.ward.code,
                    }
                    : null,
            };
        }
        /**
         * Normalize Atom gateway bodies for sandbox / legacy paths.
         * Production Atom callbacks must use parseAtomEncryptedCallback instead.
         */
        normalizeGatewayPayload(payload) {
            let decoded = payload;
            const encData = typeof payload.encData === "string" ? payload.encData.trim() : "";
            if (encData && this.provider.decryptPayload) {
                decoded = this.provider.decryptPayload(encData);
            }
            const fields = extractAtomTxnFields(decoded);
            const flatFields = extractAtomTxnFields(payload);
            const merchTxnId = fields.merchTxnId ?? flatFields.merchTxnId;
            const atomTxnId = fields.atomTxnId ?? flatFields.atomTxnId;
            const statusCode = fields.statusCode !== "UNKNOWN"
                ? fields.statusCode
                : flatFields.statusCode;
            const gatewayAmount = fields.gatewayAmount ?? flatFields.gatewayAmount;
            return {
                ...payload,
                ...(typeof decoded === "object" && decoded !== null
                    ? decoded
                    : {}),
                merchTxnId,
                atomTxnId,
                statusCode,
                gatewayAmount,
                _decoded: decoded,
            };
        }
        parseCallbackPayload(payload) {
            if (this.provider.name === "atom-ndps") {
                const parsed = parseAtomEncryptedCallback(payload, this.provider);
                return {
                    normalized: parsed.normalized,
                    merchTxnId: parsed.fields.merchTxnId,
                    atomTxnId: parsed.fields.atomTxnId,
                    statusCode: parsed.fields.statusCode,
                    gatewayAmount: parsed.fields.gatewayAmount,
                };
            }
            const normalized = this.normalizeGatewayPayload(payload);
            const fields = extractAtomTxnFields(normalized);
            return {
                normalized,
                merchTxnId: fields.merchTxnId ??
                    normalized.merchTxnId ??
                    normalized.merchantTxnId,
                atomTxnId: fields.atomTxnId ?? normalized.atomTxnId,
                statusCode: fields.statusCode,
                gatewayAmount: fields.gatewayAmount,
            };
        }
        async rejectWebhook(reason, context) {
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
                    payload: redactSensitivePaymentPayload(context.payload),
                },
            });
            return {
                rejected: true,
                reason,
                code: context.code,
                merchTxnId: context.merchTxnId,
            };
        }
        async handleCallback(payload) {
            await this.audit.log({
                action: "PAYMENT_WEBHOOK_RECEIVED",
                entity: "PaymentCallback",
                newValue: {
                    provider: this.provider.name,
                    hasEncData: typeof payload.encData === "string" &&
                        payload.encData.trim().length > 0,
                },
                metadata: {
                    payload: redactSensitivePaymentPayload(payload),
                },
            });
            let parsed;
            try {
                parsed = this.parseCallbackPayload(payload);
            }
            catch (error) {
                const reason = error instanceof Error
                    ? error.message
                    : "Invalid gateway callback payload";
                const code = typeof error === "object" &&
                    error !== null &&
                    "code" in error &&
                    typeof error.code === "string"
                    ? error.code
                    : "CALLBACK_PARSE_FAILED";
                return this.rejectWebhook(reason, {
                    payload,
                    code,
                });
            }
            const { normalized, merchTxnId, atomTxnId, statusCode, gatewayAmount } = parsed;
            const storedPayload = redactSensitivePaymentPayload(normalized);
            const idempotencyKey = buildPaymentCallbackIdempotencyKey({
                idempotencyKey: payload.idempotencyKey,
                merchTxnId,
                atomTxnId,
            });
            if (!merchTxnId) {
                return this.rejectWebhook("merchTxnId is required", {
                    payload: storedPayload,
                    atomTxnId,
                    code: "MISSING_MERCH_TXN_ID",
                });
            }
            const payment = await this.prisma.payment.findFirst({
                where: { merchTxnId },
            });
            if (!payment) {
                return this.rejectWebhook("Payment not found for merchTxnId", {
                    payload: storedPayload,
                    merchTxnId,
                    atomTxnId,
                    code: "UNKNOWN_MERCH_TXN_ID",
                });
            }
            const existing = await this.prisma.paymentCallback.findUnique({
                where: { idempotencyKey },
            });
            if (existing?.processed &&
                !shouldReprocessProcessedCallback({
                    existingProcessed: true,
                    newStatusIsSuccess: isGatewaySuccess(statusCode),
                    paymentStatus: payment.status,
                })) {
                return { duplicate: true, callback: existing, merchTxnId };
            }
            if (this.provider.name === "atom-ndps" &&
                (gatewayAmount === undefined ||
                    !amountsMatchWithinTolerance(Number(payment.amount), gatewayAmount))) {
                return this.rejectWebhook("Gateway amount does not match payment amount", {
                    payload: storedPayload,
                    merchTxnId,
                    atomTxnId,
                    paymentId: payment.id,
                    code: "AMOUNT_MISMATCH",
                });
            }
            const success = isGatewaySuccess(statusCode);
            const nextStatus = success
                ? PaymentStatus.SUCCESS
                : statusCode === "UNKNOWN"
                    ? payment.status
                    : PaymentStatus.FAILED;
            const effectiveStatus = payment.status === PaymentStatus.SUCCESS && !success
                ? PaymentStatus.SUCCESS
                : nextStatus;
            const statusChanged = effectiveStatus !== payment.status;
            const result = await this.prisma.$transaction(async (tx) => {
                const callback = await tx.paymentCallback.upsert({
                    where: { idempotencyKey },
                    update: {
                        statusCode,
                        atomTxnId,
                        rawPayload: storedPayload,
                    },
                    create: {
                        paymentId: payment.id,
                        merchTxnId,
                        atomTxnId,
                        statusCode,
                        rawPayload: storedPayload,
                        idempotencyKey,
                        processed: false,
                    },
                });
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
                });
                await tx.paymentTransaction.create({
                    data: {
                        paymentId: payment.id,
                        direction: "callback",
                        responsePayload: storedPayload,
                        statusCode,
                    },
                });
                const processedCallback = await tx.paymentCallback.update({
                    where: { id: callback.id },
                    data: { processed: true },
                });
                return { callback: processedCallback, payment: updatedPayment };
            });
            if (success && statusChanged) {
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
                });
            }
            else if (!success &&
                statusChanged &&
                effectiveStatus === PaymentStatus.FAILED) {
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
                });
            }
            return {
                duplicate: false,
                callback: result.callback,
                merchTxnId,
                payment: result.payment,
            };
        }
        /**
         * Atom browser return: process payload like callback, then redirect citizen UI.
         */
        async handleGatewayReturn(payload) {
            const result = await this.handleCallback(payload);
            const merchTxnId = result.merchTxnId ??
                this.normalizeGatewayPayload(payload).merchTxnId;
            return {
                ...result,
                redirectUrl: citizenReturnRedirectUrl(merchTxnId),
                merchTxnId,
            };
        }
        async requery(paymentId, user) {
            const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId },
            });
            if (!payment?.merchTxnId)
                throw new NotFoundException("Payment not found");
            assertPaymentAccess(user, payment, "requery");
            const result = await this.provider.requery({
                merchTxnId: payment.merchTxnId,
            });
            await this.prisma.paymentTransaction.create({
                data: {
                    paymentId: payment.id,
                    direction: "requery",
                    responsePayload: result.raw,
                    statusCode: result.statusCode,
                },
            });
            const updated = await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: result.success ? PaymentStatus.SUCCESS : payment.status,
                    atomTxnId: result.atomTxnId ?? payment.atomTxnId,
                    ...(result.success && !payment.receiptNumber
                        ? {
                            receiptNumber: `RCP-${payment.merchTxnId}`,
                            collectionDate: payment.collectionDate ?? new Date(),
                        }
                        : {}),
                },
            });
            await this.audit.log({
                action: "PAYMENT_REQUERY",
                entity: "Payment",
                entityId: payment.id,
                actorId: user.id,
                newValue: { statusCode: result.statusCode },
            });
            return { payment: updated, result };
        }
        /** Public citizen return-page sync — requery gateway for PENDING payments. */
        async syncCitizenPaymentByMerchTxnId(merchTxnId) {
            const payment = await this.prisma.payment.findFirst({
                where: { merchTxnId },
            });
            if (!payment?.merchTxnId) {
                throw new NotFoundException({
                    code: "PAYMENT_NOT_FOUND",
                    message: "Payment was not found",
                });
            }
            if (payment.status === PaymentStatus.SUCCESS ||
                payment.status === PaymentStatus.FAILED ||
                payment.status === PaymentStatus.REFUNDED) {
                return payment;
            }
            const result = await this.provider.requery({
                merchTxnId: payment.merchTxnId,
            });
            await this.prisma.paymentTransaction.create({
                data: {
                    paymentId: payment.id,
                    direction: "requery",
                    responsePayload: result.raw,
                    statusCode: result.statusCode,
                },
            });
            return this.prisma.payment.update({
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
            });
        }
        async refund(paymentId, amount, reason, user) {
            const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId },
            });
            if (!payment)
                throw new NotFoundException("Payment not found");
            assertPaymentAccess(user, payment, "refund");
            if (payment.status !== PaymentStatus.SUCCESS) {
                throw new BadRequestException("Only successful payments can be refunded");
            }
            if (!payment.atomTxnId?.trim()) {
                throw new BadRequestException({
                    code: "ATOM_TXN_REQUIRED",
                    message: "Gateway transaction id is required before refund",
                });
            }
            const refundable = Number(payment.refundableAmount ?? payment.amount);
            if (amount > refundable) {
                throw new BadRequestException("Refund amount exceeds refundable balance");
            }
            const gateway = await this.provider.refund({
                merchTxnId: payment.merchTxnId ?? payment.paymentReference,
                atomTxnId: payment.atomTxnId,
                amount,
                reason,
            });
            const refund = await this.prisma.paymentRefund.create({
                data: {
                    paymentId: payment.id,
                    refundReference: `RF-${Date.now()}`,
                    amount,
                    status: gateway.success ? "SUCCESS" : "FAILED",
                    gatewayRefundId: gateway.gatewayRefundId,
                    reason,
                    rawResponse: redactSensitivePaymentPayload(gateway.raw),
                    createdById: user.id,
                },
            });
            if (!canApplyRefundToPayment(gateway.success)) {
                return refund;
            }
            const remaining = refundable - amount;
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    refundableAmount: remaining,
                    status: remaining <= 0
                        ? PaymentStatus.REFUNDED
                        : PaymentStatus.PARTIALLY_REFUNDED,
                },
            });
            return refund;
        }
        async list(query, user) {
            assertPaymentAccess(user, { id: "", collectedById: user.id }, "read");
            const page = query.page ?? 1;
            const pageSize = query.pageSize ?? 20;
            const where = {
                ...(query.status ? { status: query.status } : {}),
                ...(query.paymentMode ? { paymentMode: query.paymentMode } : {}),
                ...(query.wardId ? { wardId: query.wardId } : {}),
                ...(this.operatorPaymentScope(user) ? { collectedById: user.id } : {}),
            };
            const [total, items] = await this.prisma.$transaction([
                this.prisma.payment.count({ where }),
                this.prisma.payment.findMany({
                    where,
                    orderBy: { createdAt: "desc" },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: {
                        ward: true,
                        survey: { select: { id: true, surveyId: true, ownerName: true } },
                        collectedBy: { select: { id: true, name: true } },
                    },
                }),
            ]);
            return {
                items,
                meta: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / pageSize)),
                },
            };
        }
        async listRefunds() {
            return this.prisma.paymentRefund.findMany({
                orderBy: { createdAt: "desc" },
                take: 100,
                include: { payment: true },
            });
        }
        async listSettlements() {
            return this.prisma.paymentSettlement.findMany({
                orderBy: { createdAt: "desc" },
                take: 100,
            });
        }
        async ingestSettlement(raw) {
            return this.prisma.paymentSettlement.create({
                data: {
                    merchTxnId: raw.merchTxnId || undefined,
                    atomTxnId: raw.atomTxnId || undefined,
                    amount: raw.amount != null ? Number(raw.amount) : undefined,
                    status: raw.status || undefined,
                    settlementUtr: raw.utr || undefined,
                    settlementDate: raw.settlementDate
                        ? new Date(String(raw.settlementDate))
                        : undefined,
                    rawPayload: raw,
                },
            });
        }
        operatorPaymentScope(user) {
            return (user.roles.includes("OPERATOR") &&
                !user.roles.includes("SUPER_ADMIN") &&
                !user.roles.includes("DEPARTMENT_ADMIN") &&
                !user.roles.includes("CLERK"));
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return PaymentsService = _classThis;
})();
export { PaymentsService };
