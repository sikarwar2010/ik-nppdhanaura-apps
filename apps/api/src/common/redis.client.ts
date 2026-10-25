import { Injectable, Logger, type OnApplicationShutdown } from "@nestjs/common"
import IORedis, { type RedisOptions } from "ioredis"

const logger = new Logger("Redis")

const APP_COMMAND_RETRIES = 2
const APP_CONNECT_ATTEMPTS = 3
const CONNECT_TIMEOUT_MS = 2_000
const PING_TIMEOUT_MS = 5_000
const QUIT_TIMEOUT_MS = 1_000

let client: IORedis | null = null

export type RedisEndpoint = {
  host: string
  port: number
}

export function resolveRedisUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.REDIS_URL?.trim()
  if (!url) {
    throw new Error("REDIS_URL is required")
  }
  parseRedisEndpoint(url)
  return url
}

/** Host and port only. Never includes a username, password, or path. */
export function describeRedisEndpoint(url: string): RedisEndpoint {
  return parseRedisEndpoint(url)
}

export function parseRedisEndpoint(url: string): RedisEndpoint {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(
      "REDIS_URL is malformed (expected redis://host:port or rediss://host:port)"
    )
  }

  if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
    throw new Error(
      "REDIS_URL is malformed (expected redis://host:port or rediss://host:port)"
    )
  }

  if (!parsed.hostname) {
    throw new Error(
      "REDIS_URL is malformed (expected redis://host:port or rediss://host:port)"
    )
  }

  const port = parsed.port === "" ? 6379 : Number(parsed.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("REDIS_URL has an invalid port")
  }

  return { host: parsed.hostname, port }
}

/** Stop reconnecting after a few attempts so a down Redis cannot retry forever. */
export function appRedisRetryStrategy(times: number): number | null {
  if (times > APP_CONNECT_ATTEMPTS) return null
  return Math.min(times * 200, 1_000)
}

type RedisConnectOptions = RedisOptions & { family?: 4 | 6 }

export function buildRedisOptions(
  url: string,
  mode: "app" | "bullmq"
): RedisConnectOptions {
  const endpoint = parseRedisEndpoint(url)
  const options: RedisConnectOptions = {
    connectTimeout: CONNECT_TIMEOUT_MS,
    enableReadyCheck: true,
    maxRetriesPerRequest: mode === "bullmq" ? null : APP_COMMAND_RETRIES,
  }
  if (endpoint.host === "localhost") {
    options.family = 4
  }
  if (mode === "app") {
    options.retryStrategy = appRedisRetryStrategy
  }
  return options
}

export function formatRedisUnreachableError(
  env: NodeJS.ProcessEnv = process.env
): string {
  const { host, port } = parseRedisEndpoint(resolveRedisUrl(env))
  return `Redis is required and is not reachable at ${host}:${port} (REDIS_URL). Start local infra with: pnpm docker:up`
}

function attachRedisErrorLogging(connection: IORedis, endpoint: RedisEndpoint): void {
  let logged = false
  connection.on("error", (error: Error) => {
    if (logged) return
    logged = true
    const code =
      "code" in error && typeof error.code === "string" ? error.code : "REDIS_ERROR"
    logger.warn(
      `Redis connection error at ${endpoint.host}:${endpoint.port} (${code})`
    )
  })
  connection.on("ready", () => {
    logged = false
  })
}

function openRedis(url: string, mode: "app" | "bullmq"): IORedis {
  const endpoint = parseRedisEndpoint(url)
  const connection = new IORedis(url, buildRedisOptions(url, mode))
  attachRedisErrorLogging(connection, endpoint)
  return connection
}

export function getRedisClient(): IORedis {
  if (client) return client
  client = openRedis(resolveRedisUrl(), "app")
  return client
}

export function createBullMqConnection(
  env: NodeJS.ProcessEnv = process.env
): IORedis {
  return openRedis(resolveRedisUrl(env), "bullmq")
}

export async function pingRedis(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const pong = await Promise.race([
      getRedisClient().ping(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("REDIS_PING_TIMEOUT")), PING_TIMEOUT_MS)
        timer.unref()
      }),
    ])
    return pong === "PONG"
  } catch {
    return false
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function closeRedisConnection(connection: IORedis): Promise<void> {
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      connection.disconnect()
      resolve()
    }, QUIT_TIMEOUT_MS)
    timer.unref()
    connection.quit().then(
      () => {
        clearTimeout(timer)
        resolve()
      },
      () => {
        clearTimeout(timer)
        connection.disconnect()
        resolve()
      }
    )
  })
}

export async function closeRedisClient(): Promise<void> {
  if (!client) return
  const current = client
  client = null
  await closeRedisConnection(current)
}

@Injectable()
export class RedisShutdown implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await closeRedisClient()
  }
}
