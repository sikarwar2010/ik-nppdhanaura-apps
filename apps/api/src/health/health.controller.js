var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
import { Controller, Get, ServiceUnavailableException, } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";
import { getApiRuntimeInfo } from "./api-runtime-info";
import { getRoutesVerifiedState } from "./route-verification-state";
let HealthController = (() => {
    let _classDecorators = [Public(), Controller()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _root_decorators;
    let _health_decorators;
    var HealthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _root_decorators = [Get()];
            _health_decorators = [Get("health")];
            __esDecorate(this, null, _root_decorators, { kind: "method", name: "root", static: false, private: false, access: { has: obj => "root" in obj, get: obj => obj.root }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _health_decorators, { kind: "method", name: "health", static: false, private: false, access: { has: obj => "health" in obj, get: obj => obj.health }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HealthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        root() {
            return "Hello World!";
        }
        health() {
            return { status: "ok" };
        }
        constructor() {
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return HealthController = _classThis;
})();
export { HealthController };
let HealthV1Controller = (() => {
    let _classDecorators = [Public(), Controller("api/v1")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _healthV1_decorators;
    let _live_decorators;
    let _ready_decorators;
    let _readyAlias_decorators;
    var HealthV1Controller = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _healthV1_decorators = [Get("health")];
            _live_decorators = [Get("health/live")];
            _ready_decorators = [Get("health/ready")];
            _readyAlias_decorators = [Get("ready")];
            __esDecorate(this, null, _healthV1_decorators, { kind: "method", name: "healthV1", static: false, private: false, access: { has: obj => "healthV1" in obj, get: obj => obj.healthV1 }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _live_decorators, { kind: "method", name: "live", static: false, private: false, access: { has: obj => "live" in obj, get: obj => obj.live }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _ready_decorators, { kind: "method", name: "ready", static: false, private: false, access: { has: obj => "ready" in obj, get: obj => obj.ready }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _readyAlias_decorators, { kind: "method", name: "readyAlias", static: false, private: false, access: { has: obj => "readyAlias" in obj, get: obj => obj.readyAlias }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HealthV1Controller = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        health = __runInitializers(this, _instanceExtraInitializers);
        constructor(health) {
            this.health = health;
        }
        healthV1() {
            const runtime = getApiRuntimeInfo();
            return {
                success: true,
                data: {
                    status: "ok",
                    service: runtime.service,
                    version: runtime.buildId,
                    buildId: runtime.buildId,
                    pid: runtime.pid,
                    nodeEnv: runtime.nodeEnv,
                    timestamp: new Date().toISOString(),
                },
            };
        }
        /** Liveness: process is up. Does not check dependencies. */
        live() {
            const runtime = getApiRuntimeInfo();
            return {
                success: true,
                data: {
                    status: "live",
                    service: runtime.service,
                    buildId: runtime.buildId,
                    pid: runtime.pid,
                    timestamp: new Date().toISOString(),
                },
            };
        }
        /**
         * Readiness: Nest initialized, critical routes registered, Postgres and Redis reachable.
         */
        async ready() {
            return this.readyPayload();
        }
        /** Alias kept for existing Docker healthchecks. */
        async readyAlias() {
            return this.readyPayload();
        }
        async readyPayload() {
            const runtime = getApiRuntimeInfo();
            const deps = await this.health.checkDependencies();
            if (!deps.routesRegistered || !deps.postgres || !deps.redis) {
                throw new ServiceUnavailableException({
                    code: "NOT_READY",
                    message: "API is not ready",
                    details: {
                        routesRegistered: deps.routesRegistered,
                        postgres: deps.postgres,
                        redis: deps.redis,
                    },
                });
            }
            const { routesVerifiedAt, verifiedRoutes } = getRoutesVerifiedState();
            return {
                success: true,
                data: {
                    status: "ready",
                    service: runtime.service,
                    buildId: runtime.buildId,
                    pid: runtime.pid,
                    nodeEnv: runtime.nodeEnv,
                    postgres: true,
                    redis: true,
                    routesVerifiedAt,
                    routesVerified: verifiedRoutes.map((r) => r.route),
                    timestamp: new Date().toISOString(),
                },
            };
        }
    };
    return HealthV1Controller = _classThis;
})();
export { HealthV1Controller };
