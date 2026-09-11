import { getRedisClient } from "../common/redis.client";
const KEY_PREFIX = "session:";
export class RedisSessionCache {
    key(tokenHash) {
        return `${KEY_PREFIX}${tokenHash}`;
    }
    async get(tokenHash) {
        const raw = await getRedisClient().get(this.key(tokenHash));
        if (!raw)
            return null;
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed.sessionId !== "string" ||
                typeof parsed.userId !== "string") {
                return null;
            }
            return parsed;
        }
        catch {
            return null;
        }
    }
    async set(tokenHash, value, ttlSeconds) {
        const ttl = Math.max(1, Math.floor(ttlSeconds));
        await getRedisClient().set(this.key(tokenHash), JSON.stringify(value), "EX", ttl);
    }
    async delete(tokenHash) {
        await getRedisClient().del(this.key(tokenHash));
    }
    async ping() {
        try {
            return (await getRedisClient().ping()) === "PONG";
        }
        catch {
            return false;
        }
    }
}
