import { ForbiddenException } from "@nestjs/common";
import { assertPermission } from "./auth-permissions";
function hasBroadResourceAccess(user) {
    return (user.roles.includes("SUPER_ADMIN") ||
        user.roles.includes("DEPARTMENT_ADMIN") ||
        user.roles.includes("CLERK"));
}
function isScopedOperator(user) {
    return user.roles.includes("OPERATOR") && !hasBroadResourceAccess(user);
}
function deny(message) {
    throw new ForbiddenException({
        code: "FORBIDDEN",
        message,
    });
}
const SURVEY_ACTION_PERMISSION = {
    read: "survey:read",
    create: "survey:create",
    update: "survey:update",
    delete: "survey:delete",
};
const PAYMENT_ACTION_PERMISSION = {
    read: "payment:read",
    create: "payment:create",
    create_offline: "payment:offline:create",
    requery: "payment:requery",
    refund: "refund:create",
};
/** Extract internal survey id from `surveys/{surveyId}/...` object keys. */
export function parseSurveyIdFromObjectKey(objectKey) {
    const normalized = objectKey.replaceAll("\\", "/").replace(/^\/+/, "");
    const match = /^surveys\/([^/]+)\//.exec(normalized);
    return match?.[1] ?? null;
}
export function assertSurveyAccess(user, survey, action) {
    assertPermission(user, SURVEY_ACTION_PERMISSION[action]);
    if (hasBroadResourceAccess(user))
        return;
    if (!isScopedOperator(user))
        return;
    if (action === "read" || action === "create")
        return;
    if (survey.createdById !== user.id) {
        deny("You can only modify surveys you created");
    }
}
export function assertPaymentAccess(user, payment, action) {
    assertPermission(user, PAYMENT_ACTION_PERMISSION[action]);
    if (hasBroadResourceAccess(user))
        return;
    // Citizen / gateway payments have no staff collector.
    if (!payment.collectedById)
        return;
    if (isScopedOperator(user) && payment.collectedById !== user.id) {
        deny("You can only access payments you collected");
    }
}
export function assertFileAccess(user, file, action, survey) {
    assertPermission(user, action === "read" ? "file:read" : "file:create");
    if (hasBroadResourceAccess(user))
        return;
    const key = file.objectKey.replaceAll("\\", "/").replace(/^\/+/, "");
    if (key.startsWith("imports/") || key.startsWith("exports/")) {
        if (isScopedOperator(user) &&
            file.createdById &&
            file.createdById !== user.id) {
            deny("You can only access your own import or export files");
        }
        return;
    }
    if (key.startsWith("surveys/")) {
        const surveyId = file.surveyId ?? parseSurveyIdFromObjectKey(key);
        if (!surveyId) {
            deny("Invalid survey file reference");
        }
        if (survey) {
            assertSurveyAccess(user, survey, action === "read" ? "read" : "update");
        }
        else if (isScopedOperator(user) &&
            file.uploadedById &&
            file.uploadedById !== user.id) {
            deny("You can only access files you uploaded");
        }
        return;
    }
    if (isScopedOperator(user)) {
        deny("You do not have access to this file");
    }
}
