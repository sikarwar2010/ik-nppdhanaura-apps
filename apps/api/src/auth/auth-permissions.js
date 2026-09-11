import { ForbiddenException } from "@nestjs/common";
export function hasPermission(user, code) {
    if (user.roles.includes("SUPER_ADMIN"))
        return true;
    const needed = Array.isArray(code) ? code : [code];
    return needed.every((c) => user.permissions.includes(c));
}
export function assertPermission(user, code) {
    if (hasPermission(user, code))
        return;
    const needed = Array.isArray(code) ? code : [code];
    const missing = needed.filter((c) => !user.permissions.includes(c));
    throw new ForbiddenException({
        code: "FORBIDDEN",
        message: `Missing permission: ${missing.join(", ")}`,
    });
}
export function canReadSurveyPii(user) {
    return hasPermission(user, "survey:pii:read");
}
