let routesVerifiedAt = null;
let verifiedRoutes = [];
export function markRoutesVerified(results) {
    routesVerifiedAt = new Date().toISOString();
    verifiedRoutes = results;
}
export function getRoutesVerifiedState() {
    return { routesVerifiedAt, verifiedRoutes };
}
export function resetRoutesVerifiedStateForTests() {
    routesVerifiedAt = null;
    verifiedRoutes = [];
}
