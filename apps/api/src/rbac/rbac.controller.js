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
import { Controller, Delete, Get, Patch, Post, } from "@nestjs/common";
import { IsArray, IsOptional, IsString, MinLength } from "class-validator";
import { RequirePermission, } from "../auth/auth.decorators";
let UpsertRoleDto = (() => {
    let _code_decorators;
    let _code_initializers = [];
    let _code_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _permissionIds_decorators;
    let _permissionIds_initializers = [];
    let _permissionIds_extraInitializers = [];
    return class UpsertRoleDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _code_decorators = [IsString(), MinLength(2)];
            _name_decorators = [IsString(), MinLength(2)];
            _description_decorators = [IsOptional(), IsString()];
            _permissionIds_decorators = [IsOptional(), IsArray()];
            __esDecorate(null, null, _code_decorators, { kind: "field", name: "code", static: false, private: false, access: { has: obj => "code" in obj, get: obj => obj.code, set: (obj, value) => { obj.code = value; } }, metadata: _metadata }, _code_initializers, _code_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _permissionIds_decorators, { kind: "field", name: "permissionIds", static: false, private: false, access: { has: obj => "permissionIds" in obj, get: obj => obj.permissionIds, set: (obj, value) => { obj.permissionIds = value; } }, metadata: _metadata }, _permissionIds_initializers, _permissionIds_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        code = __runInitializers(this, _code_initializers, void 0);
        name = (__runInitializers(this, _code_extraInitializers), __runInitializers(this, _name_initializers, void 0));
        description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        permissionIds = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _permissionIds_initializers, void 0));
        constructor() {
            __runInitializers(this, _permissionIds_extraInitializers);
        }
    };
})();
let RolesController = (() => {
    let _classDecorators = [Controller("api/v1/roles")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _create_decorators;
    let _update_decorators;
    let _remove_decorators;
    var RolesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _list_decorators = [Get(), RequirePermission("role:read")];
            _create_decorators = [Post(), RequirePermission("role:create")];
            _update_decorators = [Patch(":id"), RequirePermission("role:update")];
            _remove_decorators = [Delete(":id"), RequirePermission("role:delete")];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RolesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        rbacService = __runInitializers(this, _instanceExtraInitializers);
        constructor(rbacService) {
            this.rbacService = rbacService;
        }
        async list() {
            const data = await this.rbacService.listRoles();
            return { success: true, data };
        }
        async create(dto, actor) {
            const role = await this.rbacService.createRole(dto, actor);
            return { success: true, data: role };
        }
        async update(id, dto, actor) {
            const role = await this.rbacService.updateRole(id, dto, actor);
            return { success: true, data: role };
        }
        async remove(id, actor) {
            const data = await this.rbacService.deleteRole(id, actor);
            return { success: true, data };
        }
    };
    return RolesController = _classThis;
})();
export { RolesController };
let PermissionsController = (() => {
    let _classDecorators = [Controller("api/v1/permissions")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    var PermissionsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _list_decorators = [Get(), RequirePermission("permission:read")];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PermissionsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        rbacService = __runInitializers(this, _instanceExtraInitializers);
        constructor(rbacService) {
            this.rbacService = rbacService;
        }
        async list() {
            const permissions = await this.rbacService.listPermissions();
            return { success: true, data: permissions };
        }
    };
    return PermissionsController = _classThis;
})();
export { PermissionsController };
