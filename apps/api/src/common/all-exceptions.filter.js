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
import { Catch, HttpException, HttpStatus, Logger, } from "@nestjs/common";
import { Prisma } from "@prisma/client";
function isProduction() {
    return process.env.NODE_ENV === "production";
}
function looksLikeInternalMessage(message) {
    const lower = message.toLowerCase();
    return (lower.includes("prisma") ||
        lower.includes("postgres") ||
        lower.includes("sql") ||
        lower.includes("constraint") ||
        lower.includes("stack") ||
        lower.includes("econnrefused") ||
        lower.includes("socket"));
}
let AllExceptionsFilter = (() => {
    let _classDecorators = [Catch()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AllExceptionsFilter = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AllExceptionsFilter = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new Logger("Exceptions");
        catch(exception, host) {
            const ctx = host.switchToHttp();
            const response = ctx.getResponse();
            const request = ctx.getRequest();
            const status = exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
            const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
            let code = "INTERNAL_ERROR";
            let message = "An unexpected error occurred";
            if (typeof exceptionResponse === "string") {
                message = exceptionResponse;
            }
            else if (exceptionResponse &&
                typeof exceptionResponse === "object" &&
                "message" in exceptionResponse) {
                const raw = exceptionResponse
                    .message;
                message = Array.isArray(raw) ? raw.join(", ") : (raw ?? message);
                if ("error" in exceptionResponse &&
                    typeof exceptionResponse.error === "string") {
                    code = exceptionResponse.error
                        .toUpperCase()
                        .replace(/\s+/g, "_");
                }
            }
            else if (exception instanceof Error) {
                message =
                    status === HttpStatus.INTERNAL_SERVER_ERROR
                        ? "An unexpected error occurred"
                        : exception.message;
            }
            if (exceptionResponse &&
                typeof exceptionResponse === "object" &&
                "code" in exceptionResponse &&
                typeof exceptionResponse.code === "string") {
                code = exceptionResponse.code;
            }
            if (exception instanceof Prisma.PrismaClientKnownRequestError) {
                code = "DATABASE_ERROR";
                message = isProduction()
                    ? "A database error occurred"
                    : `Database error (${exception.code})`;
                if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
                    // Prisma errors surface as 500 unless wrapped in HttpException.
                }
            }
            else if (exception instanceof Prisma.PrismaClientValidationError) {
                code = "DATABASE_ERROR";
                message = isProduction()
                    ? "A database error occurred"
                    : "Database validation error";
            }
            if (isProduction()) {
                if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
                    message = "An unexpected error occurred";
                    if (!code.startsWith("DATABASE")) {
                        code = "INTERNAL_ERROR";
                    }
                }
                else if (looksLikeInternalMessage(message)) {
                    message = "Request could not be completed";
                }
            }
            const logMessage = exception instanceof Error ? exception.message : String(exception);
            const logLine = `${request.method} ${request.url} status=${status} code=${code} requestId=${request.requestId ?? "-"} message=${logMessage}`;
            if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
                this.logger.error(logLine);
                if (exception instanceof Error && exception.stack) {
                    this.logger.debug(exception.stack);
                }
            }
            else {
                this.logger.warn(logLine);
            }
            response.status(status).json({
                success: false,
                error: {
                    code,
                    message,
                    requestId: request.requestId,
                },
            });
        }
    };
    return AllExceptionsFilter = _classThis;
})();
export { AllExceptionsFilter };
