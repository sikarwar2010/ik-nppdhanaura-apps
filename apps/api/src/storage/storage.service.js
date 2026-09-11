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
import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException, } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertFileAccess, parseSurveyIdFromObjectKey, } from "../auth/resource-access";
const MIME_BY_EXT = {
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".webp": "image/webp",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
let StorageService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var StorageService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            StorageService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new Logger(StorageService.name);
        root = path.resolve(process.env.STORAGE_DIR ?? "uploads");
        onModuleInit() {
            this.root = path.resolve(process.env.STORAGE_DIR ?? "uploads");
            this.logger.log(`Local file storage at ${this.root}`);
        }
        async ensureBucket() {
            await mkdir(this.root, { recursive: true });
        }
        async putObject(objectKey, buffer, _mimeType) {
            await this.ensureBucket();
            const filePath = this.resolveObjectPath(objectKey);
            await mkdir(path.dirname(filePath), { recursive: true });
            await writeFile(filePath, buffer);
            return objectKey;
        }
        async getObject(objectKey) {
            const stream = this.createObjectStream(objectKey);
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            return Buffer.concat(chunks);
        }
        createObjectStream(objectKey) {
            const filePath = this.resolveObjectPath(objectKey);
            if (!existsSync(filePath)) {
                throw new NotFoundException({
                    code: "FILE_NOT_FOUND",
                    message: "File not found",
                });
            }
            return createReadStream(filePath);
        }
        guessMime(objectKey) {
            return (MIME_BY_EXT[path.extname(objectKey).toLowerCase()] ??
                "application/octet-stream");
        }
        async getSignedUrl(objectKey, expirySeconds = 300) {
            this.resolveObjectPath(objectKey);
            const exp = Math.floor(Date.now() / 1000) + expirySeconds;
            const sig = this.sign(objectKey, exp);
            const params = new URLSearchParams({
                key: objectKey,
                exp: String(exp),
                sig,
            });
            return `/api/v1/files?${params.toString()}`;
        }
        async getSignedUrlForUser(user, objectKey, context = {}, expirySeconds = 300) {
            const file = {
                objectKey,
                surveyId: context.surveyId ?? parseSurveyIdFromObjectKey(objectKey),
                uploadedById: context.uploadedById,
                createdById: context.createdById,
            };
            assertFileAccess(user, file, "read", context.survey);
            return this.getSignedUrl(objectKey, expirySeconds);
        }
        assertDownloadSignature(objectKey, expRaw, sig) {
            const exp = Number(expRaw);
            if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
                throw new UnauthorizedException({
                    code: "FILE_URL_EXPIRED",
                    message: "File link expired",
                });
            }
            const expected = this.sign(objectKey, exp);
            const a = Buffer.from(sig);
            const b = Buffer.from(expected);
            if (a.length !== b.length || !timingSafeEqual(a, b)) {
                throw new UnauthorizedException({
                    code: "FILE_URL_INVALID",
                    message: "Invalid file link",
                });
            }
            this.resolveObjectPath(objectKey);
        }
        sign(objectKey, exp) {
            return createHmac("sha256", this.signingSecret())
                .update(`${objectKey}.${exp}`)
                .digest("hex");
        }
        signingSecret() {
            return (process.env.STORAGE_SIGNING_SECRET?.trim() ||
                process.env.SESSION_SECRET?.trim() ||
                process.env.BETTER_AUTH_SECRET?.trim() ||
                "dev-storage-signing-secret");
        }
        resolveObjectPath(objectKey) {
            const normalized = objectKey.replaceAll("\\", "/").replace(/^\/+/, "");
            if (!normalized || normalized.includes("..")) {
                throw new BadRequestException({
                    code: "INVALID_OBJECT_KEY",
                    message: "Invalid object key",
                });
            }
            const full = path.resolve(this.root, normalized);
            const rootWithSep = this.root.endsWith(path.sep)
                ? this.root
                : `${this.root}${path.sep}`;
            if (full !== this.root && !full.startsWith(rootWithSep)) {
                throw new BadRequestException({
                    code: "INVALID_OBJECT_KEY",
                    message: "Invalid object key",
                });
            }
            return full;
        }
    };
    return StorageService = _classThis;
})();
export { StorageService };
