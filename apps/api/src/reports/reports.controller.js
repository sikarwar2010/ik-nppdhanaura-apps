var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
import { Controller, Get } from "@nestjs/common";
import { RequirePermission } from "../auth/auth.decorators";
import { buildSurveyExportFilename, buildSurveyExportWorkbook, detectExportPreset, } from "../imports/survey-excel-export";
import { buildWardTaxReportWorkbook, taxConfigToRateTable, } from "./ward-tax-report-excel";
const EXPORT_ROW_LIMIT = 50_000;
let ReportsController = (() => {
    let _classDecorators = [Controller("api/v1/reports")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _surveyReport_decorators;
    let _paymentReport_decorators;
    let _exportSurveys_decorators;
    var ReportsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _surveyReport_decorators = [Get("surveys"), RequirePermission("report:read")];
            _paymentReport_decorators = [Get("payments"), RequirePermission("report:read")];
            _exportSurveys_decorators = [Get("surveys/export"), RequirePermission("report:export")];
            __esDecorate(this, null, _surveyReport_decorators, { kind: "method", name: "surveyReport", static: false, private: false, access: { has: obj => "surveyReport" in obj, get: obj => obj.surveyReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _paymentReport_decorators, { kind: "method", name: "paymentReport", static: false, private: false, access: { has: obj => "paymentReport" in obj, get: obj => obj.paymentReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _exportSurveys_decorators, { kind: "method", name: "exportSurveys", static: false, private: false, access: { has: obj => "exportSurveys" in obj, get: obj => obj.exportSurveys }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ReportsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma = __runInitializers(this, _instanceExtraInitializers);
        taxConfigs;
        constructor(prisma, taxConfigs) {
            this.prisma = prisma;
            this.taxConfigs = taxConfigs;
        }
        async surveyReport(wardId, propertyUse, from, to) {
            const where = {
                deletedAt: null,
                status: { not: "DELETED" },
                ...(wardId ? { wardId } : {}),
                ...(propertyUse ? { propertyUse } : {}),
                ...(from || to
                    ? {
                        surveyedAt: {
                            ...(from ? { gte: new Date(from) } : {}),
                            ...(to ? { lte: new Date(to) } : {}),
                        },
                    }
                    : {}),
            };
            const [total, byWard, byUse] = await Promise.all([
                this.prisma.survey.count({ where }),
                this.prisma.survey.groupBy({
                    by: ["wardId"],
                    where,
                    _count: { _all: true },
                }),
                this.prisma.survey.groupBy({
                    by: ["propertyUse"],
                    where,
                    _count: { _all: true },
                }),
            ]);
            return {
                success: true,
                data: {
                    total,
                    byWard,
                    byUse,
                },
            };
        }
        async paymentReport(wardId, from, to) {
            const where = {
                ...(wardId ? { wardId } : {}),
                ...(from || to
                    ? {
                        createdAt: {
                            ...(from ? { gte: new Date(from) } : {}),
                            ...(to ? { lte: new Date(to) } : {}),
                        },
                    }
                    : {}),
            };
            const [byStatus, byMode, sumSuccess] = await Promise.all([
                this.prisma.payment.groupBy({
                    by: ["status"],
                    where,
                    _count: { _all: true },
                    _sum: { amount: true },
                }),
                this.prisma.payment.groupBy({
                    by: ["paymentMode"],
                    where,
                    _count: { _all: true },
                    _sum: { amount: true },
                }),
                this.prisma.payment.aggregate({
                    where: { ...where, status: "SUCCESS" },
                    _sum: { amount: true },
                    _count: { _all: true },
                }),
            ]);
            return {
                success: true,
                data: {
                    byStatus,
                    byMode,
                    successTotal: Number(sumSuccess._sum.amount ?? 0),
                    successCount: sumSuccess._count._all,
                },
            };
        }
        async exportSurveys(res, wardId, assessmentYearId, propertyUse, from, to, template) {
            const ward = wardId
                ? await this.prisma.ward.findUnique({ where: { id: wardId } })
                : null;
            const surveys = await this.prisma.survey.findMany({
                where: {
                    deletedAt: null,
                    status: { not: "DELETED" },
                    ...(wardId ? { wardId } : {}),
                    ...(propertyUse ? { propertyUse } : {}),
                    ...(from || to
                        ? {
                            surveyedAt: {
                                ...(from ? { gte: new Date(from) } : {}),
                                ...(to ? { lte: new Date(to) } : {}),
                            },
                        }
                        : {}),
                },
                include: {
                    ward: true,
                    floors: { orderBy: { sortOrder: "asc" } },
                },
                orderBy: [
                    { ward: { number: "asc" } },
                    { parcelNo: "asc" },
                    { surveyId: "asc" },
                ],
                take: EXPORT_ROW_LIMIT,
            });
            if (template === "import") {
                const preset = detectExportPreset(ward?.number);
                const workbook = buildSurveyExportWorkbook(surveys, preset);
                const filename = buildSurveyExportFilename({ wardNumber: ward?.number });
                res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
                await workbook.xlsx.write(res);
                res.end();
                return;
            }
            if (!wardId || !assessmentYearId) {
                res.status(400).json({
                    success: false,
                    message: "wardId and assessmentYearId are required for tax demand export. Use template=import for import-mirror layout.",
                });
                return;
            }
            const taxConfig = await this.taxConfigs.getPublishedForWard(wardId, assessmentYearId);
            const rates = taxConfigToRateTable(taxConfig);
            const workbook = buildWardTaxReportWorkbook({
                wardName: ward?.name ?? `Ward ${ward?.number ?? ""}`,
                surveys,
                rates,
            });
            const filename = `ward-tax-report-${ward?.number ?? "all"}.xlsx`;
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            await workbook.xlsx.write(res);
            res.end();
        }
    };
    return ReportsController = _classThis;
})();
export { ReportsController };
