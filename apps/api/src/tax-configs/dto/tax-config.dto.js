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
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, Matches, Min, ValidateNested, } from "class-validator";
let UpdateTaxConfigParamsDto = (() => {
    let _propertyTaxPct_decorators;
    let _propertyTaxPct_initializers = [];
    let _propertyTaxPct_extraInitializers = [];
    let _waterTaxPct_decorators;
    let _waterTaxPct_initializers = [];
    let _waterTaxPct_extraInitializers = [];
    let _drainageTaxPct_decorators;
    let _drainageTaxPct_initializers = [];
    let _drainageTaxPct_extraInitializers = [];
    let _penaltyPct_decorators;
    let _penaltyPct_initializers = [];
    let _penaltyPct_extraInitializers = [];
    let _assessablePct_decorators;
    let _assessablePct_initializers = [];
    let _assessablePct_extraInitializers = [];
    let _commercialAssessablePct_decorators;
    let _commercialAssessablePct_initializers = [];
    let _commercialAssessablePct_extraInitializers = [];
    let _reason_decorators;
    let _reason_initializers = [];
    let _reason_extraInitializers = [];
    return class UpdateTaxConfigParamsDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _propertyTaxPct_decorators = [IsOptional(), Type(() => Number), IsNumber(), Min(0)];
            _waterTaxPct_decorators = [IsOptional(), Type(() => Number), IsNumber(), Min(0)];
            _drainageTaxPct_decorators = [IsOptional(), Type(() => Number), IsNumber(), Min(0)];
            _penaltyPct_decorators = [IsOptional(), Type(() => Number), IsNumber(), Min(0)];
            _assessablePct_decorators = [IsOptional(), Type(() => Number), IsNumber(), Min(0)];
            _commercialAssessablePct_decorators = [IsOptional(), Type(() => Number), IsNumber(), Min(0)];
            _reason_decorators = [IsOptional(), IsString()];
            __esDecorate(null, null, _propertyTaxPct_decorators, { kind: "field", name: "propertyTaxPct", static: false, private: false, access: { has: obj => "propertyTaxPct" in obj, get: obj => obj.propertyTaxPct, set: (obj, value) => { obj.propertyTaxPct = value; } }, metadata: _metadata }, _propertyTaxPct_initializers, _propertyTaxPct_extraInitializers);
            __esDecorate(null, null, _waterTaxPct_decorators, { kind: "field", name: "waterTaxPct", static: false, private: false, access: { has: obj => "waterTaxPct" in obj, get: obj => obj.waterTaxPct, set: (obj, value) => { obj.waterTaxPct = value; } }, metadata: _metadata }, _waterTaxPct_initializers, _waterTaxPct_extraInitializers);
            __esDecorate(null, null, _drainageTaxPct_decorators, { kind: "field", name: "drainageTaxPct", static: false, private: false, access: { has: obj => "drainageTaxPct" in obj, get: obj => obj.drainageTaxPct, set: (obj, value) => { obj.drainageTaxPct = value; } }, metadata: _metadata }, _drainageTaxPct_initializers, _drainageTaxPct_extraInitializers);
            __esDecorate(null, null, _penaltyPct_decorators, { kind: "field", name: "penaltyPct", static: false, private: false, access: { has: obj => "penaltyPct" in obj, get: obj => obj.penaltyPct, set: (obj, value) => { obj.penaltyPct = value; } }, metadata: _metadata }, _penaltyPct_initializers, _penaltyPct_extraInitializers);
            __esDecorate(null, null, _assessablePct_decorators, { kind: "field", name: "assessablePct", static: false, private: false, access: { has: obj => "assessablePct" in obj, get: obj => obj.assessablePct, set: (obj, value) => { obj.assessablePct = value; } }, metadata: _metadata }, _assessablePct_initializers, _assessablePct_extraInitializers);
            __esDecorate(null, null, _commercialAssessablePct_decorators, { kind: "field", name: "commercialAssessablePct", static: false, private: false, access: { has: obj => "commercialAssessablePct" in obj, get: obj => obj.commercialAssessablePct, set: (obj, value) => { obj.commercialAssessablePct = value; } }, metadata: _metadata }, _commercialAssessablePct_initializers, _commercialAssessablePct_extraInitializers);
            __esDecorate(null, null, _reason_decorators, { kind: "field", name: "reason", static: false, private: false, access: { has: obj => "reason" in obj, get: obj => obj.reason, set: (obj, value) => { obj.reason = value; } }, metadata: _metadata }, _reason_initializers, _reason_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        propertyTaxPct = __runInitializers(this, _propertyTaxPct_initializers, void 0);
        waterTaxPct = (__runInitializers(this, _propertyTaxPct_extraInitializers), __runInitializers(this, _waterTaxPct_initializers, void 0));
        drainageTaxPct = (__runInitializers(this, _waterTaxPct_extraInitializers), __runInitializers(this, _drainageTaxPct_initializers, void 0));
        penaltyPct = (__runInitializers(this, _drainageTaxPct_extraInitializers), __runInitializers(this, _penaltyPct_initializers, void 0));
        assessablePct = (__runInitializers(this, _penaltyPct_extraInitializers), __runInitializers(this, _assessablePct_initializers, void 0));
        commercialAssessablePct = (__runInitializers(this, _assessablePct_extraInitializers), __runInitializers(this, _commercialAssessablePct_initializers, void 0));
        reason = (__runInitializers(this, _commercialAssessablePct_extraInitializers), __runInitializers(this, _reason_initializers, void 0));
        constructor() {
            __runInitializers(this, _reason_extraInitializers);
        }
    };
})();
export { UpdateTaxConfigParamsDto };
let UpsertTaxCellDto = (() => {
    let _roadWidthEntryId_decorators;
    let _roadWidthEntryId_initializers = [];
    let _roadWidthEntryId_extraInitializers = [];
    let _constructionEntryId_decorators;
    let _constructionEntryId_initializers = [];
    let _constructionEntryId_extraInitializers = [];
    let _annualRatePerSqFt_decorators;
    let _annualRatePerSqFt_initializers = [];
    let _annualRatePerSqFt_extraInitializers = [];
    return class UpsertTaxCellDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _roadWidthEntryId_decorators = [IsString()];
            _constructionEntryId_decorators = [IsString()];
            _annualRatePerSqFt_decorators = [Type(() => Number), IsNumber(), Min(0)];
            __esDecorate(null, null, _roadWidthEntryId_decorators, { kind: "field", name: "roadWidthEntryId", static: false, private: false, access: { has: obj => "roadWidthEntryId" in obj, get: obj => obj.roadWidthEntryId, set: (obj, value) => { obj.roadWidthEntryId = value; } }, metadata: _metadata }, _roadWidthEntryId_initializers, _roadWidthEntryId_extraInitializers);
            __esDecorate(null, null, _constructionEntryId_decorators, { kind: "field", name: "constructionEntryId", static: false, private: false, access: { has: obj => "constructionEntryId" in obj, get: obj => obj.constructionEntryId, set: (obj, value) => { obj.constructionEntryId = value; } }, metadata: _metadata }, _constructionEntryId_initializers, _constructionEntryId_extraInitializers);
            __esDecorate(null, null, _annualRatePerSqFt_decorators, { kind: "field", name: "annualRatePerSqFt", static: false, private: false, access: { has: obj => "annualRatePerSqFt" in obj, get: obj => obj.annualRatePerSqFt, set: (obj, value) => { obj.annualRatePerSqFt = value; } }, metadata: _metadata }, _annualRatePerSqFt_initializers, _annualRatePerSqFt_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        roadWidthEntryId = __runInitializers(this, _roadWidthEntryId_initializers, void 0);
        constructionEntryId = (__runInitializers(this, _roadWidthEntryId_extraInitializers), __runInitializers(this, _constructionEntryId_initializers, void 0));
        annualRatePerSqFt = (__runInitializers(this, _constructionEntryId_extraInitializers), __runInitializers(this, _annualRatePerSqFt_initializers, void 0));
        constructor() {
            __runInitializers(this, _annualRatePerSqFt_extraInitializers);
        }
    };
})();
export { UpsertTaxCellDto };
let UpsertTaxCellsDto = (() => {
    let _cells_decorators;
    let _cells_initializers = [];
    let _cells_extraInitializers = [];
    return class UpsertTaxCellsDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _cells_decorators = [IsArray(), ValidateNested({ each: true }), Type(() => UpsertTaxCellDto)];
            __esDecorate(null, null, _cells_decorators, { kind: "field", name: "cells", static: false, private: false, access: { has: obj => "cells" in obj, get: obj => obj.cells, set: (obj, value) => { obj.cells = value; } }, metadata: _metadata }, _cells_initializers, _cells_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        cells = __runInitializers(this, _cells_initializers, void 0);
        constructor() {
            __runInitializers(this, _cells_extraInitializers);
        }
    };
})();
export { UpsertTaxCellsDto };
let TaxPreviewDto = (() => {
    let _wardId_decorators;
    let _wardId_initializers = [];
    let _wardId_extraInitializers = [];
    let _assessmentYearId_decorators;
    let _assessmentYearId_initializers = [];
    let _assessmentYearId_extraInitializers = [];
    let _areaSqFt_decorators;
    let _areaSqFt_initializers = [];
    let _areaSqFt_extraInitializers = [];
    let _roadWidthEntryId_decorators;
    let _roadWidthEntryId_initializers = [];
    let _roadWidthEntryId_extraInitializers = [];
    let _constructionEntryId_decorators;
    let _constructionEntryId_initializers = [];
    let _constructionEntryId_extraInitializers = [];
    let _gisUseCode_decorators;
    let _gisUseCode_initializers = [];
    let _gisUseCode_extraInitializers = [];
    return class TaxPreviewDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _wardId_decorators = [IsString()];
            _assessmentYearId_decorators = [IsString()];
            _areaSqFt_decorators = [Type(() => Number), IsNumber(), Min(0)];
            _roadWidthEntryId_decorators = [IsString()];
            _constructionEntryId_decorators = [IsString()];
            _gisUseCode_decorators = [IsOptional(), IsString(), Matches(/^[A-Za-z]$/, {
                    message: "GIS use code must be a single letter (A–Z)",
                })];
            __esDecorate(null, null, _wardId_decorators, { kind: "field", name: "wardId", static: false, private: false, access: { has: obj => "wardId" in obj, get: obj => obj.wardId, set: (obj, value) => { obj.wardId = value; } }, metadata: _metadata }, _wardId_initializers, _wardId_extraInitializers);
            __esDecorate(null, null, _assessmentYearId_decorators, { kind: "field", name: "assessmentYearId", static: false, private: false, access: { has: obj => "assessmentYearId" in obj, get: obj => obj.assessmentYearId, set: (obj, value) => { obj.assessmentYearId = value; } }, metadata: _metadata }, _assessmentYearId_initializers, _assessmentYearId_extraInitializers);
            __esDecorate(null, null, _areaSqFt_decorators, { kind: "field", name: "areaSqFt", static: false, private: false, access: { has: obj => "areaSqFt" in obj, get: obj => obj.areaSqFt, set: (obj, value) => { obj.areaSqFt = value; } }, metadata: _metadata }, _areaSqFt_initializers, _areaSqFt_extraInitializers);
            __esDecorate(null, null, _roadWidthEntryId_decorators, { kind: "field", name: "roadWidthEntryId", static: false, private: false, access: { has: obj => "roadWidthEntryId" in obj, get: obj => obj.roadWidthEntryId, set: (obj, value) => { obj.roadWidthEntryId = value; } }, metadata: _metadata }, _roadWidthEntryId_initializers, _roadWidthEntryId_extraInitializers);
            __esDecorate(null, null, _constructionEntryId_decorators, { kind: "field", name: "constructionEntryId", static: false, private: false, access: { has: obj => "constructionEntryId" in obj, get: obj => obj.constructionEntryId, set: (obj, value) => { obj.constructionEntryId = value; } }, metadata: _metadata }, _constructionEntryId_initializers, _constructionEntryId_extraInitializers);
            __esDecorate(null, null, _gisUseCode_decorators, { kind: "field", name: "gisUseCode", static: false, private: false, access: { has: obj => "gisUseCode" in obj, get: obj => obj.gisUseCode, set: (obj, value) => { obj.gisUseCode = value; } }, metadata: _metadata }, _gisUseCode_initializers, _gisUseCode_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        wardId = __runInitializers(this, _wardId_initializers, void 0);
        assessmentYearId = (__runInitializers(this, _wardId_extraInitializers), __runInitializers(this, _assessmentYearId_initializers, void 0));
        areaSqFt = (__runInitializers(this, _assessmentYearId_extraInitializers), __runInitializers(this, _areaSqFt_initializers, void 0));
        roadWidthEntryId = (__runInitializers(this, _areaSqFt_extraInitializers), __runInitializers(this, _roadWidthEntryId_initializers, void 0));
        constructionEntryId = (__runInitializers(this, _roadWidthEntryId_extraInitializers), __runInitializers(this, _constructionEntryId_initializers, void 0));
        gisUseCode = (__runInitializers(this, _constructionEntryId_extraInitializers), __runInitializers(this, _gisUseCode_initializers, void 0));
        constructor() {
            __runInitializers(this, _gisUseCode_extraInitializers);
        }
    };
})();
export { TaxPreviewDto };
let PublishTaxConfigDto = (() => {
    let _reason_decorators;
    let _reason_initializers = [];
    let _reason_extraInitializers = [];
    let _effectiveFrom_decorators;
    let _effectiveFrom_initializers = [];
    let _effectiveFrom_extraInitializers = [];
    return class PublishTaxConfigDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _reason_decorators = [IsOptional(), IsString()];
            _effectiveFrom_decorators = [IsOptional(), IsString()];
            __esDecorate(null, null, _reason_decorators, { kind: "field", name: "reason", static: false, private: false, access: { has: obj => "reason" in obj, get: obj => obj.reason, set: (obj, value) => { obj.reason = value; } }, metadata: _metadata }, _reason_initializers, _reason_extraInitializers);
            __esDecorate(null, null, _effectiveFrom_decorators, { kind: "field", name: "effectiveFrom", static: false, private: false, access: { has: obj => "effectiveFrom" in obj, get: obj => obj.effectiveFrom, set: (obj, value) => { obj.effectiveFrom = value; } }, metadata: _metadata }, _effectiveFrom_initializers, _effectiveFrom_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        reason = __runInitializers(this, _reason_initializers, void 0);
        effectiveFrom = (__runInitializers(this, _reason_extraInitializers), __runInitializers(this, _effectiveFrom_initializers, void 0));
        constructor() {
            __runInitializers(this, _effectiveFrom_extraInitializers);
        }
    };
})();
export { PublishTaxConfigDto };
let CopyTaxToWardsDto = (() => {
    let _sourceWardId_decorators;
    let _sourceWardId_initializers = [];
    let _sourceWardId_extraInitializers = [];
    let _assessmentYearId_decorators;
    let _assessmentYearId_initializers = [];
    let _assessmentYearId_extraInitializers = [];
    return class CopyTaxToWardsDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _sourceWardId_decorators = [IsString()];
            _assessmentYearId_decorators = [IsString()];
            __esDecorate(null, null, _sourceWardId_decorators, { kind: "field", name: "sourceWardId", static: false, private: false, access: { has: obj => "sourceWardId" in obj, get: obj => obj.sourceWardId, set: (obj, value) => { obj.sourceWardId = value; } }, metadata: _metadata }, _sourceWardId_initializers, _sourceWardId_extraInitializers);
            __esDecorate(null, null, _assessmentYearId_decorators, { kind: "field", name: "assessmentYearId", static: false, private: false, access: { has: obj => "assessmentYearId" in obj, get: obj => obj.assessmentYearId, set: (obj, value) => { obj.assessmentYearId = value; } }, metadata: _metadata }, _assessmentYearId_initializers, _assessmentYearId_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        sourceWardId = __runInitializers(this, _sourceWardId_initializers, void 0);
        assessmentYearId = (__runInitializers(this, _sourceWardId_extraInitializers), __runInitializers(this, _assessmentYearId_initializers, void 0));
        constructor() {
            __runInitializers(this, _assessmentYearId_extraInitializers);
        }
    };
})();
export { CopyTaxToWardsDto };
