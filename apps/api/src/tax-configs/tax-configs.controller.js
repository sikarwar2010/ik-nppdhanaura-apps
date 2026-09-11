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
import { Controller, Get, Patch, Post, Put, } from "@nestjs/common";
import { RequirePermission, } from "../auth/auth.decorators";
let TaxConfigsController = (() => {
    let _classDecorators = [Controller("api/v1/tax-configs")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getOrCreate_decorators;
    let _copyToWards_decorators;
    let _updateParams_decorators;
    let _upsertCells_decorators;
    let _preview_decorators;
    let _versions_decorators;
    let _publish_decorators;
    var TaxConfigsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getOrCreate_decorators = [Get(), RequirePermission("settings:update")];
            _copyToWards_decorators = [Post("copy-to-wards"), RequirePermission("settings:update")];
            _updateParams_decorators = [Patch(":id"), RequirePermission("settings:update")];
            _upsertCells_decorators = [Put(":id/cells"), RequirePermission("settings:update")];
            _preview_decorators = [Post("preview"), RequirePermission("report:read")];
            _versions_decorators = [Get(":id/versions"), RequirePermission("settings:update")];
            _publish_decorators = [Post(":id/publish"), RequirePermission("settings:update")];
            __esDecorate(this, null, _getOrCreate_decorators, { kind: "method", name: "getOrCreate", static: false, private: false, access: { has: obj => "getOrCreate" in obj, get: obj => obj.getOrCreate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _copyToWards_decorators, { kind: "method", name: "copyToWards", static: false, private: false, access: { has: obj => "copyToWards" in obj, get: obj => obj.copyToWards }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateParams_decorators, { kind: "method", name: "updateParams", static: false, private: false, access: { has: obj => "updateParams" in obj, get: obj => obj.updateParams }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _upsertCells_decorators, { kind: "method", name: "upsertCells", static: false, private: false, access: { has: obj => "upsertCells" in obj, get: obj => obj.upsertCells }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _preview_decorators, { kind: "method", name: "preview", static: false, private: false, access: { has: obj => "preview" in obj, get: obj => obj.preview }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _versions_decorators, { kind: "method", name: "versions", static: false, private: false, access: { has: obj => "versions" in obj, get: obj => obj.versions }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _publish_decorators, { kind: "method", name: "publish", static: false, private: false, access: { has: obj => "publish" in obj, get: obj => obj.publish }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TaxConfigsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        taxConfigsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(taxConfigsService) {
            this.taxConfigsService = taxConfigsService;
        }
        getOrCreate(wardId, assessmentYearId, user) {
            return this.taxConfigsService.getOrCreate(wardId, assessmentYearId, user.id);
        }
        copyToWards(dto, user) {
            return this.taxConfigsService.copyToAllWards(dto, user.id);
        }
        updateParams(id, dto, user) {
            return this.taxConfigsService.updateParams(id, dto, user.id);
        }
        upsertCells(id, dto, user) {
            return this.taxConfigsService.upsertCells(id, dto.cells ?? [], user.id);
        }
        preview(dto) {
            return this.taxConfigsService.preview(dto);
        }
        versions(id) {
            return this.taxConfigsService.listVersions(id);
        }
        publish(id, dto, user) {
            return this.taxConfigsService.publish(id, dto, user.id);
        }
    };
    return TaxConfigsController = _classThis;
})();
export { TaxConfigsController };
