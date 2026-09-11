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
import { Injectable } from "@nestjs/common";
import { resolveTrustedOrigins } from "../auth/session-options";
import { isMutatingMethod } from "./csrf";
const JSON_CONTENT_TYPES = new Set([
    "application/json",
    "application/json; charset=utf-8",
]);
export function isAtomGatewayPath(path) {
    return Boolean(path?.includes("/payments/gateway/"));
}
let OriginValidationMiddleware = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OriginValidationMiddleware = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OriginValidationMiddleware = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        use(req, res, next) {
            if (!isMutatingMethod(req.method)) {
                next();
                return;
            }
            if (isAtomGatewayPath(req.originalUrl) || isAtomGatewayPath(req.path)) {
                next();
                return;
            }
            const contentType = req.headers["content-type"]?.split(";")[0]?.trim();
            if (contentType &&
                !JSON_CONTENT_TYPES.has(contentType) &&
                !contentType.startsWith("multipart/form-data")) {
                res.status(415).json({
                    success: false,
                    error: {
                        code: "UNSUPPORTED_MEDIA_TYPE",
                        message: "Unsupported Content-Type",
                    },
                });
                return;
            }
            const originHeader = req.headers.origin?.trim();
            const refererHeader = req.headers.referer?.trim();
            const trusted = resolveTrustedOrigins();
            const originFromReferer = refererHeader
                ? (() => {
                    try {
                        const url = new URL(refererHeader);
                        return `${url.protocol}//${url.host}`;
                    }
                    catch {
                        return undefined;
                    }
                })()
                : undefined;
            const candidate = originHeader || originFromReferer;
            if (candidate && !trusted.includes(candidate.replace(/\/+$/, ""))) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: "INVALID_ORIGIN",
                        message: "Request origin is not allowed",
                    },
                });
                return;
            }
            next();
        }
    };
    return OriginValidationMiddleware = _classThis;
})();
export { OriginValidationMiddleware };
