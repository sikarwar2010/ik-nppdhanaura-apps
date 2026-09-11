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
import { BadRequestException, ConflictException, Injectable, NotFoundException, } from "@nestjs/common";
import { computeGisPreviewDemand } from "../tax/tax-calc";
function toNumber(value) {
    return typeof value === "number" ? value : Number(value);
}
let TaxConfigsService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TaxConfigsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TaxConfigsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        audit;
        constructor(prisma, audit) {
            this.prisma = prisma;
            this.audit = audit;
        }
        include = {
            cells: {
                include: {
                    roadWidthEntry: true,
                    constructionEntry: true,
                },
            },
            assessmentYear: true,
            ward: true,
        };
        async getOrCreate(wardId, assessmentYearId, actorId) {
            const existing = await this.prisma.taxConfig.findUnique({
                where: { wardId_assessmentYearId: { wardId, assessmentYearId } },
                include: this.include,
            });
            if (existing)
                return existing;
            const ward = await this.prisma.ward.findUnique({ where: { id: wardId } });
            if (!ward)
                throw new NotFoundException("Ward not found");
            const ay = await this.prisma.referenceEntry.findUnique({
                where: { id: assessmentYearId },
            });
            if (!ay)
                throw new NotFoundException("Assessment year not found");
            const created = await this.prisma.taxConfig.create({
                data: {
                    wardId,
                    assessmentYearId,
                    status: "DRAFT",
                },
                include: this.include,
            });
            await this.ensureMatrixCells(created.id);
            const full = await this.prisma.taxConfig.findUniqueOrThrow({
                where: { id: created.id },
                include: this.include,
            });
            await this.audit.log({
                action: "CREATE",
                entity: "TaxConfig",
                entityId: full.id,
                newValue: { wardId, assessmentYearId },
                actorId,
            });
            return full;
        }
        async getPublishedForWard(wardId, assessmentYearId) {
            const config = await this.prisma.taxConfig.findUnique({
                where: { wardId_assessmentYearId: { wardId, assessmentYearId } },
                include: this.include,
            });
            if (!config || config.status !== "PUBLISHED") {
                throw new ConflictException("No published tax configuration for this ward and assessment year. Configure and publish rates on Reports first.");
            }
            return config;
        }
        async ensureMatrixCells(taxConfigId) {
            const [roads, constructions] = await Promise.all([
                this.prisma.referenceEntry.findMany({
                    where: { category: { code: "TAX_RATE_ZONE" }, status: "ACTIVE" },
                    orderBy: { sortOrder: "asc" },
                }),
                this.prisma.referenceEntry.findMany({
                    where: { category: { code: "CONSTRUCTION_TYPE" }, status: "ACTIVE" },
                    orderBy: { sortOrder: "asc" },
                }),
            ]);
            for (const road of roads) {
                for (const construction of constructions) {
                    await this.prisma.taxRateCell.upsert({
                        where: {
                            taxConfigId_roadWidthEntryId_constructionEntryId: {
                                taxConfigId,
                                roadWidthEntryId: road.id,
                                constructionEntryId: construction.id,
                            },
                        },
                        create: {
                            taxConfigId,
                            roadWidthEntryId: road.id,
                            constructionEntryId: construction.id,
                            annualRatePerSqFt: 0,
                        },
                        update: {},
                    });
                }
            }
        }
        async updateParams(id, dto, actorId) {
            const existing = await this.prisma.taxConfig.findUnique({ where: { id } });
            if (!existing)
                throw new NotFoundException("Tax config not found");
            if (existing.status === "ARCHIVED") {
                throw new BadRequestException("Cannot edit archived tax config");
            }
            const updated = await this.prisma.taxConfig.update({
                where: { id },
                data: {
                    propertyTaxPct: dto.propertyTaxPct,
                    waterTaxPct: dto.waterTaxPct,
                    drainageTaxPct: dto.drainageTaxPct,
                    penaltyPct: dto.penaltyPct,
                    assessablePct: dto.assessablePct,
                    commercialAssessablePct: dto.commercialAssessablePct,
                    status: "DRAFT",
                },
                include: this.include,
            });
            await this.audit.log({
                action: "UPDATE_PARAMS",
                entity: "TaxConfig",
                entityId: id,
                oldValue: existing,
                newValue: updated,
                metadata: dto.reason ? { reason: dto.reason } : undefined,
                actorId,
            });
            return updated;
        }
        async upsertCells(id, cells, actorId) {
            const existing = await this.prisma.taxConfig.findUnique({ where: { id } });
            if (!existing)
                throw new NotFoundException("Tax config not found");
            for (const cell of cells) {
                await this.prisma.taxRateCell.upsert({
                    where: {
                        taxConfigId_roadWidthEntryId_constructionEntryId: {
                            taxConfigId: id,
                            roadWidthEntryId: cell.roadWidthEntryId,
                            constructionEntryId: cell.constructionEntryId,
                        },
                    },
                    create: {
                        taxConfigId: id,
                        roadWidthEntryId: cell.roadWidthEntryId,
                        constructionEntryId: cell.constructionEntryId,
                        annualRatePerSqFt: cell.annualRatePerSqFt,
                    },
                    update: {
                        annualRatePerSqFt: cell.annualRatePerSqFt,
                    },
                });
            }
            await this.prisma.taxConfig.update({
                where: { id },
                data: { status: "DRAFT" },
            });
            await this.audit.log({
                action: "UPSERT_CELLS",
                entity: "TaxConfig",
                entityId: id,
                newValue: { cells },
                actorId,
            });
            return this.prisma.taxConfig.findUniqueOrThrow({
                where: { id },
                include: this.include,
            });
        }
        async copyToAllWards(dto, actorId) {
            const source = await this.getOrCreate(dto.sourceWardId, dto.assessmentYearId, actorId);
            const cells = source.cells.map((c) => ({
                roadWidthEntryId: c.roadWidthEntryId,
                constructionEntryId: c.constructionEntryId,
                annualRatePerSqFt: toNumber(c.annualRatePerSqFt),
            }));
            const wards = await this.prisma.ward.findMany({
                where: { isActive: true },
                select: { id: true },
            });
            let updated = 0;
            for (const ward of wards) {
                if (ward.id === dto.sourceWardId)
                    continue;
                const config = await this.getOrCreate(ward.id, dto.assessmentYearId, actorId);
                await this.upsertCells(config.id, cells, actorId);
                await this.updateParams(config.id, {
                    propertyTaxPct: toNumber(source.propertyTaxPct),
                    waterTaxPct: toNumber(source.waterTaxPct),
                    drainageTaxPct: toNumber(source.drainageTaxPct),
                    penaltyPct: toNumber(source.penaltyPct),
                    assessablePct: toNumber(source.assessablePct),
                    commercialAssessablePct: toNumber(source.commercialAssessablePct),
                }, actorId);
                updated += 1;
            }
            return { updated };
        }
        async preview(dto) {
            const config = await this.getOrCreate(dto.wardId, dto.assessmentYearId);
            const cell = config.cells.find((c) => c.roadWidthEntryId === dto.roadWidthEntryId &&
                c.constructionEntryId === dto.constructionEntryId);
            const baseMonthlyRate = cell ? toNumber(cell.annualRatePerSqFt) : 0;
            const assessablePct = toNumber(config.assessablePct);
            const commercialAssessablePct = toNumber(config.commercialAssessablePct);
            const propertyTaxPct = toNumber(config.propertyTaxPct);
            const waterTaxPct = toNumber(config.waterTaxPct);
            const drainageTaxPct = toNumber(config.drainageTaxPct);
            const penaltyPct = toNumber(config.penaltyPct);
            const preview = computeGisPreviewDemand({
                areaSqFt: dto.areaSqFt,
                baseMonthlyRate,
                gisUseCode: dto.gisUseCode ?? "R",
                assessablePct,
                commercialAssessablePct,
                propertyTaxPct,
                waterTaxPct,
                drainageTaxPct,
                penaltyPct,
            });
            return {
                inputs: dto,
                rates: {
                    annualRate: preview.effectiveMonthlyRate,
                    assessablePct: preview.assessablePct,
                    commercialAssessablePct,
                    propertyTaxPct,
                    waterTaxPct,
                    drainageTaxPct,
                    penaltyPct,
                },
                calculation: {
                    grossAlv: preview.grossAlv,
                    assessableAlv: preview.assessableAlv,
                    propertyTax: preview.propertyTax,
                    waterTax: preview.waterTax,
                    drainageTax: preview.drainageTax,
                    penalty: preview.penalty,
                    demand: preview.demand,
                },
            };
        }
        async listVersions(taxConfigId) {
            return this.prisma.taxConfigVersion.findMany({
                where: { taxConfigId },
                orderBy: { version: "desc" },
            });
        }
        async publish(id, dto, actorId) {
            const config = await this.prisma.taxConfig.findUnique({
                where: { id },
                include: this.include,
            });
            if (!config)
                throw new NotFoundException("Tax config not found");
            const nextVersion = config.version + (config.status === "PUBLISHED" ? 1 : 0);
            const snapshot = {
                params: {
                    propertyTaxPct: toNumber(config.propertyTaxPct),
                    waterTaxPct: toNumber(config.waterTaxPct),
                    drainageTaxPct: toNumber(config.drainageTaxPct),
                    penaltyPct: toNumber(config.penaltyPct),
                    assessablePct: toNumber(config.assessablePct),
                    commercialAssessablePct: toNumber(config.commercialAssessablePct),
                },
                cells: config.cells.map((c) => ({
                    roadWidthEntryId: c.roadWidthEntryId,
                    constructionEntryId: c.constructionEntryId,
                    annualRatePerSqFt: toNumber(c.annualRatePerSqFt),
                })),
            };
            const versionRow = await this.prisma.taxConfigVersion.create({
                data: {
                    taxConfigId: id,
                    version: nextVersion || config.version,
                    snapshot,
                    reason: dto.reason,
                    createdById: actorId,
                },
            });
            const published = await this.prisma.taxConfig.update({
                where: { id },
                data: {
                    status: "PUBLISHED",
                    version: versionRow.version,
                    publishedAt: new Date(),
                    publishedById: actorId,
                    changeReason: dto.reason,
                    effectiveFrom: dto.effectiveFrom
                        ? new Date(dto.effectiveFrom)
                        : undefined,
                },
                include: this.include,
            });
            await this.audit.log({
                action: "PUBLISH",
                entity: "TaxConfig",
                entityId: id,
                newValue: { version: versionRow.version },
                metadata: dto.reason ? { reason: dto.reason } : undefined,
                actorId,
            });
            return published;
        }
    };
    return TaxConfigsService = _classThis;
})();
export { TaxConfigsService };
