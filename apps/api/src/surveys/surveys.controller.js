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
import { BadRequestException, Controller, Delete, Get, Patch, Post, UseInterceptors, } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { RequirePermission, } from "../auth/auth.decorators";
import { canReadSurveyPii } from "../auth/auth-permissions";
const IMAGE_MIME = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
]);
let SurveysController = (() => {
    let _classDecorators = [Controller("api/v1/surveys")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _findAll_decorators;
    let _findOne_decorators;
    let _uploadAttachment_decorators;
    let _removeAttachment_decorators;
    let _update_decorators;
    let _remove_decorators;
    var SurveysController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [Post(), RequirePermission("survey:create")];
            _findAll_decorators = [Get(), RequirePermission("survey:read")];
            _findOne_decorators = [Get(":id"), RequirePermission("survey:read")];
            _uploadAttachment_decorators = [Post(":id/attachments"), RequirePermission("survey:update"), UseInterceptors(FileInterceptor("file"))];
            _removeAttachment_decorators = [Delete(":id/attachments/:attachmentId"), RequirePermission("survey:update")];
            _update_decorators = [Patch(":id"), RequirePermission("survey:update")];
            _remove_decorators = [Delete(":id"), RequirePermission("survey:delete")];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadAttachment_decorators, { kind: "method", name: "uploadAttachment", static: false, private: false, access: { has: obj => "uploadAttachment" in obj, get: obj => obj.uploadAttachment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _removeAttachment_decorators, { kind: "method", name: "removeAttachment", static: false, private: false, access: { has: obj => "removeAttachment" in obj, get: obj => obj.removeAttachment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SurveysController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        surveysService = __runInitializers(this, _instanceExtraInitializers);
        constructor(surveysService) {
            this.surveysService = surveysService;
        }
        async create(dto, user) {
            const data = await this.surveysService.create(dto, user);
            return { success: true, data };
        }
        async findAll(query, user) {
            const { items, meta } = await this.surveysService.findAll(query, user);
            return { success: true, data: items, meta };
        }
        async findOne(id, user) {
            const survey = await this.surveysService.findOne(id, user);
            const neighbors = await this.surveysService.findNeighbors(survey);
            const masked = this.surveysService.maskPii(survey, canReadSurveyPii(user));
            const data = await this.surveysService.withAttachmentUrls(masked, user);
            return { success: true, data: { ...data, neighbors } };
        }
        async uploadAttachment(id, file, user) {
            if (!file) {
                throw new BadRequestException({
                    code: "FILE_REQUIRED",
                    message: "Image or PDF file is required",
                });
            }
            if (!IMAGE_MIME.has(file.mimetype)) {
                throw new BadRequestException({
                    code: "INVALID_FILE_TYPE",
                    message: "Only JPEG, PNG, WebP, GIF, or PDF allowed",
                });
            }
            const maxMb = Number(process.env.IMPORT_MAX_FILE_SIZE_MB ?? 50);
            if (file.size > maxMb * 1024 * 1024) {
                throw new BadRequestException({
                    code: "FILE_TOO_LARGE",
                    message: `File must be under ${maxMb}MB`,
                });
            }
            const data = await this.surveysService.addAttachment(id, file, user);
            return { success: true, data };
        }
        async removeAttachment(id, attachmentId, user) {
            const data = await this.surveysService.removeAttachment(id, attachmentId, user);
            return { success: true, data };
        }
        async update(id, dto, user) {
            const data = await this.surveysService.update(id, dto, user);
            return { success: true, data };
        }
        async remove(id, user) {
            const data = await this.surveysService.remove(id, user);
            return { success: true, data };
        }
    };
    return SurveysController = _classThis;
})();
export { SurveysController };
