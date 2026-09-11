import request from "supertest";
export const CRITICAL_API_ROUTES = [
    { method: "GET", path: "/api/v1/health", allowedStatuses: [200] },
    { method: "GET", path: "/api/v1/health/live", allowedStatuses: [200] },
    { method: "GET", path: "/api/v1/csrf", allowedStatuses: [200] },
    {
        method: "GET",
        path: "/api/v1/auth/me",
        allowedStatuses: [401],
    },
];
export async function verifyCriticalRoutes(app) {
    const server = app.getHttpServer();
    const results = [];
    for (const probe of CRITICAL_API_ROUTES) {
        const agent = request(server);
        const res = probe.method === "GET"
            ? await agent.get(probe.path)
            : await agent.post(probe.path).send({});
        const route = `${probe.method} ${probe.path}`;
        const ok = res.status !== 404 && probe.allowedStatuses.includes(res.status);
        results.push({ route, status: res.status, ok });
        if (!ok) {
            throw new Error(`Critical route verification failed for ${route}: status=${res.status} (allowed: ${probe.allowedStatuses.join(", ")}, 404 means route missing)`);
        }
    }
    return results;
}
