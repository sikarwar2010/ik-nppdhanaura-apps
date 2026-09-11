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
import { parseGisSurveyId } from "@workspace/types";
import { assertSurveyAccess } from "../auth/resource-access";
import { computeDataQuality, parseFloorsRaw } from "./floors.util";
import { diffSurveyChanges, surveyToAuditSnapshot, } from "./survey-audit.util";
import { assertSurveyIdAvailable, repairSurveyIdIfNeeded, resolveSurveyIdentity, verifySurveyIdMatchesRecord, } from "./survey-id.util";
import { buildSurveySearchOr } from "./survey-search.util";
let SurveysService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SurveysService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SurveysService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        audit;
        storage;
        constructor(prisma, audit, storage) {
            this.prisma = prisma;
            this.audit = audit;
            this.storage = storage;
        }
        async create(dto, user) {
            assertSurveyAccess(user, { id: "", wardId: dto.wardId ?? "", createdById: user.id }, "create");
            if (!dto.wardId) {
                throw new BadRequestException({
                    code: "WARD_REQUIRED",
                    message: "Ward is required",
                });
            }
            this.assertCreateIdentityFields(dto);
            const ward = await this.prisma.ward.findUnique({
                where: { id: dto.wardId },
            });
            if (!ward) {
                throw new NotFoundException({
                    code: "WARD_NOT_FOUND",
                    message: "Ward not found",
                });
            }
            const identity = resolveSurveyIdentity(ward, dto);
            if (dto.surveyId &&
                dto.surveyId.trim() !== identity.surveyId) {
                throw new BadRequestException({
                    code: "SURVEY_ID_MISMATCH",
                    message: `Survey ID must match generated value ${identity.surveyId}`,
                });
            }
            const existing = await this.prisma.survey.findUnique({
                where: { surveyId: identity.surveyId },
            });
            if (existing && !existing.deletedAt) {
                throw new ConflictException({
                    code: "SURVEY_EXISTS",
                    message: "A survey already exists for this ULB, ward, parcel, property and GIS use code.",
                });
            }
            const floors = parseFloorsRaw(dto.floorsRaw);
            const dataQualityStatus = dto.dataQualityStatus ??
                computeDataQuality({
                    mobile: dto.mobile,
                    propertyNo: identity.propertyNo,
                    parcelNo: identity.parcelNo,
                    plotAreaSqFt: dto.plotAreaSqFt,
                    totalBuiltUpAreaSqFt: dto.totalBuiltUpAreaSqFt,
                });
            const survey = await this.prisma.survey.create({
                data: {
                    ...this.toPrismaCreateData(dto, identity),
                    dataQualityStatus,
                    createdById: user.id,
                    updatedById: user.id,
                    floors: {
                        create: floors.map((f) => ({
                            floorLabel: f.floorLabel,
                            areaSqFt: f.areaSqFt,
                            areaSqMeter: f.areaSqMeter,
                            usageType: f.usageType,
                            usageFactor: f.usageFactor,
                            buildingType: f.buildingType,
                            sortOrder: f.sortOrder,
                            rawSegment: f.rawSegment,
                        })),
                    },
                },
                include: this.defaultInclude(),
            });
            await this.audit.log({
                action: "SURVEY_CREATED",
                entity: "Survey",
                entityId: survey.id,
                actorId: user.id,
                newValue: {
                    changes: [
                        { field: "surveyId", old: null, new: survey.surveyId },
                        { field: "parcelNo", old: null, new: survey.parcelNo },
                        { field: "propertyNo", old: null, new: survey.propertyNo },
                        { field: "gisUseCode", old: null, new: identity.gisUseCode },
                    ],
                },
            });
            return survey;
        }
        async findAll(query, user) {
            assertSurveyAccess(user, { id: "", wardId: query.wardId ?? "", createdById: user.id }, "read");
            const page = query.page ?? 1;
            const pageSize = query.pageSize ?? 20;
            const where = this.buildWhere(query);
            const sortable = new Set([
                "createdAt",
                "surveyedAt",
                "surveyId",
                "ownerName",
                "mobile",
                "status",
                "parcelNo",
                "propertyNo",
            ]);
            const sortBy = sortable.has(query.sortBy ?? "")
                ? query.sortBy
                : "parcelNo";
            const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";
            const orderBy = sortBy === "parcelNo"
                ? [
                    { ward: { number: "asc" } },
                    { surveyId: sortOrder },
                    { parcelNo: sortOrder },
                ]
                : [{ [sortBy]: sortOrder }];
            const [total, items] = await this.prisma.$transaction([
                this.prisma.survey.count({ where }),
                this.prisma.survey.findMany({
                    where,
                    include: {
                        ward: true,
                        createdBy: { select: { id: true, name: true, email: true } },
                    },
                    orderBy,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                }),
            ]);
            const canonicalItems = await this.ensureCanonicalSurveyIds(items);
            return {
                items: canonicalItems,
                meta: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / pageSize)),
                },
            };
        }
        async findOne(id, user) {
            const survey = await this.prisma.survey.findFirst({
                where: { OR: [{ id }, { surveyId: id }], deletedAt: null },
                include: this.defaultInclude(),
            });
            if (!survey) {
                throw new NotFoundException({
                    code: "SURVEY_NOT_FOUND",
                    message: "Survey not found",
                });
            }
            assertSurveyAccess(user, survey, "read");
            return this.ensureCanonicalSurveyId(survey);
        }
        async findNeighbors(survey) {
            const whereBase = {
                wardId: survey.wardId,
                deletedAt: null,
                status: { not: "DELETED" },
                id: { not: survey.id },
            };
            const [previous, next] = await Promise.all([
                this.prisma.survey.findFirst({
                    where: { ...whereBase, surveyId: { lt: survey.surveyId } },
                    orderBy: { surveyId: "desc" },
                    select: { id: true, surveyId: true },
                }),
                this.prisma.survey.findFirst({
                    where: { ...whereBase, surveyId: { gt: survey.surveyId } },
                    orderBy: { surveyId: "asc" },
                    select: { id: true, surveyId: true },
                }),
            ]);
            return { previous, next };
        }
        async update(id, dto, user) {
            const current = await this.findOne(id, user);
            assertSurveyAccess(user, current, "update");
            const beforeAudit = this.buildAuditState(current);
            const targetWardId = dto.wardId ?? current.wardId;
            const ward = await this.prisma.ward.findUnique({
                where: { id: targetWardId },
            });
            if (!ward) {
                throw new NotFoundException({
                    code: "WARD_NOT_FOUND",
                    message: "Ward not found",
                });
            }
            const identityInput = this.mergeIdentityInput(dto, current);
            const identity = resolveSurveyIdentity(ward, identityInput, current);
            if (dto.surveyId !== undefined &&
                dto.surveyId.trim() !== identity.surveyId) {
                throw new BadRequestException({
                    code: "SURVEY_ID_READ_ONLY",
                    message: "Survey ID is system-generated and cannot be edited directly",
                });
            }
            const floorsRaw = dto.floorsRaw !== undefined ? dto.floorsRaw : current.floorsRaw;
            const floors = parseFloorsRaw(floorsRaw);
            const survey = await this.prisma.$transaction(async (tx) => {
                if (identity.surveyId !== current.surveyId) {
                    await assertSurveyIdAvailable(tx, identity.surveyId, current.id);
                }
                if (dto.floorsRaw !== undefined) {
                    await tx.surveyFloor.deleteMany({ where: { surveyId: current.id } });
                }
                const updateData = this.toPrismaUpdateData(dto, current, identity);
                return tx.survey.update({
                    where: { id: current.id },
                    data: {
                        ...updateData,
                        dataQualityStatus: dto.dataQualityStatus ??
                            computeDataQuality({
                                mobile: dto.mobile !== undefined ? dto.mobile : current.mobile,
                                propertyNo: identity.propertyNo,
                                parcelNo: identity.parcelNo,
                                plotAreaSqFt: dto.plotAreaSqFt ??
                                    (current.plotAreaSqFt
                                        ? Number(current.plotAreaSqFt)
                                        : null),
                                totalBuiltUpAreaSqFt: dto.totalBuiltUpAreaSqFt ??
                                    (current.totalBuiltUpAreaSqFt
                                        ? Number(current.totalBuiltUpAreaSqFt)
                                        : null),
                            }),
                        updatedById: user.id,
                        ...(dto.floorsRaw !== undefined
                            ? {
                                floors: {
                                    create: floors.map((f) => ({
                                        floorLabel: f.floorLabel,
                                        areaSqFt: f.areaSqFt,
                                        areaSqMeter: f.areaSqMeter,
                                        usageType: f.usageType,
                                        usageFactor: f.usageFactor,
                                        buildingType: f.buildingType,
                                        sortOrder: f.sortOrder,
                                        rawSegment: f.rawSegment,
                                    })),
                                },
                            }
                            : {}),
                    },
                    include: this.defaultInclude(),
                });
            });
            const afterAudit = this.buildAuditState(survey);
            const auditDiff = diffSurveyChanges(beforeAudit, afterAudit);
            if (auditDiff.changes.length > 0) {
                await this.audit.log({
                    action: "SURVEY_UPDATED",
                    entity: "Survey",
                    entityId: survey.id,
                    actorId: user.id,
                    oldValue: {
                        changes: auditDiff.changes.map((c) => ({
                            field: c.field,
                            value: c.old,
                        })),
                    },
                    newValue: { changes: auditDiff.changes },
                });
            }
            return survey;
        }
        async remove(id, user) {
            const current = await this.findOne(id, user);
            assertSurveyAccess(user, current, "delete");
            const survey = await this.prisma.survey.update({
                where: { id: current.id },
                data: {
                    status: "DELETED",
                    deletedAt: new Date(),
                    updatedById: user.id,
                },
            });
            await this.audit.log({
                action: "SURVEY_DELETED",
                entity: "Survey",
                entityId: survey.id,
                actorId: user.id,
                oldValue: { surveyId: current.surveyId },
            });
            return survey;
        }
        assertCreateIdentityFields(dto) {
            if (!dto.parcelNo?.trim()) {
                throw new BadRequestException({
                    code: "PARCEL_REQUIRED",
                    message: "Parcel number is required",
                });
            }
            if (!dto.propertyNo?.trim()) {
                throw new BadRequestException({
                    code: "PROPERTY_REQUIRED",
                    message: "Property number is required",
                });
            }
            if (!dto.gisUseCode?.trim()) {
                throw new BadRequestException({
                    code: "GIS_USE_CODE_REQUIRED",
                    message: "GIS use code is required",
                });
            }
        }
        mergeIdentityInput(dto, current) {
            const parsed = parseGisSurveyId(current.surveyId);
            return {
                surveyId: current.surveyId,
                wardId: dto.wardId ?? current.wardId,
                parcelNo: dto.parcelNo ?? current.parcelNo ?? undefined,
                propertyNo: dto.propertyNo ?? current.propertyNo ?? undefined,
                gisUseCode: dto.gisUseCode ?? parsed?.gisUseCode,
            };
        }
        buildAuditState(survey) {
            const parsed = parseGisSurveyId(survey.surveyId);
            return surveyToAuditSnapshot(survey, { gisUseCode: parsed?.gisUseCode ?? null });
        }
        buildWhere(query) {
            const where = {
                deletedAt: null,
                status: query.status ?? { not: "DELETED" },
            };
            if (query.wardId)
                where.wardId = query.wardId;
            if (query.propertyUse)
                where.propertyUse = query.propertyUse;
            if (query.propertyOwnership)
                where.propertyOwnership = query.propertyOwnership;
            if (query.taxRateZone)
                where.taxRateZone = query.taxRateZone;
            if (query.locality)
                where.locality = { contains: query.locality, mode: "insensitive" };
            if (query.colony)
                where.colony = { contains: query.colony, mode: "insensitive" };
            if (typeof query.isSlum === "boolean")
                where.isSlum = query.isSlum;
            if (query.commercial)
                where.commercial = query.commercial;
            if (query.dataQualityStatus)
                where.dataQualityStatus = query.dataQualityStatus;
            if (query.surveyedFrom || query.surveyedTo) {
                where.surveyedAt = {};
                if (query.surveyedFrom)
                    where.surveyedAt.gte = new Date(query.surveyedFrom);
                if (query.surveyedTo)
                    where.surveyedAt.lte = new Date(query.surveyedTo);
            }
            if (query.search?.trim()) {
                where.OR = buildSurveySearchOr(query.search);
            }
            return where;
        }
        toPrismaCreateData(dto, identity) {
            return {
                surveyId: identity.surveyId,
                wardId: dto.wardId,
                parcelNo: identity.parcelNo,
                propertyNo: identity.propertyNo,
                surveyedAt: dto.surveyedAt ? new Date(dto.surveyedAt) : undefined,
                ownerName: dto.ownerName,
                ownerFatherName: dto.ownerFatherName,
                mobile: dto.mobile,
                ownerAadhaar: dto.ownerAadhaar,
                isSlum: dto.isSlum ?? false,
                remark: dto.remark,
                electricityId: dto.electricityId,
                khasraNo: dto.khasraNo,
                registryNo: dto.registryNo,
                constructedDate: dto.constructedDate,
                respondentName: dto.respondentName,
                respondentRelationship: dto.respondentRelationship,
                city: dto.city,
                pincode: dto.pincode,
                houseNo: dto.houseNo,
                streetName: dto.streetName,
                locality: dto.locality,
                colony: dto.colony,
                presentHouseNo: dto.presentHouseNo,
                presentStreetName: dto.presentStreetName,
                presentLocality: dto.presentLocality,
                presentColony: dto.presentColony,
                presentCity: dto.presentCity,
                presentPincode: dto.presentPincode,
                isSameAsProperty: dto.isSameAsProperty,
                taxRateZone: dto.taxRateZone,
                propertyOwnership: dto.propertyOwnership,
                propertyUse: dto.propertyUse,
                commercial: dto.commercial,
                yearOfConstruction: dto.yearOfConstruction,
                exemptionType: dto.exemptionType,
                exemptionApplicable: dto.exemptionApplicable,
                situation: dto.situation,
                roadType: dto.roadType,
                floorsRaw: dto.floorsRaw,
                plotAreaSqFt: dto.plotAreaSqFt,
                plotAreaSqMeter: dto.plotAreaSqMeter,
                plinthAreaSqFt: dto.plinthAreaSqFt,
                plinthAreaSqMeter: dto.plinthAreaSqMeter,
                totalBuiltUpAreaSqFt: dto.totalBuiltUpAreaSqFt,
                totalBuiltUpAreaSqMeter: dto.totalBuiltUpAreaSqMeter,
                hasMunicipalWaterSupply: dto.hasMunicipalWaterSupply,
                hasAlternateWater: dto.hasAlternateWater,
                waterSourceType: dto.waterSourceType,
                totalWaterConnections: dto.totalWaterConnections,
                waterConnectionIdType: dto.waterConnectionIdType,
                toiletType: dto.toiletType,
                hasMunicipalWasteService: dto.hasMunicipalWasteService,
                status: dto.status,
            };
        }
        toPrismaUpdateData(dto, current, identity) {
            const data = {
                surveyId: identity.surveyId,
                parcelNo: identity.parcelNo,
                propertyNo: identity.propertyNo,
            };
            const assign = (key, transform) => {
                if (dto[key] === undefined)
                    return;
                const value = dto[key];
                data[key] = transform
                    ? transform(value)
                    : value;
            };
            assign("wardId");
            assign("surveyedAt", (v) => new Date(v));
            assign("ownerName");
            assign("ownerFatherName");
            assign("mobile");
            assign("ownerAadhaar");
            assign("isSlum");
            assign("remark");
            assign("electricityId");
            assign("khasraNo");
            assign("registryNo");
            assign("constructedDate");
            assign("respondentName");
            assign("respondentRelationship");
            assign("city");
            assign("pincode");
            assign("houseNo");
            assign("streetName");
            assign("locality");
            assign("colony");
            assign("presentHouseNo");
            assign("presentStreetName");
            assign("presentLocality");
            assign("presentColony");
            assign("presentCity");
            assign("presentPincode");
            assign("isSameAsProperty");
            assign("taxRateZone");
            assign("propertyOwnership");
            assign("propertyUse");
            assign("commercial");
            assign("yearOfConstruction");
            assign("exemptionType");
            assign("exemptionApplicable");
            assign("situation");
            assign("roadType");
            assign("floorsRaw");
            assign("plotAreaSqFt");
            assign("plotAreaSqMeter");
            assign("plinthAreaSqFt");
            assign("plinthAreaSqMeter");
            assign("totalBuiltUpAreaSqFt");
            assign("totalBuiltUpAreaSqMeter");
            assign("hasMunicipalWaterSupply");
            assign("hasAlternateWater");
            assign("waterSourceType");
            assign("totalWaterConnections");
            assign("waterConnectionIdType");
            assign("toiletType");
            assign("hasMunicipalWasteService");
            assign("status");
            void current;
            return data;
        }
        defaultInclude() {
            return {
                ward: true,
                floors: { orderBy: { sortOrder: "asc" } },
                attachments: {
                    orderBy: { createdAt: "asc" },
                    include: { uploadedBy: { select: { id: true, name: true } } },
                },
                createdBy: { select: { id: true, name: true, email: true } },
                updatedBy: { select: { id: true, name: true, email: true } },
            };
        }
        maskPii(survey, canReadPii) {
            if (canReadPii)
                return survey;
            return {
                ...survey,
                ownerAadhaar: survey.ownerAadhaar
                    ? `XXXX-XXXX-${survey.ownerAadhaar.slice(-4)}`
                    : survey.ownerAadhaar,
            };
        }
        async withAttachmentUrls(survey, user) {
            if (!survey.attachments?.length)
                return survey;
            const attachments = await Promise.all(survey.attachments.map(async (a) => {
                const url = await this.storage
                    .getSignedUrlForUser(user, a.objectKey, {
                    surveyId: survey.id,
                    uploadedById: a.uploadedById,
                    survey,
                })
                    .catch(() => null);
                return { ...a, url };
            }));
            return { ...survey, attachments };
        }
        async addAttachment(surveyId, file, user) {
            const current = await this.findOne(surveyId, user);
            assertSurveyAccess(user, current, "update");
            const safeName = file.originalname.replace(/[^\w.-]+/g, "_").slice(0, 180);
            const objectKey = `surveys/${current.id}/${Date.now()}-${safeName}`;
            await this.storage.putObject(objectKey, file.buffer, file.mimetype);
            const attachment = await this.prisma.surveyAttachment.create({
                data: {
                    surveyId: current.id,
                    objectKey,
                    originalFileName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    bucket: process.env.STORAGE_NAME ?? "local",
                    uploadedById: user.id,
                },
            });
            await this.audit.log({
                action: "SURVEY_ATTACHMENT_ADDED",
                entity: "Survey",
                entityId: current.id,
                actorId: user.id,
                newValue: { fileName: file.originalname, mimeType: file.mimetype },
            });
            const url = await this.storage
                .getSignedUrlForUser(user, objectKey, {
                surveyId: current.id,
                uploadedById: user.id,
                survey: current,
            })
                .catch(() => null);
            return { ...attachment, url };
        }
        async removeAttachment(surveyId, attachmentId, user) {
            const current = await this.findOne(surveyId, user);
            assertSurveyAccess(user, current, "update");
            const attachment = await this.prisma.surveyAttachment.findFirst({
                where: { id: attachmentId, surveyId: current.id },
            });
            if (!attachment) {
                throw new NotFoundException({
                    code: "ATTACHMENT_NOT_FOUND",
                    message: "Attachment not found",
                });
            }
            await this.prisma.surveyAttachment.delete({ where: { id: attachmentId } });
            await this.audit.log({
                action: "SURVEY_ATTACHMENT_REMOVED",
                entity: "Survey",
                entityId: current.id,
                actorId: user.id,
                oldValue: { fileName: attachment.originalFileName },
            });
            return { id: attachmentId };
        }
        async ensureCanonicalSurveyIds(surveys) {
            const repaired = [];
            for (const survey of surveys) {
                repaired.push(await this.ensureCanonicalSurveyId(survey));
            }
            return repaired;
        }
        async ensureCanonicalSurveyId(survey) {
            const surveyId = await repairSurveyIdIfNeeded(this.prisma, survey, survey.ward.number);
            if (surveyId === survey.surveyId)
                return survey;
            const parsed = parseGisSurveyId(surveyId);
            return {
                ...survey,
                surveyId,
                parcelNo: parsed?.parcelNo ?? survey.parcelNo,
                propertyNo: parsed?.propertyNo ?? survey.propertyNo,
            };
        }
    };
    return SurveysService = _classThis;
})();
export { SurveysService };
/** Exported for tests and import repair. */
export { verifySurveyIdMatchesRecord };
