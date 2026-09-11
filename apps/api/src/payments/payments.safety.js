import { PaymentStatus } from "@prisma/client";
export function shouldReprocessProcessedCallback(input) {
    if (!input.existingProcessed)
        return true;
    if (!input.newStatusIsSuccess)
        return false;
    return (input.paymentStatus !== PaymentStatus.SUCCESS &&
        input.paymentStatus !== PaymentStatus.REFUNDED &&
        input.paymentStatus !== PaymentStatus.PARTIALLY_REFUNDED);
}
export function isAtomRefundSuccess(responseOk, statusCode) {
    return (responseOk &&
        (statusCode === "OTS0000" || statusCode.toUpperCase() === "SUCCESS"));
}
export function canApplyRefundToPayment(gatewaySuccess) {
    return gatewaySuccess;
}
export function toClientGatewayResult(result) {
    const safe = { ...result };
    delete safe.encData;
    return safe;
}
function redactRecord(value) {
    const next = {};
    for (const [key, child] of Object.entries(value)) {
        if (key === "cardDetails")
            continue;
        next[key] = redactSensitivePaymentPayload(child);
    }
    return next;
}
export function redactSensitivePaymentPayload(payload) {
    if (Array.isArray(payload)) {
        return payload.map((item) => redactSensitivePaymentPayload(item));
    }
    if (typeof payload === "object" && payload !== null) {
        return redactRecord(payload);
    }
    return payload;
}
