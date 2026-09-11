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
import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException, } from "@nestjs/common";
import { createHash } from "node:crypto";
import { getRedisClient } from "../common/redis.client";
import { LOGIN_LOCKOUT_SECONDS, LOGIN_MAX_FAILURES, } from "./session.constants";
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function emailKey(email) {
    const normalized = email.trim().toLowerCase();
    const hash = createHash("sha256").update(normalized).digest("hex").slice(0, 32);
    return `login:fail:${hash}`;
}
function lockKey(email) {
    const normalized = email.trim().toLowerCase();
    const hash = createHash("sha256").update(normalized).digest("hex").slice(0, 32);
    return `login:lock:${hash}`;
}
function storeUnavailable() {
    throw new ServiceUnavailableException({
        code: "AUTH_STORE_UNAVAILABLE",
        message: "Authentication store is unavailable",
    });
}
let LoginProtectionService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var LoginProtectionService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LoginProtectionService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new Logger(LoginProtectionService.name);
        async assertLoginAllowed(email) {
            const lockedUntil = await this.getLockUntil(email);
            if (lockedUntil && lockedUntil > Date.now()) {
                throw new UnauthorizedException({
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password",
                });
            }
        }
        async recordLoginFailure(email) {
            const failures = await this.incrementFailures(email);
            const delayMs = Math.min(failures * 500, 5000);
            if (delayMs > 0 && process.env.NODE_ENV !== "test") {
                await sleep(delayMs);
            }
            if (failures >= LOGIN_MAX_FAILURES) {
                await this.setLock(email);
                this.logger.warn("Temporary login lock applied");
                return { locked: true };
            }
            return { locked: false };
        }
        async clearLoginFailures(email) {
            const fail = emailKey(email);
            const lock = lockKey(email);
            try {
                await getRedisClient().del(fail, lock);
            }
            catch {
                storeUnavailable();
            }
        }
        async getLockUntil(email) {
            const key = lockKey(email);
            try {
                const ttl = await getRedisClient().ttl(key);
                if (ttl > 0)
                    return Date.now() + ttl * 1000;
                return null;
            }
            catch {
                storeUnavailable();
            }
        }
        async setLock(email) {
            const key = lockKey(email);
            try {
                await getRedisClient().setex(key, LOGIN_LOCKOUT_SECONDS, "1");
            }
            catch {
                storeUnavailable();
            }
        }
        async incrementFailures(email) {
            const key = emailKey(email);
            const windowSeconds = LOGIN_LOCKOUT_SECONDS;
            try {
                const redis = getRedisClient();
                const count = await redis.incr(key);
                if (count === 1) {
                    await redis.expire(key, windowSeconds);
                }
                return count;
            }
            catch {
                storeUnavailable();
            }
        }
    };
    return LoginProtectionService = _classThis;
})();
export { LoginProtectionService };
