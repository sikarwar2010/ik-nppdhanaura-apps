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
import { BadRequestException, Controller, Delete, Get, NotFoundException, Patch, Post, } from "@nestjs/common";
import { ASSIGNABLE_STAFF_ROLE_CODES, } from "@workspace/types";
import { IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength, ValidateIf, } from "class-validator";
import { RequirePermission, } from "../auth/auth.decorators";
import { PASSWORD_MIN_LENGTH } from "../auth/password-policy";
let CreateUserDto = (() => {
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    let _initialPassword_decorators;
    let _initialPassword_initializers = [];
    let _initialPassword_extraInitializers = [];
    let _phone_decorators;
    let _phone_initializers = [];
    let _phone_extraInitializers = [];
    let _roleIds_decorators;
    let _roleIds_initializers = [];
    let _roleIds_extraInitializers = [];
    let _role_decorators;
    let _role_initializers = [];
    let _role_extraInitializers = [];
    return class CreateUserDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _email_decorators = [IsEmail()];
            _name_decorators = [IsString(), MinLength(2)];
            _password_decorators = [ValidateIf((o) => !o.initialPassword), IsString(), MinLength(PASSWORD_MIN_LENGTH)];
            _initialPassword_decorators = [ValidateIf((o) => !o.password), IsString(), MinLength(PASSWORD_MIN_LENGTH)];
            _phone_decorators = [IsOptional(), IsString()];
            _roleIds_decorators = [IsOptional(), IsArray(), IsString({ each: true })];
            _role_decorators = [IsOptional(), IsIn([...ASSIGNABLE_STAFF_ROLE_CODES])];
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            __esDecorate(null, null, _initialPassword_decorators, { kind: "field", name: "initialPassword", static: false, private: false, access: { has: obj => "initialPassword" in obj, get: obj => obj.initialPassword, set: (obj, value) => { obj.initialPassword = value; } }, metadata: _metadata }, _initialPassword_initializers, _initialPassword_extraInitializers);
            __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: obj => "phone" in obj, get: obj => obj.phone, set: (obj, value) => { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
            __esDecorate(null, null, _roleIds_decorators, { kind: "field", name: "roleIds", static: false, private: false, access: { has: obj => "roleIds" in obj, get: obj => obj.roleIds, set: (obj, value) => { obj.roleIds = value; } }, metadata: _metadata }, _roleIds_initializers, _roleIds_extraInitializers);
            __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: obj => "role" in obj, get: obj => obj.role, set: (obj, value) => { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        email = __runInitializers(this, _email_initializers, void 0);
        name = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _name_initializers, void 0));
        password = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _password_initializers, void 0));
        initialPassword = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _initialPassword_initializers, void 0));
        phone = (__runInitializers(this, _initialPassword_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
        roleIds = (__runInitializers(this, _phone_extraInitializers), __runInitializers(this, _roleIds_initializers, void 0));
        role = (__runInitializers(this, _roleIds_extraInitializers), __runInitializers(this, _role_initializers, void 0));
        constructor() {
            __runInitializers(this, _role_extraInitializers);
        }
    };
})();
let UpdateUserDto = (() => {
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _phone_decorators;
    let _phone_initializers = [];
    let _phone_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _active_decorators;
    let _active_initializers = [];
    let _active_extraInitializers = [];
    let _roleIds_decorators;
    let _roleIds_initializers = [];
    let _roleIds_extraInitializers = [];
    let _role_decorators;
    let _role_initializers = [];
    let _role_extraInitializers = [];
    return class UpdateUserDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [IsOptional(), IsString()];
            _phone_decorators = [IsOptional(), IsString()];
            _status_decorators = [IsOptional(), IsIn(["ACTIVE", "INACTIVE", "SUSPENDED"])];
            _active_decorators = [IsOptional(), IsBoolean()];
            _roleIds_decorators = [IsOptional(), IsArray(), IsString({ each: true })];
            _role_decorators = [IsOptional(), IsIn([...ASSIGNABLE_STAFF_ROLE_CODES])];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: obj => "phone" in obj, get: obj => obj.phone, set: (obj, value) => { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _active_decorators, { kind: "field", name: "active", static: false, private: false, access: { has: obj => "active" in obj, get: obj => obj.active, set: (obj, value) => { obj.active = value; } }, metadata: _metadata }, _active_initializers, _active_extraInitializers);
            __esDecorate(null, null, _roleIds_decorators, { kind: "field", name: "roleIds", static: false, private: false, access: { has: obj => "roleIds" in obj, get: obj => obj.roleIds, set: (obj, value) => { obj.roleIds = value; } }, metadata: _metadata }, _roleIds_initializers, _roleIds_extraInitializers);
            __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: obj => "role" in obj, get: obj => obj.role, set: (obj, value) => { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        name = __runInitializers(this, _name_initializers, void 0);
        phone = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
        status = (__runInitializers(this, _phone_extraInitializers), __runInitializers(this, _status_initializers, void 0));
        active = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _active_initializers, void 0));
        roleIds = (__runInitializers(this, _active_extraInitializers), __runInitializers(this, _roleIds_initializers, void 0));
        role = (__runInitializers(this, _roleIds_extraInitializers), __runInitializers(this, _role_initializers, void 0));
        constructor() {
            __runInitializers(this, _role_extraInitializers);
        }
    };
})();
let UsersController = (() => {
    let _classDecorators = [Controller("api/v1/users")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _create_decorators;
    let _update_decorators;
    let _createPasswordResetLink_decorators;
    let _deactivate_decorators;
    var UsersController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _list_decorators = [Get(), RequirePermission("user:read")];
            _create_decorators = [Post(), RequirePermission("user:create")];
            _update_decorators = [Patch(":id"), RequirePermission("user:update")];
            _createPasswordResetLink_decorators = [Post(":id/password-reset-link"), RequirePermission("user:update")];
            _deactivate_decorators = [Delete(":id"), RequirePermission("user:delete")];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createPasswordResetLink_decorators, { kind: "method", name: "createPasswordResetLink", static: false, private: false, access: { has: obj => "createPasswordResetLink" in obj, get: obj => obj.createPasswordResetLink }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deactivate_decorators, { kind: "method", name: "deactivate", static: false, private: false, access: { has: obj => "deactivate" in obj, get: obj => obj.deactivate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UsersController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        usersService = __runInitializers(this, _instanceExtraInitializers);
        sessionService;
        prisma;
        audit;
        constructor(usersService, sessionService, prisma, audit) {
            this.usersService = usersService;
            this.sessionService = sessionService;
            this.prisma = prisma;
            this.audit = audit;
        }
        async list(page = "1", pageSize = "20") {
            const { items, meta } = await this.usersService.list(Number(page), Number(pageSize));
            return { success: true, data: items, meta };
        }
        async create(dto, actor) {
            const plainPassword = dto.password ?? dto.initialPassword;
            if (!plainPassword || plainPassword.length < PASSWORD_MIN_LENGTH) {
                throw new BadRequestException({
                    code: "PASSWORD_TOO_SHORT",
                    message: `Initial password must be at least ${PASSWORD_MIN_LENGTH} characters`,
                });
            }
            const data = await this.usersService.create({
                email: dto.email,
                name: dto.name,
                phone: dto.phone,
                password: plainPassword,
                roleIds: dto.roleIds,
                role: dto.role,
            }, actor);
            return { success: true, data };
        }
        async update(id, dto, actor) {
            const status = dto.active === undefined ? dto.status : dto.active ? "ACTIVE" : "INACTIVE";
            const data = await this.usersService.update(id, {
                name: dto.name,
                phone: dto.phone,
                status,
                roleIds: dto.roleIds,
                role: dto.role,
            }, actor);
            return { success: true, data };
        }
        async createPasswordResetLink(id, actor, req) {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                throw new NotFoundException({
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                });
            }
            const created = await this.sessionService.createPasswordResetTokenForUser(id);
            if (!created) {
                throw new BadRequestException({
                    code: "PASSWORD_ACCOUNT_NOT_FOUND",
                    message: "This user does not have a password account to reset",
                });
            }
            await this.audit.log({
                action: "auth.password_reset_link_created",
                entity: "User",
                entityId: id,
                actorId: actor.id,
                ipAddress: req.ip || undefined,
            });
            return {
                success: true,
                data: {
                    resetUrl: created.resetUrl,
                    expiresAt: created.expiresAt.toISOString(),
                },
            };
        }
        async deactivate(id, actor) {
            const data = await this.usersService.deactivate(id, actor);
            return { success: true, data };
        }
    };
    return UsersController = _classThis;
})();
export { UsersController };
