import IORedis from "ioredis";
let client = null;
export function resolveRedisUrl(env = process.env) {
    const url = env.REDIS_URL?.trim();
    if (!url) {
        throw new Error("REDIS_URL is required");
    }
    return url;
}
export function getRedisClient() {
    if (client)
        return client;
    client = new IORedis(resolveRedisUrl(), {
        maxRetriesPerRequest: 2,
        enableReadyCheck: true,
        lazyConnect: false,
    });
    return client;
}
export async function pingRedis() {
    try {
        return (await getRedisClient().ping()) === "PONG";
    }
    catch {
        return false;
    }
}
export async function closeRedisClient() {
    if (!client)
        return;
    const current = client;
    client = null;
    await current.quit().catch(() => current.disconnect());
}
