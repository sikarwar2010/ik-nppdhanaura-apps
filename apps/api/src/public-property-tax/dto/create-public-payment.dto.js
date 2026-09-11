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
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength, } from "class-validator";
let CreatePublicPropertyTaxPaymentDto = (() => {
    let _surveyId_decorators;
    let _surveyId_initializers = [];
    let _surveyId_extraInitializers = [];
    let _payerMobile_decorators;
    let _payerMobile_initializers = [];
    let _payerMobile_extraInitializers = [];
    let _payerEmail_decorators;
    let _payerEmail_initializers = [];
    let _payerEmail_extraInitializers = [];
    return class CreatePublicPropertyTaxPaymentDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _surveyId_decorators = [IsString(), MinLength(8), MaxLength(64)];
            _payerMobile_decorators = [IsString(), Matches(/^\d{10}$/, { message: "payerMobile must be exactly 10 digits" })];
            _payerEmail_decorators = [IsOptional(), IsEmail(), MaxLength(200)];
            __esDecorate(null, null, _surveyId_decorators, { kind: "field", name: "surveyId", static: false, private: false, access: { has: obj => "surveyId" in obj, get: obj => obj.surveyId, set: (obj, value) => { obj.surveyId = value; } }, metadata: _metadata }, _surveyId_initializers, _surveyId_extraInitializers);
            __esDecorate(null, null, _payerMobile_decorators, { kind: "field", name: "payerMobile", static: false, private: false, access: { has: obj => "payerMobile" in obj, get: obj => obj.payerMobile, set: (obj, value) => { obj.payerMobile = value; } }, metadata: _metadata }, _payerMobile_initializers, _payerMobile_extraInitializers);
            __esDecorate(null, null, _payerEmail_decorators, { kind: "field", name: "payerEmail", static: false, private: false, access: { has: obj => "payerEmail" in obj, get: obj => obj.payerEmail, set: (obj, value) => { obj.payerEmail = value; } }, metadata: _metadata }, _payerEmail_initializers, _payerEmail_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        surveyId = __runInitializers(this, _surveyId_initializers, void 0);
        payerMobile = (__runInitializers(this, _surveyId_extraInitializers), __runInitializers(this, _payerMobile_initializers, void 0));
        payerEmail = (__runInitializers(this, _payerMobile_extraInitializers), __runInitializers(this, _payerEmail_initializers, void 0));
        constructor() {
            __runInitializers(this, _payerEmail_extraInitializers);
        }
    };
})();
export { CreatePublicPropertyTaxPaymentDto };
