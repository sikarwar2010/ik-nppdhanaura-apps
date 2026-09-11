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
import { Controller, Get, Post } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";
let PublicPropertyTaxController = (() => {
    let _classDecorators = [Public(), Controller("api/v1/public/property-tax")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _listWards_decorators;
    let _search_decorators;
    let _getDues_decorators;
    let _createPayment_decorators;
    let _getPaymentByMerch_decorators;
    let _getReceipt_decorators;
    var PublicPropertyTaxController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _listWards_decorators = [Get("wards")];
            _search_decorators = [Get("search")];
            _getDues_decorators = [Get("dues/:id")];
            _createPayment_decorators = [Post("payments")];
            _getPaymentByMerch_decorators = [Get("payments/by-merch/:merchTxnId")];
            _getReceipt_decorators = [Get("receipts/:merchTxnId")];
            __esDecorate(this, null, _listWards_decorators, { kind: "method", name: "listWards", static: false, private: false, access: { has: obj => "listWards" in obj, get: obj => obj.listWards }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _search_decorators, { kind: "method", name: "search", static: false, private: false, access: { has: obj => "search" in obj, get: obj => obj.search }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getDues_decorators, { kind: "method", name: "getDues", static: false, private: false, access: { has: obj => "getDues" in obj, get: obj => obj.getDues }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createPayment_decorators, { kind: "method", name: "createPayment", static: false, private: false, access: { has: obj => "createPayment" in obj, get: obj => obj.createPayment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getPaymentByMerch_decorators, { kind: "method", name: "getPaymentByMerch", static: false, private: false, access: { has: obj => "getPaymentByMerch" in obj, get: obj => obj.getPaymentByMerch }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getReceipt_decorators, { kind: "method", name: "getReceipt", static: false, private: false, access: { has: obj => "getReceipt" in obj, get: obj => obj.getReceipt }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PublicPropertyTaxController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        constructor(service) {
            this.service = service;
        }
        async listWards() {
            const wards = await this.service.listWards();
            return { success: true, data: wards };
        }
        async search(query) {
            const data = await this.service.search(query);
            return { success: true, data };
        }
        async getDues(id) {
            const data = await this.service.getDues(id);
            return { success: true, data };
        }
        async createPayment(body) {
            const data = await this.service.createPayment(body);
            return { success: true, data };
        }
        async getPaymentByMerch(merchTxnId, sync) {
            const data = await this.service.getPaymentByMerchTxnId(merchTxnId, sync === "1" || sync === "true");
            return { success: true, data };
        }
        async getReceipt(merchTxnId) {
            const data = await this.service.getReceipt(merchTxnId);
            return { success: true, data };
        }
    };
    return PublicPropertyTaxController = _classThis;
})();
export { PublicPropertyTaxController };
