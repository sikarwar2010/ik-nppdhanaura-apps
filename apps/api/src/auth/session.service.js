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
import { Injectable, ServiceUnavailableException, } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { resolvePublicAppUrl, resolveUseSecureCookies } from "./session-options";
import { PASSWORD_RESET_MAX_ATTEMPTS, PASSWORD_RESET_TTL_SECONDS, SESSION_REFRESH_THRESHOLD_SECONDS, SESSION_TTL_SECONDS, sessionAbsoluteTimeoutSeconds, sessionCookieName, sessionIdleTimeoutSeconds, } from "./session.constants";
import { hashOpaqueToken } from "./token-hash";
const SESSION_TOKEN_PURPOSE = "session";
const PASSWORD_RESET_TOKEN_PURPOSE = "password-reset";
function storeUnavailable() {
    throw new ServiceUnavailableException({
        code: "AUTH_STORE_UNAVAILABLE",
        message: "Authentication store is unavailable",
    });
}
let SessionService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SessionService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SessionService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        cache;
        constructor(prisma, cache) {
            this.prisma = prisma;
            this.cache = cache;
        }
        generateSessionToken() {
            return randomBytes(32).toString("base64url");
        }
        hashSessionToken(raw) {
            return hashOpaqueToken(raw, SESSION_TOKEN_PURPOSE);
        }
        toRecord(row, rawToken) {
            return {
                id: row.id,
                rawToken,
                userId: row.userId,
                expiresAt: row.expiresAt,
                lastActiveAt: row.lastActiveAt,
                createdAt: row.createdAt,
                ipAddress: row.ipAddress,
                userAgent: row.userAgent,
            };
        }
        redisTtlSeconds(expiresAt, lastActiveAt) {
            const idleRemaining = lastActiveAt.getTime() + sessionIdleTimeoutSeconds() * 1000 - Date.now();
            const absoluteRemaining = expiresAt.getTime() - Date.now();
            return Math.max(1, Math.floor(Math.min(idleRemaining, absoluteRemaining) / 1000));
        }
        async writeCache(record) {
            try {
                await this.cache.set(this.hashSessionToken(record.rawToken), {
                    sessionId: record.id,
                    userId: record.userId,
                    createdAt: record.createdAt.toISOString(),
                    lastActivityAt: record.lastActiveAt.toISOString(),
                    expiresAt: record.expiresAt.toISOString(),
                }, this.redisTtlSeconds(record.expiresAt, record.lastActiveAt));
            }
            catch {
                storeUnavailable();
            }
        }
        async deleteCache(tokenHash) {
            try {
                await this.cache.delete(tokenHash);
            }
            catch {
                storeUnavailable();
            }
        }
        async createSession(userId, meta) {
            const rawToken = this.generateSessionToken();
            const tokenHash = this.hashSessionToken(rawToken);
            const now = new Date();
            const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
            const session = await this.prisma.session.create({
                data: {
                    tokenHash,
                    userId,
                    expiresAt,
                    lastActiveAt: now,
                    ipAddress: meta?.ipAddress ?? null,
                    userAgent: meta?.userAgent ?? null,
                },
            });
            const record = this.toRecord(session, rawToken);
            await this.writeCache(record);
            return record;
        }
        isIdleExpired(lastActiveAt) {
            const idleMs = sessionIdleTimeoutSeconds() * 1000;
            return lastActiveAt.getTime() + idleMs <= Date.now();
        }
        isAbsoluteExpired(createdAt) {
            const absoluteMs = sessionAbsoluteTimeoutSeconds() * 1000;
            return createdAt.getTime() + absoluteMs <= Date.now();
        }
        async findValidSession(rawToken) {
            if (!rawToken?.trim())
                return null;
            const tokenHash = this.hashSessionToken(rawToken);
            let cached = null;
            try {
                cached = await this.cache.get(tokenHash);
            }
            catch {
                storeUnavailable();
            }
            if (cached) {
                const lastActiveAt = new Date(cached.lastActivityAt);
                const createdAt = new Date(cached.createdAt);
                const expiresAt = new Date(cached.expiresAt);
                if (expiresAt.getTime() <= Date.now() ||
                    this.isIdleExpired(lastActiveAt) ||
                    this.isAbsoluteExpired(createdAt)) {
                    await this.deleteCache(tokenHash);
                    await this.prisma.session
                        .updateMany({
                        where: { id: cached.sessionId, revokedAt: null },
                        data: { revokedAt: new Date() },
                    })
                        .catch(() => undefined);
                    return null;
                }
                return {
                    id: cached.sessionId,
                    rawToken: rawToken.trim(),
                    userId: cached.userId,
                    expiresAt,
                    lastActiveAt,
                    createdAt,
                    ipAddress: null,
                    userAgent: null,
                };
            }
            const session = await this.prisma.session.findUnique({
                where: { tokenHash },
            });
            if (!session || session.revokedAt)
                return null;
            if (session.expiresAt.getTime() <= Date.now() ||
                this.isIdleExpired(session.lastActiveAt) ||
                this.isAbsoluteExpired(session.createdAt)) {
                await this.prisma.session
                    .updateMany({
                    where: { id: session.id, revokedAt: null },
                    data: { revokedAt: new Date() },
                })
                    .catch(() => undefined);
                return null;
            }
            const record = this.toRecord(session, rawToken.trim());
            await this.writeCache(record);
            return record;
        }
        async touchSession(session) {
            const lastActiveAt = new Date();
            const updated = { ...session, lastActiveAt };
            await this.writeCache(updated);
            await this.prisma.session
                .update({
                where: { id: session.id },
                data: { lastActiveAt },
            })
                .catch(() => undefined);
        }
        async deleteSessionByToken(rawToken) {
            if (!rawToken?.trim())
                return;
            const tokenHash = this.hashSessionToken(rawToken);
            await this.deleteCache(tokenHash);
            await this.prisma.session.updateMany({
                where: { tokenHash, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
        async deleteSessionById(sessionId, userId) {
            const row = await this.prisma.session.findFirst({
                where: { id: sessionId, userId, revokedAt: null },
            });
            if (!row)
                return false;
            await this.deleteCache(row.tokenHash);
            await this.prisma.session.update({
                where: { id: sessionId },
                data: { revokedAt: new Date() },
            });
            return true;
        }
        async revokeAllUserSessions(userId, exceptSessionId) {
            const rows = await this.prisma.session.findMany({
                where: {
                    userId,
                    revokedAt: null,
                    ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
                },
            });
            for (const row of rows) {
                await this.deleteCache(row.tokenHash);
            }
            const result = await this.prisma.session.updateMany({
                where: {
                    userId,
                    revokedAt: null,
                    ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
                },
                data: { revokedAt: new Date() },
            });
            return result.count;
        }
        async listUserSessions(userId, currentSessionId) {
            const rows = await this.prisma.session.findMany({
                where: { userId, revokedAt: null },
                orderBy: { lastActiveAt: "desc" },
            });
            return rows.map((row) => ({
                id: row.id,
                createdAt: row.createdAt,
                lastActiveAt: row.lastActiveAt,
                expiresAt: row.expiresAt,
                ipAddress: row.ipAddress,
                userAgent: row.userAgent,
                current: row.id === currentSessionId,
            }));
        }
        /**
         * Extend TTL and/or rotate token when near expiry.
         * Returns updated session with new raw token when rotation occurred.
         */
        async refreshSessionIfNeeded(session) {
            const remainingMs = session.expiresAt.getTime() - Date.now();
            const needsRefresh = remainingMs < SESSION_REFRESH_THRESHOLD_SECONDS * 1000;
            if (!needsRefresh) {
                await this.touchSession(session);
                return null;
            }
            const previousHash = this.hashSessionToken(session.rawToken);
            const rawToken = this.generateSessionToken();
            const tokenHash = this.hashSessionToken(rawToken);
            const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
            const updated = await this.prisma.session.update({
                where: { id: session.id },
                data: {
                    tokenHash,
                    expiresAt,
                    lastActiveAt: new Date(),
                },
            });
            await this.deleteCache(previousHash);
            const record = this.toRecord(updated, rawToken);
            await this.writeCache(record);
            return record;
        }
        readSessionToken(req) {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader)
                return undefined;
            const names = new Set([sessionCookieName(), "chhata_session"]);
            for (const part of cookieHeader.split(";")) {
                const trimmed = part.trim();
                for (const name of names) {
                    if (!trimmed.startsWith(`${name}=`))
                        continue;
                    const value = trimmed.slice(name.length + 1);
                    if (value.trim())
                        return decodeURIComponent(value.trim());
                }
            }
            return undefined;
        }
        attachSessionCookie(res, token, expiresAt) {
            const name = sessionCookieName();
            const parts = [
                `${name}=${encodeURIComponent(token)}`,
                "Path=/",
                "HttpOnly",
                "SameSite=Lax",
                `Expires=${expiresAt.toUTCString()}`,
                `Max-Age=${Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))}`,
            ];
            if (this.shouldUseSecureCookie(res)) {
                parts.push("Secure");
            }
            res.append("Set-Cookie", parts.join("; "));
        }
        clearSessionCookie(res) {
            const names = new Set([sessionCookieName(), "chhata_session", "__Host-session"]);
            const secure = this.shouldUseSecureCookie(res);
            for (const name of names) {
                const parts = [
                    `${name}=`,
                    "Path=/",
                    "HttpOnly",
                    "SameSite=Lax",
                    "Max-Age=0",
                    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                ];
                if (secure || name.startsWith("__Host-")) {
                    parts.push("Secure");
                }
                res.append("Set-Cookie", parts.join("; "));
            }
        }
        shouldUseSecureCookie(res) {
            if (resolveUseSecureCookies())
                return true;
            const forwarded = res.req?.headers["x-forwarded-proto"];
            const proto = (typeof forwarded === "string"
                ? forwarded.split(",")[0]?.trim()
                : undefined) ?? res.req?.protocol;
            return proto === "https";
        }
        async createPasswordResetTokenForUser(userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user?.passwordHash)
                return null;
            const rawToken = randomBytes(32).toString("base64url");
            const tokenHash = hashOpaqueToken(rawToken, PASSWORD_RESET_TOKEN_PURPOSE);
            const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000);
            await this.prisma.passwordResetToken.deleteMany({
                where: { userId, usedAt: null },
            });
            await this.prisma.passwordResetToken.create({
                data: {
                    userId,
                    tokenHash,
                    expiresAt,
                },
            });
            return {
                rawToken,
                resetUrl: buildPasswordResetUrl(rawToken),
                expiresAt,
            };
        }
        async consumePasswordResetToken(rawToken, hashNewPassword, newPassword) {
            const trimmed = rawToken.trim();
            if (!trimmed) {
                throw new Error("RESET_TOKEN_INVALID");
            }
            const tokenHash = hashOpaqueToken(trimmed, PASSWORD_RESET_TOKEN_PURPOSE);
            const record = await this.prisma.passwordResetToken.findUnique({
                where: { tokenHash },
            });
            if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
                throw new Error("RESET_TOKEN_INVALID");
            }
            if (record.failedAttempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
                throw new Error("TOO_MANY_ATTEMPTS");
            }
            const passwordHash = await hashNewPassword(newPassword);
            const usedAt = new Date();
            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: record.userId },
                    data: { passwordHash },
                }),
                this.prisma.passwordResetToken.update({
                    where: { id: record.id },
                    data: { usedAt },
                }),
                this.prisma.passwordResetToken.updateMany({
                    where: { userId: record.userId, usedAt: null },
                    data: { usedAt },
                }),
            ]);
            await this.revokeAllUserSessions(record.userId);
            return { userId: record.userId };
        }
    };
    return SessionService = _classThis;
})();
export { SessionService };
export function resolvePublicPortalOrigin() {
    return resolvePublicAppUrl();
}
export function buildPasswordResetUrl(rawToken) {
    const base = resolvePublicAppUrl();
    return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;
}
