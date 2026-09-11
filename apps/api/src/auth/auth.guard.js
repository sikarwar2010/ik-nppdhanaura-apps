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
import { Injectable, Logger, UnauthorizedException, } from "@nestjs/common";
import { isStaffRoleCode } from "@workspace/types";
import { IS_PUBLIC_KEY } from "./auth.decorators";
let AuthGuard = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuthGuard = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthGuard = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        reflector;
        sessionService;
        prisma;
        logger = new Logger(AuthGuard.name);
        constructor(reflector, sessionService, prisma) {
            this.reflector = reflector;
            this.sessionService = sessionService;
            this.prisma = prisma;
        }
        async canActivate(context) {
            const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (isPublic) {
                return true;
            }
            const request = context
                .switchToHttp()
                .getRequest();
            const response = context.switchToHttp().getResponse();
            const token = this.sessionService.readSessionToken(request);
            const session = await this.sessionService.findValidSession(token);
            if (!session) {
                const reason = token?.trim()
                    ? "invalid_session"
                    : "missing_session_token";
                this.logAuthDenial(request, reason);
                throw new UnauthorizedException({
                    code: reason === "missing_session_token"
                        ? "AUTH_SESSION_MISSING"
                        : "AUTH_SESSION_INVALID",
                    message: "Authentication required",
                });
            }
            const refreshed = await this.sessionService.refreshSessionIfNeeded(session);
            if (refreshed) {
                this.sessionService.attachSessionCookie(response, refreshed.rawToken, refreshed.expiresAt);
            }
            else {
                await this.sessionService.touchSession(session);
            }
            const user = await this.prisma.user.findUnique({
                where: { id: session.userId },
                include: {
                    userRoles: {
                        include: {
                            role: {
                                include: {
                                    rolePermissions: {
                                        include: { permission: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!user || user.status !== "ACTIVE") {
                this.logAuthDenial(request, "inactive_user");
                throw new UnauthorizedException({
                    code: "UNAUTHORIZED",
                    message: "User is inactive or not found",
                });
            }
            const roles = user.userRoles.map((ur) => ur.role.code);
            const permissions = [
                ...new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.code))),
            ];
            if (!roles.some((code) => isStaffRoleCode(code))) {
                this.logAuthDenial(request, "missing_staff_role");
                throw new UnauthorizedException({
                    code: "UNAUTHORIZED",
                    message: "Staff portal access requires a valid staff role",
                });
            }
            request.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                status: user.status,
                roles,
                permissions,
            };
            return true;
        }
        logAuthDenial(request, reason) {
            this.logger.warn(`auth denied route=${request.method} ${request.path} reason=${reason} requestId=${request.requestId ?? "-"} pid=${process.pid}`);
        }
    };
    return AuthGuard = _classThis;
})();
export { AuthGuard };
