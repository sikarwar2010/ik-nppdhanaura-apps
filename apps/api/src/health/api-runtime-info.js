import { readFileSync } from "node:fs";
import { join } from "node:path";
let cachedBuildId;
function readPackageVersion() {
    try {
        const pkgPath = join(__dirname, "..", "..", "package.json");
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        return pkg.version?.trim() || undefined;
    }
    catch {
        return undefined;
    }
}
export function resolveApiBuildId() {
    if (cachedBuildId)
        return cachedBuildId;
    const fromEnv = process.env.API_BUILD_ID?.trim() ||
        process.env.GIT_SHA?.trim() ||
        process.env.COMMIT_SHA?.trim();
    cachedBuildId = fromEnv || readPackageVersion() || "dev";
    return cachedBuildId;
}
export function getApiRuntimeInfo() {
    return {
        service: "api",
        buildId: resolveApiBuildId(),
        pid: process.pid,
        nodeEnv: process.env.NODE_ENV ?? "development",
    };
}
export const API_BUILD_ID_HEADER = "x-api-build-id";
export const API_PID_HEADER = "x-api-pid";
