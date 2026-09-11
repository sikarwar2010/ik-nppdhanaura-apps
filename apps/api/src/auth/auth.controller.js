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
import { BadRequestException, Controller, Delete, ForbiddenException, Get, Header, NotFoundException, Patch, Post, } from "@nestjs/common";
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength, } from "class-validator";
import { Public } from "./auth.decorators";
import { hashPassword, verifyPassword } from "./password-hash";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, assertPasswordPolicy, } from "./password-policy";
import { assertTrustedOrigin } from "./session-options";
let LoginDto = (() => {
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    return class LoginDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _email_decorators = [IsEmail()];
            _password_decorators = [IsString(), MaxLength(PASSWORD_MAX_LENGTH)];
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        email = __runInitializers(this, _email_initializers, void 0);
        password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
        constructor() {
            __runInitializers(this, _password_extraInitializers);
        }
    };
})();
let ChangePasswordDto = (() => {
    let _currentPassword_decorators;
    let _currentPassword_initializers = [];
    let _currentPassword_extraInitializers = [];
    let _newPassword_decorators;
    let _newPassword_initializers = [];
    let _newPassword_extraInitializers = [];
    return class ChangePasswordDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _currentPassword_decorators = [IsString()];
            _newPassword_decorators = [IsString(), MinLength(PASSWORD_MIN_LENGTH), MaxLength(PASSWORD_MAX_LENGTH)];
            __esDecorate(null, null, _currentPassword_decorators, { kind: "field", name: "currentPassword", static: false, private: false, access: { has: obj => "currentPassword" in obj, get: obj => obj.currentPassword, set: (obj, value) => { obj.currentPassword = value; } }, metadata: _metadata }, _currentPassword_initializers, _currentPassword_extraInitializers);
            __esDecorate(null, null, _newPassword_decorators, { kind: "field", name: "newPassword", static: false, private: false, access: { has: obj => "newPassword" in obj, get: obj => obj.newPassword, set: (obj, value) => { obj.newPassword = value; } }, metadata: _metadata }, _newPassword_initializers, _newPassword_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        currentPassword = __runInitializers(this, _currentPassword_initializers, void 0);
        newPassword = (__runInitializers(this, _currentPassword_extraInitializers), __runInitializers(this, _newPassword_initializers, void 0));
        constructor() {
            __runInitializers(this, _newPassword_extraInitializers);
        }
    };
})();
let ResetPasswordDto = (() => {
    let _token_decorators;
    let _token_initializers = [];
    let _token_extraInitializers = [];
    let _newPassword_decorators;
    let _newPassword_initializers = [];
    let _newPassword_extraInitializers = [];
    return class ResetPasswordDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _token_decorators = [IsString(), MinLength(16)];
            _newPassword_decorators = [IsString(), MinLength(PASSWORD_MIN_LENGTH), MaxLength(PASSWORD_MAX_LENGTH)];
            __esDecorate(null, null, _token_decorators, { kind: "field", name: "token", static: false, private: false, access: { has: obj => "token" in obj, get: obj => obj.token, set: (obj, value) => { obj.token = value; } }, metadata: _metadata }, _token_initializers, _token_extraInitializers);
            __esDecorate(null, null, _newPassword_decorators, { kind: "field", name: "newPassword", static: false, private: false, access: { has: obj => "newPassword" in obj, get: obj => obj.newPassword, set: (obj, value) => { obj.newPassword = value; } }, metadata: _metadata }, _newPassword_initializers, _newPassword_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        token = __runInitializers(this, _token_initializers, void 0);
        newPassword = (__runInitializers(this, _token_extraInitializers), __runInitializers(this, _newPassword_initializers, void 0));
        constructor() {
            __runInitializers(this, _newPassword_extraInitializers);
        }
    };
})();
let RevokeAllSessionsDto = (() => {
    let _keepCurrent_decorators;
    let _keepCurrent_initializers = [];
    let _keepCurrent_extraInitializers = [];
    return class RevokeAllSessionsDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _keepCurrent_decorators = [IsOptional(), IsBoolean()];
            __esDecorate(null, null, _keepCurrent_decorators, { kind: "field", name: "keepCurrent", static: false, private: false, access: { has: obj => "keepCurrent" in obj, get: obj => obj.keepCurrent, set: (obj, value) => { obj.keepCurrent = value; } }, metadata: _metadata }, _keepCurrent_initializers, _keepCurrent_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        keepCurrent = __runInitializers(this, _keepCurrent_initializers, void 0);
        constructor() {
            __runInitializers(this, _keepCurrent_extraInitializers);
        }
    };
})();
let AuthController = (() => {
    let _classDecorators = [Controller("api/v1/auth")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _register_decorators;
    let _login_decorators;
    let _logout_decorators;
    let _me_decorators;
    let _listSessions_decorators;
    let _revokeSession_decorators;
    let _revokeAllSessions_decorators;
    let _changePassword_decorators;
    let _forgotPasswordRequest_decorators;
    let _resetPassword_decorators;
    var AuthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _register_decorators = [Public(), Post("register")];
            _login_decorators = [Public(), Post("login")];
            _logout_decorators = [Public(), Post("logout")];
            _me_decorators = [Get("me"), Header("Cache-Control", "private, no-store")];
            _listSessions_decorators = [Get("sessions"), Header("Cache-Control", "private, no-store")];
            _revokeSession_decorators = [Delete("sessions/:id")];
            _revokeAllSessions_decorators = [Post("sessions/revoke-all")];
            _changePassword_decorators = [Patch("me/password")];
            _forgotPasswordRequest_decorators = [Public(), Post("forgot-password")];
            _resetPassword_decorators = [Public(), Post("reset-password")];
            __esDecorate(this, null, _register_decorators, { kind: "method", name: "register", static: false, private: false, access: { has: obj => "register" in obj, get: obj => obj.register }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: obj => "login" in obj, get: obj => obj.login }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _logout_decorators, { kind: "method", name: "logout", static: false, private: false, access: { has: obj => "logout" in obj, get: obj => obj.logout }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _me_decorators, { kind: "method", name: "me", static: false, private: false, access: { has: obj => "me" in obj, get: obj => obj.me }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listSessions_decorators, { kind: "method", name: "listSessions", static: false, private: false, access: { has: obj => "listSessions" in obj, get: obj => obj.listSessions }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _revokeSession_decorators, { kind: "method", name: "revokeSession", static: false, private: false, access: { has: obj => "revokeSession" in obj, get: obj => obj.revokeSession }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _revokeAllSessions_decorators, { kind: "method", name: "revokeAllSessions", static: false, private: false, access: { has: obj => "revokeAllSessions" in obj, get: obj => obj.revokeAllSessions }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _changePassword_decorators, { kind: "method", name: "changePassword", static: false, private: false, access: { has: obj => "changePassword" in obj, get: obj => obj.changePassword }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _forgotPasswordRequest_decorators, { kind: "method", name: "forgotPasswordRequest", static: false, private: false, access: { has: obj => "forgotPasswordRequest" in obj, get: obj => obj.forgotPasswordRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resetPassword_decorators, { kind: "method", name: "resetPassword", static: false, private: false, access: { has: obj => "resetPassword" in obj, get: obj => obj.resetPassword }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        authService = __runInitializers(this, _instanceExtraInitializers);
        sessionService;
        prisma;
        audit;
        constructor(authService, sessionService, prisma, audit) {
            this.authService = authService;
            this.sessionService = sessionService;
            this.prisma = prisma;
            this.audit = audit;
        }
        guardTrustedOrigin(req) {
            try {
                assertTrustedOrigin(req.headers.origin);
            }
            catch {
                throw new ForbiddenException({
                    code: "INVALID_ORIGIN",
                    message: "Request origin is not allowed",
                });
            }
        }
        register(req) {
            this.guardTrustedOrigin(req);
            throw new ForbiddenException({
                code: "AUTH_REGISTER_DISABLED",
                message: "Staff accounts are provisioned by an administrator in Settings → Users",
            });
        }
        async login(dto, req, res) {
            this.guardTrustedOrigin(req);
            const result = await this.authService.login(dto.email, dto.password, req);
            this.sessionService.attachSessionCookie(res, result.sessionToken, result.expiresAt);
            return {
                success: true,
                data: { userId: result.userId },
            };
        }
        async logout(req, res) {
            this.guardTrustedOrigin(req);
            const token = this.sessionService.readSessionToken(req);
            const session = await this.sessionService.findValidSession(token);
            await this.authService.logout(req, session?.userId);
            this.sessionService.clearSessionCookie(res);
            return { success: true, data: { signedOut: true } };
        }
        me(user) {
            return {
                success: true,
                data: user,
            };
        }
        async listSessions(user, req) {
            const token = this.sessionService.readSessionToken(req);
            const current = await this.sessionService.findValidSession(token);
            const sessions = await this.sessionService.listUserSessions(user.id, current?.id);
            return { success: true, data: { sessions } };
        }
        async revokeSession(user, sessionId, req) {
            this.guardTrustedOrigin(req);
            const removed = await this.sessionService.deleteSessionById(sessionId, user.id);
            if (!removed) {
                throw new NotFoundException({
                    code: "SESSION_NOT_FOUND",
                    message: "Session not found",
                });
            }
            await this.audit.log({
                action: "auth.session_revoked",
                entity: "Session",
                entityId: sessionId,
                actorId: user.id,
                ipAddress: req.ip || undefined,
            });
            return { success: true, data: { revoked: true } };
        }
        async revokeAllSessions(user, dto, req, res) {
            this.guardTrustedOrigin(req);
            const token = this.sessionService.readSessionToken(req);
            const current = await this.sessionService.findValidSession(token);
            const exceptId = dto.keepCurrent !== false ? current?.id : undefined;
            const count = await this.sessionService.revokeAllUserSessions(user.id, exceptId);
            await this.audit.log({
                action: "auth.logout_all",
                entity: "User",
                entityId: user.id,
                actorId: user.id,
                ipAddress: req.ip || undefined,
                metadata: { revokedCount: count },
            });
            if (dto.keepCurrent === false) {
                this.sessionService.clearSessionCookie(res);
            }
            return { success: true, data: { revokedCount: count } };
        }
        async changePassword(user, dto, req) {
            this.guardTrustedOrigin(req);
            assertPasswordPolicy(dto.newPassword);
            const dbUser = await this.prisma.user.findUnique({
                where: { id: user.id },
            });
            if (!dbUser?.passwordHash) {
                throw new BadRequestException({
                    code: "CREDENTIAL_ACCOUNT_NOT_FOUND",
                    message: "No password account found for this user",
                });
            }
            const valid = await verifyPassword(dto.currentPassword, dbUser.passwordHash);
            if (!valid) {
                throw new BadRequestException({
                    code: "INVALID_PASSWORD",
                    message: "Current password is incorrect",
                });
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: await hashPassword(dto.newPassword) },
            });
            await this.audit.log({
                action: "auth.password_change",
                entity: "User",
                entityId: user.id,
                actorId: user.id,
                ipAddress: req.ip || undefined,
            });
            return {
                success: true,
                data: { changed: true },
            };
        }
        forgotPasswordRequest(req) {
            this.guardTrustedOrigin(req);
            return {
                success: true,
                data: {
                    message: "Password recovery must be initiated by an administrator. Please contact your municipal administrator for a reset link.",
                },
            };
        }
        async resetPassword(dto, req) {
            this.guardTrustedOrigin(req);
            assertPasswordPolicy(dto.newPassword);
            let resetUserId;
            try {
                const result = await this.sessionService.consumePasswordResetToken(dto.token, hashPassword, dto.newPassword);
                resetUserId = result.userId;
            }
            catch (err) {
                const code = err instanceof Error ? err.message : "RESET_TOKEN_INVALID";
                if (code === "TOO_MANY_ATTEMPTS") {
                    throw new BadRequestException({
                        code: "PASSWORD_RESET_FAILED",
                        message: "Too many attempts. Request a new reset link.",
                    });
                }
                throw new BadRequestException({
                    code: "PASSWORD_RESET_FAILED",
                    message: "Invalid or expired reset link. Request a new one from an administrator.",
                });
            }
            await this.audit.log({
                action: "auth.password_reset",
                entity: "User",
                entityId: resetUserId,
                ipAddress: req.ip || undefined,
            });
            return {
                success: true,
                data: { reset: true },
            };
        }
    };
    return AuthController = _classThis;
})();
export { AuthController };
