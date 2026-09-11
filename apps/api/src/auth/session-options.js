/**
 * Portal-facing URL and cookie options for Nest-owned staff sessions.
 */
export function resolveTrustedOrigins() {
    return (process.env.CORS_ORIGIN ?? "http://localhost:3000")
        .split(",")
        .map((o) => o.trim().replace(/\/+$/, ""))
        .filter(Boolean);
}
export function resolvePublicAppUrl() {
    const raw = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
    return raw.trim().replace(/\/+$/, "");
}
export function resolveUseSecureCookies() {
    return resolvePublicAppUrl().startsWith("https://");
}
export function resolveSessionSecret() {
    const secret = process.env.SESSION_SECRET?.trim() ||
        process.env.BETTER_AUTH_SECRET?.trim();
    if (!secret || secret.length < 32) {
        throw new Error("SESSION_SECRET must be set (≥32 random chars). Generate with: openssl rand -base64 48");
    }
    return secret;
}
export function assertTrustedOrigin(originHeader) {
    if (!originHeader?.trim())
        return;
    const origin = originHeader.trim().replace(/\/+$/, "");
    const trusted = resolveTrustedOrigins();
    if (!trusted.includes(origin)) {
        throw new Error(`Untrusted origin: ${origin}`);
    }
}
