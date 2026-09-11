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
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, } from "class-validator";
export const PUBLIC_PROPERTY_TAX_SEARCH_MODES = [
    "ward",
    "propertyId",
    "owner",
];
let PublicPropertyTaxSearchQueryDto = (() => {
    let _mode_decorators;
    let _mode_initializers = [];
    let _mode_extraInitializers = [];
    let _wardNumber_decorators;
    let _wardNumber_initializers = [];
    let _wardNumber_extraInitializers = [];
    let _propertyNo_decorators;
    let _propertyNo_initializers = [];
    let _propertyNo_extraInitializers = [];
    let _propertyId_decorators;
    let _propertyId_initializers = [];
    let _propertyId_extraInitializers = [];
    let _ownerName_decorators;
    let _ownerName_initializers = [];
    let _ownerName_extraInitializers = [];
    let _mobile_decorators;
    let _mobile_initializers = [];
    let _mobile_extraInitializers = [];
    let _page_decorators;
    let _page_initializers = [];
    let _page_extraInitializers = [];
    let _pageSize_decorators;
    let _pageSize_initializers = [];
    let _pageSize_extraInitializers = [];
    return class PublicPropertyTaxSearchQueryDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _mode_decorators = [IsIn(PUBLIC_PROPERTY_TAX_SEARCH_MODES)];
            _wardNumber_decorators = [IsOptional(), Type(() => Number), IsInt(), Min(1)];
            _propertyNo_decorators = [IsOptional(), IsString(), MaxLength(100)];
            _propertyId_decorators = [IsOptional(), IsString(), MinLength(1), MaxLength(100)];
            _ownerName_decorators = [IsOptional(), IsString(), MaxLength(200)];
            _mobile_decorators = [IsOptional(), IsString(), MaxLength(15)];
            _page_decorators = [IsOptional(), Type(() => Number), IsInt(), Min(1)];
            _pageSize_decorators = [IsOptional(), Type(() => Number), IsInt(), Min(1), Max(20)];
            __esDecorate(null, null, _mode_decorators, { kind: "field", name: "mode", static: false, private: false, access: { has: obj => "mode" in obj, get: obj => obj.mode, set: (obj, value) => { obj.mode = value; } }, metadata: _metadata }, _mode_initializers, _mode_extraInitializers);
            __esDecorate(null, null, _wardNumber_decorators, { kind: "field", name: "wardNumber", static: false, private: false, access: { has: obj => "wardNumber" in obj, get: obj => obj.wardNumber, set: (obj, value) => { obj.wardNumber = value; } }, metadata: _metadata }, _wardNumber_initializers, _wardNumber_extraInitializers);
            __esDecorate(null, null, _propertyNo_decorators, { kind: "field", name: "propertyNo", static: false, private: false, access: { has: obj => "propertyNo" in obj, get: obj => obj.propertyNo, set: (obj, value) => { obj.propertyNo = value; } }, metadata: _metadata }, _propertyNo_initializers, _propertyNo_extraInitializers);
            __esDecorate(null, null, _propertyId_decorators, { kind: "field", name: "propertyId", static: false, private: false, access: { has: obj => "propertyId" in obj, get: obj => obj.propertyId, set: (obj, value) => { obj.propertyId = value; } }, metadata: _metadata }, _propertyId_initializers, _propertyId_extraInitializers);
            __esDecorate(null, null, _ownerName_decorators, { kind: "field", name: "ownerName", static: false, private: false, access: { has: obj => "ownerName" in obj, get: obj => obj.ownerName, set: (obj, value) => { obj.ownerName = value; } }, metadata: _metadata }, _ownerName_initializers, _ownerName_extraInitializers);
            __esDecorate(null, null, _mobile_decorators, { kind: "field", name: "mobile", static: false, private: false, access: { has: obj => "mobile" in obj, get: obj => obj.mobile, set: (obj, value) => { obj.mobile = value; } }, metadata: _metadata }, _mobile_initializers, _mobile_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: obj => "page" in obj, get: obj => obj.page, set: (obj, value) => { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _pageSize_decorators, { kind: "field", name: "pageSize", static: false, private: false, access: { has: obj => "pageSize" in obj, get: obj => obj.pageSize, set: (obj, value) => { obj.pageSize = value; } }, metadata: _metadata }, _pageSize_initializers, _pageSize_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        mode = __runInitializers(this, _mode_initializers, void 0);
        wardNumber = (__runInitializers(this, _mode_extraInitializers), __runInitializers(this, _wardNumber_initializers, void 0));
        propertyNo = (__runInitializers(this, _wardNumber_extraInitializers), __runInitializers(this, _propertyNo_initializers, void 0));
        propertyId = (__runInitializers(this, _propertyNo_extraInitializers), __runInitializers(this, _propertyId_initializers, void 0));
        ownerName = (__runInitializers(this, _propertyId_extraInitializers), __runInitializers(this, _ownerName_initializers, void 0));
        mobile = (__runInitializers(this, _ownerName_extraInitializers), __runInitializers(this, _mobile_initializers, void 0));
        page = (__runInitializers(this, _mobile_extraInitializers), __runInitializers(this, _page_initializers, 1));
        pageSize = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _pageSize_initializers, 10));
        constructor() {
            __runInitializers(this, _pageSize_extraInitializers);
        }
    };
})();
export { PublicPropertyTaxSearchQueryDto };
