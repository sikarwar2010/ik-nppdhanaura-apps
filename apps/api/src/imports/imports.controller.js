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
import { Controller, Get, Post, UseInterceptors, } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { RequirePermission, } from "../auth/auth.decorators";
let ImportsController = (() => {
    let _classDecorators = [Controller("api/v1/imports")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _upload_decorators;
    let _start_decorators;
    let _list_decorators;
    let _get_decorators;
    var ImportsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _upload_decorators = [Post("upload"), RequirePermission("import:create"), UseInterceptors(FileInterceptor("file"))];
            _start_decorators = [Post(":id/start"), RequirePermission("import:create")];
            _list_decorators = [Get(), RequirePermission("import:read")];
            _get_decorators = [Get(":id"), RequirePermission("import:read")];
            __esDecorate(this, null, _upload_decorators, { kind: "method", name: "upload", static: false, private: false, access: { has: obj => "upload" in obj, get: obj => obj.upload }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _start_decorators, { kind: "method", name: "start", static: false, private: false, access: { has: obj => "start" in obj, get: obj => obj.start }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ImportsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        importsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(importsService) {
            this.importsService = importsService;
        }
        async upload(file, user, duplicateStrategy) {
            const data = await this.importsService.createUpload(file, user, duplicateStrategy ?? "UPDATE");
            return { success: true, data };
        }
        async start(id) {
            const data = await this.importsService.start(id);
            return { success: true, data };
        }
        async list(page, pageSize, status, q) {
            const { items, meta } = await this.importsService.list(Number(page ?? 1), Number(pageSize ?? 20), { status, q });
            return { success: true, data: items, meta };
        }
        async get(id) {
            const data = await this.importsService.getJob(id);
            return { success: true, data };
        }
    };
    return ImportsController = _classThis;
})();
export { ImportsController };
let ExportsController = (() => {
    let _classDecorators = [Controller("api/v1/exports")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _exportSurveys_decorators;
    var ExportsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _exportSurveys_decorators = [Post("surveys"), RequirePermission("export:create")];
            __esDecorate(this, null, _exportSurveys_decorators, { kind: "method", name: "exportSurveys", static: false, private: false, access: { has: obj => "exportSurveys" in obj, get: obj => obj.exportSurveys }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ExportsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        importsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(importsService) {
            this.importsService = importsService;
        }
        async exportSurveys(body, user) {
            const data = await this.importsService.exportSurveys(body, user);
            return { success: true, data };
        }
    };
    return ExportsController = _classThis;
})();
export { ExportsController };
