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
import { Injectable } from "@nestjs/common";
import { pickLatestPublishedConfig, } from "../public-property-tax/dues.util";
import { aggregateTaxDemand } from "./dashboard-tax.util";
import { wardSurveyStatus } from "./ward-survey-status";
let DashboardService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DashboardService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DashboardService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        storage;
        constructor(prisma, storage) {
            this.prisma = prisma;
            this.storage = storage;
        }
        async getSummary(wardId) {
            const surveyWhere = {
                deletedAt: null,
                status: { not: "DELETED" },
                ...(wardId ? { wardId } : {}),
            };
            const paymentWhere = {
                ...(wardId ? { wardId } : {}),
            };
            const successPaymentWhere = {
                ...paymentWhere,
                status: "SUCCESS",
            };
            const [totalProperties, draftSurveys, activeSurveys, archivedSurveys, completeQuality, needsReviewQuality, totalCollectionAgg, onlineCollectionAgg, offlineCollectionAgg, pendingPayments, successPayments, failedPayments, pendingCollectionAgg, byWard, paymentsByWard, pendingByWard, recentAttachments, wards, taxSurveys, publishedConfigs,] = await Promise.all([
                this.prisma.survey.count({ where: surveyWhere }),
                this.prisma.survey.count({
                    where: { ...surveyWhere, status: "DRAFT" },
                }),
                this.prisma.survey.count({
                    where: { ...surveyWhere, status: "ACTIVE" },
                }),
                this.prisma.survey.count({
                    where: { ...surveyWhere, status: "ARCHIVED" },
                }),
                this.prisma.survey.count({
                    where: { ...surveyWhere, dataQualityStatus: "COMPLETE" },
                }),
                this.prisma.survey.count({
                    where: { ...surveyWhere, dataQualityStatus: "NEEDS_REVIEW" },
                }),
                this.prisma.payment.aggregate({
                    where: successPaymentWhere,
                    _sum: { amount: true },
                }),
                this.prisma.payment.aggregate({
                    where: { ...successPaymentWhere, paymentMode: "ONLINE" },
                    _sum: { amount: true },
                }),
                this.prisma.payment.aggregate({
                    where: {
                        ...successPaymentWhere,
                        paymentMode: { not: "ONLINE" },
                    },
                    _sum: { amount: true },
                }),
                this.prisma.payment.count({
                    where: {
                        ...paymentWhere,
                        status: { in: ["PENDING", "INITIATED"] },
                    },
                }),
                this.prisma.payment.count({
                    where: successPaymentWhere,
                }),
                this.prisma.payment.count({
                    where: { ...paymentWhere, status: "FAILED" },
                }),
                this.prisma.payment.aggregate({
                    where: {
                        ...paymentWhere,
                        status: { in: ["PENDING", "INITIATED"] },
                    },
                    _sum: { amount: true },
                }),
                this.prisma.survey.groupBy({
                    by: ["wardId"],
                    where: surveyWhere,
                    _count: { _all: true },
                }),
                this.prisma.payment.groupBy({
                    by: ["wardId", "paymentMode"],
                    where: { ...successPaymentWhere, wardId: { not: null } },
                    _sum: { amount: true },
                    _count: { _all: true },
                }),
                this.prisma.payment.groupBy({
                    by: ["wardId"],
                    where: {
                        ...paymentWhere,
                        wardId: { not: null },
                        status: { in: ["PENDING", "INITIATED"] },
                    },
                    _sum: { amount: true },
                }),
                this.prisma.surveyAttachment.findMany({
                    where: wardId
                        ? { survey: { wardId, deletedAt: null } }
                        : { survey: { deletedAt: null } },
                    orderBy: { createdAt: "desc" },
                    take: 8,
                    include: {
                        survey: {
                            select: { id: true, surveyId: true, ownerName: true },
                        },
                    },
                }),
                this.prisma.ward.findMany({
                    where: { isActive: true, ...(wardId ? { id: wardId } : {}) },
                    orderBy: { number: "asc" },
                }),
                this.prisma.survey.findMany({
                    where: surveyWhere,
                    select: {
                        id: true,
                        surveyId: true,
                        wardId: true,
                        propertyUse: true,
                        taxRateZone: true,
                        hasMunicipalWaterSupply: true,
                        plotAreaSqFt: true,
                        plinthAreaSqFt: true,
                        totalBuiltUpAreaSqFt: true,
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
                }),
                this.prisma.taxConfig.findMany({
                    where: {
                        status: "PUBLISHED",
                        ...(wardId ? { wardId } : {}),
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
                }),
            ]);
            const countByWard = new Map(byWard.map((w) => [w.wardId, w._count._all]));
            const pendingByWardMap = new Map(pendingByWard.map((w) => [w.wardId ?? "", Number(w._sum.amount ?? 0)]));
            const moneyByWard = new Map();
            for (const row of paymentsByWard) {
                if (!row.wardId)
                    continue;
                const current = moneyByWard.get(row.wardId) ?? {
                    online: 0,
                    offline: 0,
                    total: 0,
                };
                const amount = Number(row._sum.amount ?? 0);
                if (row.paymentMode === "ONLINE") {
                    current.online += amount;
                }
                else {
                    current.offline += amount;
                }
                current.total += amount;
                moneyByWard.set(row.wardId, current);
            }
            const wardsWithSurveys = wards.filter((w) => (countByWard.get(w.id) ?? 0) > 0).length;
            // Wards not yet surveyed (survey work remaining), not "tax not calculated".
            const wardsInProgress = wards.length - wardsWithSurveys;
            const onlineCollection = Number(onlineCollectionAgg._sum.amount ?? 0);
            const offlineCollection = Number(offlineCollectionAgg._sum.amount ?? 0);
            const totalCollection = Number(totalCollectionAgg._sum.amount ?? 0);
            const pendingCollection = Number(pendingCollectionAgg._sum.amount ?? 0);
            const configsByWardId = new Map();
            for (const config of publishedConfigs) {
                const list = configsByWardId.get(config.wardId) ?? [];
                list.push(config);
                configsByWardId.set(config.wardId, list);
            }
            const taxDemand = aggregateTaxDemand({
                wardIds: wards.map((w) => w.id),
                surveys: taxSurveys,
                configsByWardId,
            });
            const attachmentsWithUrls = await Promise.all(recentAttachments.map(async (a) => {
                let url = null;
                try {
                    if (a.mimeType.startsWith("image/")) {
                        url = await this.storage.getSignedUrl(a.objectKey, 600);
                    }
                }
                catch {
                    url = null;
                }
                return {
                    id: a.id,
                    originalFileName: a.originalFileName,
                    mimeType: a.mimeType,
                    createdAt: a.createdAt,
                    url,
                    survey: a.survey,
                };
            }));
            const wardBreakdown = wards.map((w) => {
                const surveyCount = countByWard.get(w.id) ?? 0;
                const money = moneyByWard.get(w.id) ?? {
                    online: 0,
                    offline: 0,
                    total: 0,
                };
                const pendingCollectionWard = pendingByWardMap.get(w.id) ?? 0;
                const demand = taxDemand.byWard.get(w.id);
                const published = configsByWardId.get(w.id) ?? [];
                const latest = pickLatestPublishedConfig(published);
                return {
                    wardId: w.id,
                    number: w.number,
                    code: w.code,
                    name: w.name,
                    surveyCount,
                    onlineCollection: money.online,
                    offlineCollection: money.offline,
                    pendingCollection: pendingCollectionWard,
                    totalCollection: money.total,
                    propertyTaxDemand: demand?.propertyTaxDemand ?? 0,
                    waterTaxDemand: demand?.waterTaxDemand ?? 0,
                    drainageTaxDemand: demand?.drainageTaxDemand ?? 0,
                    totalTaxDemand: demand?.totalTaxDemand ?? 0,
                    propertyTaxPct: demand?.propertyTaxPct ?? 0,
                    waterTaxPct: demand?.waterTaxPct ?? 0,
                    drainageTaxPct: demand?.drainageTaxPct ?? 0,
                    surveyedWithDemand: demand?.surveyedWithDemand ?? 0,
                    skippedSurveys: demand?.skippedSurveys ?? 0,
                    assessmentYearName: latest?.assessmentYear.name ?? null,
                    status: wardSurveyStatus(surveyCount),
                };
            });
            return {
                success: true,
                data: {
                    totalProperties,
                    draftSurveys,
                    activeSurveys,
                    archivedSurveys,
                    completeQuality,
                    needsReviewQuality,
                    totalWards: wards.length,
                    wardsWithSurveys,
                    wardsInProgress,
                    totalCollection,
                    onlineCollection,
                    offlineCollection,
                    pendingCollection,
                    pendingPayments,
                    successPayments,
                    failedPayments,
                    propertyTaxDemand: taxDemand.propertyTaxDemand,
                    waterTaxDemand: taxDemand.waterTaxDemand,
                    drainageTaxDemand: taxDemand.drainageTaxDemand,
                    totalTaxDemand: taxDemand.totalTaxDemand,
                    propertyTaxPct: taxDemand.propertyTaxPct,
                    waterTaxPct: taxDemand.waterTaxPct,
                    drainageTaxPct: taxDemand.drainageTaxPct,
                    recentAttachments: attachmentsWithUrls,
                    wardBreakdown,
                },
            };
        }
    };
    return DashboardService = _classThis;
})();
export { DashboardService };
