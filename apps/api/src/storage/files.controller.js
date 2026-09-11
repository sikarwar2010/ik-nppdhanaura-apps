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
import { Controller, Get, StreamableFile } from "@nestjs/common";
import { IsNotEmpty, IsString } from "class-validator";
import path from "node:path";
import { Public } from "../auth/auth.decorators";
let FileDownloadQueryDto = (() => {
    let _key_decorators;
    let _key_initializers = [];
    let _key_extraInitializers = [];
    let _exp_decorators;
    let _exp_initializers = [];
    let _exp_extraInitializers = [];
    let _sig_decorators;
    let _sig_initializers = [];
    let _sig_extraInitializers = [];
    return class FileDownloadQueryDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _key_decorators = [IsString(), IsNotEmpty()];
            _exp_decorators = [IsString(), IsNotEmpty()];
            _sig_decorators = [IsString(), IsNotEmpty()];
            __esDecorate(null, null, _key_decorators, { kind: "field", name: "key", static: false, private: false, access: { has: obj => "key" in obj, get: obj => obj.key, set: (obj, value) => { obj.key = value; } }, metadata: _metadata }, _key_initializers, _key_extraInitializers);
            __esDecorate(null, null, _exp_decorators, { kind: "field", name: "exp", static: false, private: false, access: { has: obj => "exp" in obj, get: obj => obj.exp, set: (obj, value) => { obj.exp = value; } }, metadata: _metadata }, _exp_initializers, _exp_extraInitializers);
            __esDecorate(null, null, _sig_decorators, { kind: "field", name: "sig", static: false, private: false, access: { has: obj => "sig" in obj, get: obj => obj.sig, set: (obj, value) => { obj.sig = value; } }, metadata: _metadata }, _sig_initializers, _sig_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        key = __runInitializers(this, _key_initializers, void 0);
        exp = (__runInitializers(this, _key_extraInitializers), __runInitializers(this, _exp_initializers, void 0));
        sig = (__runInitializers(this, _exp_extraInitializers), __runInitializers(this, _sig_initializers, void 0));
        constructor() {
            __runInitializers(this, _sig_extraInitializers);
        }
    };
})();
let FilesController = (() => {
    let _classDecorators = [Public(), Controller("api/v1/files")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _download_decorators;
    var FilesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _download_decorators = [Get()];
            __esDecorate(this, null, _download_decorators, { kind: "method", name: "download", static: false, private: false, access: { has: obj => "download" in obj, get: obj => obj.download }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FilesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        storage = __runInitializers(this, _instanceExtraInitializers);
        constructor(storage) {
            this.storage = storage;
        }
        /**
         * Signed download endpoint. Object ownership is enforced when staff services
         * mint URLs via StorageService.getSignedUrlForUser (assertFileAccess).
         */
        download(query) {
            this.storage.assertDownloadSignature(query.key, query.exp, query.sig);
            const filename = path.basename(query.key) || "download";
            return new StreamableFile(this.storage.createObjectStream(query.key), {
                type: this.storage.guessMime(query.key),
                disposition: `inline; filename="${filename.replaceAll('"', "")}"`,
            });
        }
    };
    return FilesController = _classThis;
})();
export { FilesController };
