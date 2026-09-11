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
import { Controller, Get, Post, } from "@nestjs/common";
import { PaymentMode } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, } from "class-validator";
import { Public, SkipCsrf, RequirePermission, } from "../auth/auth.decorators";
let CreateOnlineDto = (() => {
    let _amount_decorators;
    let _amount_initializers = [];
    let _amount_extraInitializers = [];
    let _surveyId_decorators;
    let _surveyId_initializers = [];
    let _surveyId_extraInitializers = [];
    let _wardId_decorators;
    let _wardId_initializers = [];
    let _wardId_extraInitializers = [];
    let _payerName_decorators;
    let _payerName_initializers = [];
    let _payerName_extraInitializers = [];
    let _payerMobile_decorators;
    let _payerMobile_initializers = [];
    let _payerMobile_extraInitializers = [];
    let _payerEmail_decorators;
    let _payerEmail_initializers = [];
    let _payerEmail_extraInitializers = [];
    return class CreateOnlineDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _amount_decorators = [Type(() => Number), IsNumber(), Min(1)];
            _surveyId_decorators = [IsOptional(), IsString()];
            _wardId_decorators = [IsOptional(), IsString()];
            _payerName_decorators = [IsOptional(), IsString()];
            _payerMobile_decorators = [IsOptional(), IsString()];
            _payerEmail_decorators = [IsOptional(), IsString()];
            __esDecorate(null, null, _amount_decorators, { kind: "field", name: "amount", static: false, private: false, access: { has: obj => "amount" in obj, get: obj => obj.amount, set: (obj, value) => { obj.amount = value; } }, metadata: _metadata }, _amount_initializers, _amount_extraInitializers);
            __esDecorate(null, null, _surveyId_decorators, { kind: "field", name: "surveyId", static: false, private: false, access: { has: obj => "surveyId" in obj, get: obj => obj.surveyId, set: (obj, value) => { obj.surveyId = value; } }, metadata: _metadata }, _surveyId_initializers, _surveyId_extraInitializers);
            __esDecorate(null, null, _wardId_decorators, { kind: "field", name: "wardId", static: false, private: false, access: { has: obj => "wardId" in obj, get: obj => obj.wardId, set: (obj, value) => { obj.wardId = value; } }, metadata: _metadata }, _wardId_initializers, _wardId_extraInitializers);
            __esDecorate(null, null, _payerName_decorators, { kind: "field", name: "payerName", static: false, private: false, access: { has: obj => "payerName" in obj, get: obj => obj.payerName, set: (obj, value) => { obj.payerName = value; } }, metadata: _metadata }, _payerName_initializers, _payerName_extraInitializers);
            __esDecorate(null, null, _payerMobile_decorators, { kind: "field", name: "payerMobile", static: false, private: false, access: { has: obj => "payerMobile" in obj, get: obj => obj.payerMobile, set: (obj, value) => { obj.payerMobile = value; } }, metadata: _metadata }, _payerMobile_initializers, _payerMobile_extraInitializers);
            __esDecorate(null, null, _payerEmail_decorators, { kind: "field", name: "payerEmail", static: false, private: false, access: { has: obj => "payerEmail" in obj, get: obj => obj.payerEmail, set: (obj, value) => { obj.payerEmail = value; } }, metadata: _metadata }, _payerEmail_initializers, _payerEmail_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        amount = __runInitializers(this, _amount_initializers, void 0);
        surveyId = (__runInitializers(this, _amount_extraInitializers), __runInitializers(this, _surveyId_initializers, void 0));
        wardId = (__runInitializers(this, _surveyId_extraInitializers), __runInitializers(this, _wardId_initializers, void 0));
        payerName = (__runInitializers(this, _wardId_extraInitializers), __runInitializers(this, _payerName_initializers, void 0));
        payerMobile = (__runInitializers(this, _payerName_extraInitializers), __runInitializers(this, _payerMobile_initializers, void 0));
        payerEmail = (__runInitializers(this, _payerMobile_extraInitializers), __runInitializers(this, _payerEmail_initializers, void 0));
        constructor() {
            __runInitializers(this, _payerEmail_extraInitializers);
        }
    };
})();
let CreateOfflineDto = (() => {
    let _amount_decorators;
    let _amount_initializers = [];
    let _amount_extraInitializers = [];
    let _paymentMode_decorators;
    let _paymentMode_initializers = [];
    let _paymentMode_extraInitializers = [];
    let _surveyId_decorators;
    let _surveyId_initializers = [];
    let _surveyId_extraInitializers = [];
    let _wardId_decorators;
    let _wardId_initializers = [];
    let _wardId_extraInitializers = [];
    let _payerName_decorators;
    let _payerName_initializers = [];
    let _payerName_extraInitializers = [];
    let _payerMobile_decorators;
    let _payerMobile_initializers = [];
    let _payerMobile_extraInitializers = [];
    let _receiptNumber_decorators;
    let _receiptNumber_initializers = [];
    let _receiptNumber_extraInitializers = [];
    let _collectionDate_decorators;
    let _collectionDate_initializers = [];
    let _collectionDate_extraInitializers = [];
    let _chequeDdReference_decorators;
    let _chequeDdReference_initializers = [];
    let _chequeDdReference_extraInitializers = [];
    let _remarks_decorators;
    let _remarks_initializers = [];
    let _remarks_extraInitializers = [];
    return class CreateOfflineDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _amount_decorators = [Type(() => Number), IsNumber(), Min(1)];
            _paymentMode_decorators = [IsEnum(PaymentMode)];
            _surveyId_decorators = [IsString(), IsNotEmpty()];
            _wardId_decorators = [IsOptional(), IsString()];
            _payerName_decorators = [IsOptional(), IsString()];
            _payerMobile_decorators = [IsOptional(), IsString()];
            _receiptNumber_decorators = [IsOptional(), IsString()];
            _collectionDate_decorators = [IsOptional(), IsString()];
            _chequeDdReference_decorators = [IsOptional(), IsString()];
            _remarks_decorators = [IsOptional(), IsString()];
            __esDecorate(null, null, _amount_decorators, { kind: "field", name: "amount", static: false, private: false, access: { has: obj => "amount" in obj, get: obj => obj.amount, set: (obj, value) => { obj.amount = value; } }, metadata: _metadata }, _amount_initializers, _amount_extraInitializers);
            __esDecorate(null, null, _paymentMode_decorators, { kind: "field", name: "paymentMode", static: false, private: false, access: { has: obj => "paymentMode" in obj, get: obj => obj.paymentMode, set: (obj, value) => { obj.paymentMode = value; } }, metadata: _metadata }, _paymentMode_initializers, _paymentMode_extraInitializers);
            __esDecorate(null, null, _surveyId_decorators, { kind: "field", name: "surveyId", static: false, private: false, access: { has: obj => "surveyId" in obj, get: obj => obj.surveyId, set: (obj, value) => { obj.surveyId = value; } }, metadata: _metadata }, _surveyId_initializers, _surveyId_extraInitializers);
            __esDecorate(null, null, _wardId_decorators, { kind: "field", name: "wardId", static: false, private: false, access: { has: obj => "wardId" in obj, get: obj => obj.wardId, set: (obj, value) => { obj.wardId = value; } }, metadata: _metadata }, _wardId_initializers, _wardId_extraInitializers);
            __esDecorate(null, null, _payerName_decorators, { kind: "field", name: "payerName", static: false, private: false, access: { has: obj => "payerName" in obj, get: obj => obj.payerName, set: (obj, value) => { obj.payerName = value; } }, metadata: _metadata }, _payerName_initializers, _payerName_extraInitializers);
            __esDecorate(null, null, _payerMobile_decorators, { kind: "field", name: "payerMobile", static: false, private: false, access: { has: obj => "payerMobile" in obj, get: obj => obj.payerMobile, set: (obj, value) => { obj.payerMobile = value; } }, metadata: _metadata }, _payerMobile_initializers, _payerMobile_extraInitializers);
            __esDecorate(null, null, _receiptNumber_decorators, { kind: "field", name: "receiptNumber", static: false, private: false, access: { has: obj => "receiptNumber" in obj, get: obj => obj.receiptNumber, set: (obj, value) => { obj.receiptNumber = value; } }, metadata: _metadata }, _receiptNumber_initializers, _receiptNumber_extraInitializers);
            __esDecorate(null, null, _collectionDate_decorators, { kind: "field", name: "collectionDate", static: false, private: false, access: { has: obj => "collectionDate" in obj, get: obj => obj.collectionDate, set: (obj, value) => { obj.collectionDate = value; } }, metadata: _metadata }, _collectionDate_initializers, _collectionDate_extraInitializers);
            __esDecorate(null, null, _chequeDdReference_decorators, { kind: "field", name: "chequeDdReference", static: false, private: false, access: { has: obj => "chequeDdReference" in obj, get: obj => obj.chequeDdReference, set: (obj, value) => { obj.chequeDdReference = value; } }, metadata: _metadata }, _chequeDdReference_initializers, _chequeDdReference_extraInitializers);
            __esDecorate(null, null, _remarks_decorators, { kind: "field", name: "remarks", static: false, private: false, access: { has: obj => "remarks" in obj, get: obj => obj.remarks, set: (obj, value) => { obj.remarks = value; } }, metadata: _metadata }, _remarks_initializers, _remarks_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        amount = __runInitializers(this, _amount_initializers, void 0);
        paymentMode = (__runInitializers(this, _amount_extraInitializers), __runInitializers(this, _paymentMode_initializers, void 0));
        surveyId = (__runInitializers(this, _paymentMode_extraInitializers), __runInitializers(this, _surveyId_initializers, void 0));
        wardId = (__runInitializers(this, _surveyId_extraInitializers), __runInitializers(this, _wardId_initializers, void 0));
        payerName = (__runInitializers(this, _wardId_extraInitializers), __runInitializers(this, _payerName_initializers, void 0));
        payerMobile = (__runInitializers(this, _payerName_extraInitializers), __runInitializers(this, _payerMobile_initializers, void 0));
        receiptNumber = (__runInitializers(this, _payerMobile_extraInitializers), __runInitializers(this, _receiptNumber_initializers, void 0));
        collectionDate = (__runInitializers(this, _receiptNumber_extraInitializers), __runInitializers(this, _collectionDate_initializers, void 0));
        chequeDdReference = (__runInitializers(this, _collectionDate_extraInitializers), __runInitializers(this, _chequeDdReference_initializers, void 0));
        remarks = (__runInitializers(this, _chequeDdReference_extraInitializers), __runInitializers(this, _remarks_initializers, void 0));
        constructor() {
            __runInitializers(this, _remarks_extraInitializers);
        }
    };
})();
let PaymentsController = (() => {
    let _classDecorators = [Controller("api/v1/payments")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createOnline_decorators;
    let _createOffline_decorators;
    let _callback_decorators;
    let _gatewayReturnPost_decorators;
    let _gatewayReturnGet_decorators;
    let _requery_decorators;
    let _refund_decorators;
    let _list_decorators;
    let _refunds_decorators;
    let _settlements_decorators;
    let _staffReceipt_decorators;
    let _ingestSettlement_decorators;
    var PaymentsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _createOnline_decorators = [Post("online"), RequirePermission("payment:create")];
            _createOffline_decorators = [Post("offline"), RequirePermission("payment:offline:create")];
            _callback_decorators = [Public(), SkipCsrf(), Post("gateway/callback")];
            _gatewayReturnPost_decorators = [Public(), SkipCsrf(), Post("gateway/return")];
            _gatewayReturnGet_decorators = [Public(), Get("gateway/return")];
            _requery_decorators = [Post(":id/requery"), RequirePermission("payment:requery")];
            _refund_decorators = [Post(":id/refund"), RequirePermission("refund:create")];
            _list_decorators = [Get(), RequirePermission("payment:read")];
            _refunds_decorators = [Get("refunds"), RequirePermission("refund:read")];
            _settlements_decorators = [Get("settlements"), RequirePermission("settlement:read")];
            _staffReceipt_decorators = [Get(":id/receipt"), RequirePermission("payment:read")];
            _ingestSettlement_decorators = [Post("settlements/ingest"), RequirePermission("settlement:read")];
            __esDecorate(this, null, _createOnline_decorators, { kind: "method", name: "createOnline", static: false, private: false, access: { has: obj => "createOnline" in obj, get: obj => obj.createOnline }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createOffline_decorators, { kind: "method", name: "createOffline", static: false, private: false, access: { has: obj => "createOffline" in obj, get: obj => obj.createOffline }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _callback_decorators, { kind: "method", name: "callback", static: false, private: false, access: { has: obj => "callback" in obj, get: obj => obj.callback }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gatewayReturnPost_decorators, { kind: "method", name: "gatewayReturnPost", static: false, private: false, access: { has: obj => "gatewayReturnPost" in obj, get: obj => obj.gatewayReturnPost }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gatewayReturnGet_decorators, { kind: "method", name: "gatewayReturnGet", static: false, private: false, access: { has: obj => "gatewayReturnGet" in obj, get: obj => obj.gatewayReturnGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _requery_decorators, { kind: "method", name: "requery", static: false, private: false, access: { has: obj => "requery" in obj, get: obj => obj.requery }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _refund_decorators, { kind: "method", name: "refund", static: false, private: false, access: { has: obj => "refund" in obj, get: obj => obj.refund }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _refunds_decorators, { kind: "method", name: "refunds", static: false, private: false, access: { has: obj => "refunds" in obj, get: obj => obj.refunds }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _settlements_decorators, { kind: "method", name: "settlements", static: false, private: false, access: { has: obj => "settlements" in obj, get: obj => obj.settlements }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _staffReceipt_decorators, { kind: "method", name: "staffReceipt", static: false, private: false, access: { has: obj => "staffReceipt" in obj, get: obj => obj.staffReceipt }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _ingestSettlement_decorators, { kind: "method", name: "ingestSettlement", static: false, private: false, access: { has: obj => "ingestSettlement" in obj, get: obj => obj.ingestSettlement }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PaymentsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        paymentsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(paymentsService) {
            this.paymentsService = paymentsService;
        }
        async createOnline(dto, user) {
            const data = await this.paymentsService.createOnline(dto, user);
            return { success: true, data };
        }
        async createOffline(dto, user) {
            const data = await this.paymentsService.createOffline(dto, user);
            return { success: true, data };
        }
        async callback(body) {
            const data = await this.paymentsService.handleCallback(body ?? {});
            return { success: true, data };
        }
        /** Atom (or sandbox) browser return — process payload and 302 to citizen web. */
        async gatewayReturnPost(body, query, res) {
            const payload = { ...query, ...(body ?? {}) };
            const data = await this.paymentsService.handleGatewayReturn(payload);
            return res.redirect(302, data.redirectUrl);
        }
        async gatewayReturnGet(query, res) {
            const data = await this.paymentsService.handleGatewayReturn({ ...query });
            return res.redirect(302, data.redirectUrl);
        }
        async requery(id, user) {
            const data = await this.paymentsService.requery(id, user);
            return { success: true, data };
        }
        async refund(id, body, user) {
            const data = await this.paymentsService.refund(id, body.amount, body.reason, user);
            return { success: true, data };
        }
        async list(user, page, pageSize, status, paymentMode, wardId) {
            const { items, meta } = await this.paymentsService.list({
                page: Number(page ?? 1),
                pageSize: Number(pageSize ?? 20),
                status,
                paymentMode,
                wardId,
            }, user);
            return { success: true, data: items, meta };
        }
        async refunds() {
            const data = await this.paymentsService.listRefunds();
            return { success: true, data };
        }
        async settlements() {
            const data = await this.paymentsService.listSettlements();
            return { success: true, data };
        }
        async staffReceipt(id, user) {
            const data = await this.paymentsService.getStaffReceipt(id, user);
            return { success: true, data };
        }
        async ingestSettlement(body) {
            const data = await this.paymentsService.ingestSettlement(body);
            return { success: true, data };
        }
    };
    return PaymentsController = _classThis;
})();
export { PaymentsController };
