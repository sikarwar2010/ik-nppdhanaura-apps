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
import { Injectable, UnauthorizedException, } from "@nestjs/common";
import { isStaffRoleCode } from "@workspace/types";
import { hashPassword, shouldUpgradePasswordHash, verifyPassword, } from "./password-hash";
let AuthService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuthService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        sessionService;
        loginProtection;
        audit;
        constructor(prisma, sessionService, loginProtection, audit) {
            this.prisma = prisma;
            this.sessionService = sessionService;
            this.loginProtection = loginProtection;
            this.audit = audit;
        }
        clientIp(req) {
            return req.ip || undefined;
        }
        async login(email, password, req) {
            const normalized = email.trim().toLowerCase();
            await this.loginProtection.assertLoginAllowed(normalized);
            const user = await this.prisma.user.findUnique({
                where: { email: normalized },
                include: {
                    userRoles: { include: { role: true } },
                },
            });
            const fail = async (reason, entityId) => {
                const { locked } = await this.loginProtection.recordLoginFailure(normalized);
                await this.audit.log({
                    action: locked ? "auth.account_locked" : "auth.login_failed",
                    entity: "User",
                    entityId,
                    ipAddress: this.clientIp(req),
                    metadata: { email: normalized, reason },
                });
                throw new UnauthorizedException({
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password",
                });
            };
            if (!user?.passwordHash) {
                await fail("invalid_credentials");
            }
            const valid = await verifyPassword(password, user.passwordHash);
            if (!valid) {
                await fail("invalid_credentials", user.id);
            }
            if (user.status !== "ACTIVE") {
                await fail("user_inactive", user.id);
            }
            const roles = user.userRoles.map((ur) => ur.role.code);
            if (!roles.some((code) => isStaffRoleCode(code))) {
                await fail("not_staff", user.id);
            }
            await this.loginProtection.clearLoginFailures(normalized);
            if (shouldUpgradePasswordHash(user.passwordHash)) {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { passwordHash: await hashPassword(password) },
                });
            }
            const session = await this.sessionService.createSession(user.id, {
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            });
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            await this.audit.log({
                action: "auth.login",
                entity: "User",
                entityId: user.id,
                actorId: user.id,
                ipAddress: this.clientIp(req),
            });
            return {
                sessionToken: session.rawToken,
                expiresAt: session.expiresAt,
                userId: user.id,
                sessionId: session.id,
            };
        }
        async logout(req, actorId) {
            const token = this.sessionService.readSessionToken(req);
            await this.sessionService.deleteSessionByToken(token);
            await this.audit.log({
                action: "auth.logout",
                entity: "User",
                actorId,
                ipAddress: this.clientIp(req),
            });
        }
        async getUserPermissions(userId) {
            const userRoles = await this.prisma.userRole.findMany({
                where: { userId },
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: { permission: true },
                            },
                        },
                    },
                },
            });
            return [
                ...new Set(userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.code))),
            ];
        }
    };
    return AuthService = _classThis;
})();
export { AuthService };
