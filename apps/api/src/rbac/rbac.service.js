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
import { BadRequestException, Injectable, NotFoundException, } from "@nestjs/common";
let RbacService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RbacService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RbacService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        audit;
        constructor(prisma, audit) {
            this.prisma = prisma;
            this.audit = audit;
        }
        async listRoles() {
            const roles = await this.prisma.role.findMany({
                include: {
                    rolePermissions: { include: { permission: true } },
                    _count: { select: { userRoles: true } },
                },
                orderBy: { name: "asc" },
            });
            return roles.map((r) => ({
                ...r,
                permissions: r.rolePermissions.map((rp) => rp.permission),
            }));
        }
        async createRole(dto, actor) {
            const role = await this.prisma.role.create({
                data: {
                    code: dto.code.toUpperCase(),
                    name: dto.name,
                    description: dto.description,
                    rolePermissions: dto.permissionIds?.length
                        ? {
                            create: dto.permissionIds.map((permissionId) => ({ permissionId })),
                        }
                        : undefined,
                },
                include: { rolePermissions: { include: { permission: true } } },
            });
            await this.audit.log({
                action: "role.create",
                entity: "Role",
                entityId: role.id,
                actorId: actor.id,
                newValue: {
                    code: role.code,
                    permissionIds: dto.permissionIds ?? [],
                },
            });
            return role;
        }
        async updateRole(id, dto, actor) {
            const before = await this.prisma.role.findUnique({
                where: { id },
                include: { rolePermissions: true },
            });
            if (!before) {
                throw new NotFoundException({
                    code: "ROLE_NOT_FOUND",
                    message: "Role not found",
                });
            }
            if (dto.permissionIds) {
                await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
                await this.prisma.rolePermission.createMany({
                    data: dto.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
                });
            }
            const role = await this.prisma.role.update({
                where: { id },
                data: {
                    name: dto.name,
                    description: dto.description,
                    code: dto.code?.toUpperCase(),
                },
                include: { rolePermissions: { include: { permission: true } } },
            });
            await this.audit.log({
                action: "role.update",
                entity: "Role",
                entityId: id,
                actorId: actor.id,
                oldValue: {
                    code: before.code,
                    permissionIds: before.rolePermissions.map((rp) => rp.permissionId),
                },
                newValue: {
                    code: role.code,
                    permissionIds: role.rolePermissions.map((rp) => rp.permissionId),
                },
            });
            return role;
        }
        async deleteRole(id, actor) {
            const role = await this.prisma.role.findUniqueOrThrow({ where: { id } });
            if (role.isSystem) {
                throw new BadRequestException({
                    code: "SYSTEM_ROLE",
                    message: "System roles cannot be deleted",
                });
            }
            await this.prisma.role.delete({ where: { id } });
            await this.audit.log({
                action: "role.delete",
                entity: "Role",
                entityId: id,
                actorId: actor.id,
                oldValue: { code: role.code, name: role.name },
            });
            return { id };
        }
        async listPermissions() {
            return this.prisma.permission.findMany({
                orderBy: [{ resource: "asc" }, { action: "asc" }],
            });
        }
    };
    return RbacService = _classThis;
})();
export { RbacService };
