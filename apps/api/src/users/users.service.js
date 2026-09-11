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
import { BadRequestException, ConflictException, Injectable, NotFoundException, } from "@nestjs/common";
import { ASSIGNABLE_STAFF_ROLE_CODES, } from "@workspace/types";
import { hashPassword } from "../auth/password-hash";
let UsersService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UsersService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UsersService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        sessionService;
        audit;
        constructor(prisma, sessionService, audit) {
            this.prisma = prisma;
            this.sessionService = sessionService;
            this.audit = audit;
        }
        toSafeUser(user) {
            const { passwordHash, userRoles, ...rest } = user;
            void passwordHash;
            return {
                ...rest,
                roles: userRoles.map((ur) => ur.role),
            };
        }
        async resolveRoleIds(roleIds, roleCode) {
            if (roleIds?.length) {
                const roles = await this.prisma.role.findMany({
                    where: { id: { in: roleIds } },
                });
                for (const r of roles) {
                    if (!ASSIGNABLE_STAFF_ROLE_CODES.includes(r.code)) {
                        throw new BadRequestException({
                            code: "INVALID_ROLE",
                            message: `Role ${r.code} cannot be assigned via staff provisioning`,
                        });
                    }
                }
                return roleIds;
            }
            if (roleCode) {
                const role = await this.prisma.role.findUnique({
                    where: { code: roleCode },
                });
                if (!role) {
                    throw new BadRequestException({
                        code: "INVALID_ROLE",
                        message: `Role ${roleCode} not found`,
                    });
                }
                return [role.id];
            }
            const operator = await this.prisma.role.findUnique({
                where: { code: "OPERATOR" },
            });
            return operator ? [operator.id] : [];
        }
        async list(page, pageSize) {
            const [total, items] = await this.prisma.$transaction([
                this.prisma.user.count(),
                this.prisma.user.findMany({
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { createdAt: "desc" },
                    include: {
                        userRoles: { include: { role: true } },
                    },
                }),
            ]);
            return {
                items: items.map((u) => this.toSafeUser(u)),
                meta: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize) || 1,
                },
            };
        }
        async create(input, actor) {
            const email = input.email.trim().toLowerCase();
            const existing = await this.prisma.user.findUnique({ where: { email } });
            if (existing) {
                throw new ConflictException({
                    code: "USER_EMAIL_EXISTS",
                    message: "A user with this email already exists",
                });
            }
            const hashed = await hashPassword(input.password);
            const roleIds = await this.resolveRoleIds(input.roleIds, input.role);
            const user = await this.prisma.$transaction(async (tx) => {
                const created = await tx.user.create({
                    data: {
                        email,
                        name: input.name.trim(),
                        phone: input.phone?.trim() || null,
                        emailVerified: true,
                        status: "ACTIVE",
                        passwordHash: hashed,
                    },
                });
                if (roleIds.length) {
                    await tx.userRole.createMany({
                        data: roleIds.map((roleId) => ({
                            userId: created.id,
                            roleId,
                        })),
                        skipDuplicates: true,
                    });
                }
                return tx.user.findUniqueOrThrow({
                    where: { id: created.id },
                    include: { userRoles: { include: { role: true } } },
                });
            });
            await this.audit.log({
                action: "user.create",
                entity: "User",
                entityId: user.id,
                actorId: actor.id,
                newValue: {
                    email: user.email,
                    name: user.name,
                    status: user.status,
                    roles: user.userRoles.map((ur) => ur.role.code),
                },
            });
            return this.toSafeUser(user);
        }
        async update(id, dto, actor) {
            const before = await this.prisma.user.findUnique({
                where: { id },
                include: { userRoles: { include: { role: true } } },
            });
            if (!before) {
                throw new NotFoundException({
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                });
            }
            const status = dto.status;
            const shouldRevokeSessions = status === "INACTIVE" || status === "SUSPENDED";
            const rolesChanging = Boolean(dto.roleIds?.length || dto.role);
            await this.prisma.user.update({
                where: { id },
                data: {
                    name: dto.name,
                    phone: dto.phone,
                    status,
                },
            });
            if (dto.roleIds || dto.role) {
                const roleIds = await this.resolveRoleIds(dto.roleIds, dto.role);
                await this.prisma.userRole.deleteMany({ where: { userId: id } });
                if (roleIds.length) {
                    await this.prisma.userRole.createMany({
                        data: roleIds.map((roleId) => ({ userId: id, roleId })),
                    });
                }
            }
            if (shouldRevokeSessions || rolesChanging) {
                await this.sessionService.revokeAllUserSessions(id);
            }
            const user = await this.prisma.user.findUniqueOrThrow({
                where: { id },
                include: { userRoles: { include: { role: true } } },
            });
            await this.audit.log({
                action: "user.update",
                entity: "User",
                entityId: id,
                actorId: actor.id,
                oldValue: {
                    status: before.status,
                    roles: before.userRoles.map((ur) => ur.role.code),
                },
                newValue: {
                    status: user.status,
                    roles: user.userRoles.map((ur) => ur.role.code),
                },
            });
            return this.toSafeUser(user);
        }
        async deactivate(id, actor) {
            if (id === actor.id) {
                throw new BadRequestException({
                    code: "CANNOT_DEACTIVATE_SELF",
                    message: "You cannot deactivate your own account",
                });
            }
            const before = await this.prisma.user.findUnique({
                where: { id },
                include: { userRoles: { include: { role: true } } },
            });
            if (!before) {
                throw new NotFoundException({
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                });
            }
            const user = await this.prisma.user.update({
                where: { id },
                data: { status: "INACTIVE" },
                include: { userRoles: { include: { role: true } } },
            });
            await this.sessionService.revokeAllUserSessions(id);
            await this.audit.log({
                action: "user.deactivate",
                entity: "User",
                entityId: id,
                actorId: actor.id,
                oldValue: { status: before.status },
                newValue: { status: user.status },
            });
            return this.toSafeUser(user);
        }
    };
    return UsersService = _classThis;
})();
export { UsersService };
