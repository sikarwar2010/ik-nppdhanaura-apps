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
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuditModule } from "./audit/audit.module";
import { AuthGuard } from "./auth/auth.guard";
import { AuthModule } from "./auth/auth.module";
import { PermissionGuard } from "./auth/permission.guard";
import { RolesGuard } from "./auth/roles.guard";
import { CsrfController } from "./common/csrf.controller";
import { CsrfGuard } from "./common/csrf.guard";
import { DashboardModule } from "./dashboard/dashboard.module";
import { HealthModule } from "./health/health.module";
import { ImportsModule } from "./imports/imports.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PublicPropertyTaxModule } from "./public-property-tax/public-property-tax.module";
import { RbacModule } from "./rbac/rbac.module";
import { ReferenceModule } from "./reference/reference.module";
import { ReportsModule } from "./reports/reports.module";
import { StorageModule } from "./storage/storage.module";
import { SurveysModule } from "./surveys/surveys.module";
import { TaxConfigsModule } from "./tax-configs/tax-configs.module";
import { WardsModule } from "./wards/wards.module";
import { createObserveModule } from "@nestjs/observe";
export const { ObserveModule, ObserveInstrument } = createObserveModule();
function observeOptionsFromEnv() {
    const appKey = process.env.OBSERVE_APP_KEY?.trim();
    const appSecret = process.env.OBSERVE_APP_SECRET?.trim();
    if (!appKey || !appSecret)
        return undefined;
    return {
        appKey,
        appSecret,
        serviceId: "api",
    };
}
const observeOptions = observeOptionsFromEnv();
let AppModule = (() => {
    let _classDecorators = [Module({
            imports: [
                PrismaModule,
                AuditModule,
                StorageModule,
                HealthModule,
                AuthModule,
                WardsModule,
                SurveysModule,
                DashboardModule,
                ImportsModule,
                RbacModule,
                PaymentsModule,
                ReportsModule,
                TaxConfigsModule,
                ReferenceModule,
                PublicPropertyTaxModule,
                ...(observeOptions ? [ObserveModule.forRoot(observeOptions)] : []),
            ],
            controllers: [CsrfController],
            providers: [
                { provide: APP_GUARD, useClass: AuthGuard },
                { provide: APP_GUARD, useClass: CsrfGuard },
                { provide: APP_GUARD, useClass: PermissionGuard },
                { provide: APP_GUARD, useClass: RolesGuard },
            ],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AppModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AppModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return AppModule = _classThis;
})();
export { AppModule };
