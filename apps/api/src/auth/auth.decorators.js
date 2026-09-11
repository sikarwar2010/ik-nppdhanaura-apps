import { createParamDecorator, SetMetadata, } from "@nestjs/common";
export const IS_PUBLIC_KEY = "is_public";
export const SKIP_CSRF_KEY = "skip_csrf";
export const REQUIRE_PERMISSIONS_KEY = "require_permissions";
export const REQUIRE_ROLES_KEY = "require_roles";
/** Skip global AuthGuard (login, health, public APIs, gateway callbacks). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
/** Skip CSRF for server-to-server callbacks (Atom gateway, etc.). */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
export const RequirePermission = (...permissions) => SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
/** Optional role gate (AND). Prefer @RequirePermission for security. */
export const Roles = (...roles) => SetMetadata(REQUIRE_ROLES_KEY, roles);
export const CurrentUser = createParamDecorator((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
