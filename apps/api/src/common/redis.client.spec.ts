import { Logger } from "@nestjs/common"
import IORedis from "ioredis"

import {
  appRedisRetryStrategy,
  buildRedisOptions,
  closeRedisClient,
  createBullMqConnection,
  describeRedisEndpoint,
  formatRedisUnreachableError,
  getRedisClient,
  resolveRedisUrl,
} from "./redis.client"

jest.mock("ioredis", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    ping: jest.fn().mockResolvedValue("PONG"),
    quit: jest.fn().mockResolvedValue("OK"),
    disconnect: jest.fn(),
  })),
}))

const IORedisMock = IORedis as unknown as jest.Mock

describe("redis client", () => {
  afterEach(async () => {
    await closeRedisClient()
    jest.clearAllMocks()
  })

  it("redacts credentials from the endpoint description", () => {
    expect(describeRedisEndpoint("redis://:s3cret@redis.internal:6380/0")).toEqual({
      host: "redis.internal",
      port: 6380,
    })
    const message = formatRedisUnreachableError({
      REDIS_URL: "redis://:s3cret@127.0.0.1:6380",
    })
    expect(message).toBe(
      "Redis is required and is not reachable at 127.0.0.1:6380 (REDIS_URL). Start local infra with: pnpm docker:up"
    )
    expect(message).not.toContain("s3cret")
  })

  it("rejects a missing REDIS_URL", () => {
    expect(() => resolveRedisUrl({})).toThrow(/REDIS_URL is required/)
  })

  it("rejects a malformed REDIS_URL", () => {
    expect(() => describeRedisEndpoint("localhost:6380")).toThrow(
      /REDIS_URL is malformed/
    )
    expect(() => describeRedisEndpoint("http://127.0.0.1:6380")).toThrow(
      /REDIS_URL is malformed/
    )
  })

  it("stops app reconnects and forces IPv4 for localhost", () => {
    expect(appRedisRetryStrategy(1)).toBeGreaterThan(0)
    expect(appRedisRetryStrategy(4)).toBeNull()

    const local = buildRedisOptions("redis://localhost:6380", "app")
    expect(local.family).toBe(4)
    expect(local.maxRetriesPerRequest).toBe(2)
    expect(local.retryStrategy?.(4)).toBeNull()

    const ipv4 = buildRedisOptions("redis://127.0.0.1:6380", "app")
    expect(ipv4.family).toBeUndefined()

    const bull = buildRedisOptions("redis://redis:6379", "bullmq")
    expect(bull.maxRetriesPerRequest).toBeNull()
    expect(bull.retryStrategy).toBeUndefined()
    expect(bull.family).toBeUndefined()
  })

  it("opens BullMQ with unlimited command retries and an error listener", () => {
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined)
    const connection = createBullMqConnection({
      REDIS_URL: "redis://:s3cret@127.0.0.1:6380",
    })

    expect(IORedisMock).toHaveBeenCalledWith(
      "redis://:s3cret@127.0.0.1:6380",
      expect.objectContaining({ maxRetriesPerRequest: null })
    )

    const on = connection.on as unknown as jest.Mock
    const errorHandler = on.mock.calls.find((call) => call[0] === "error")?.[1] as
      | ((error: Error) => void)
      | undefined
    expect(errorHandler).toEqual(expect.any(Function))

    const failure = Object.assign(new Error("connect ECONNREFUSED"), {
      code: "ECONNREFUSED",
    })
    errorHandler?.(failure)
    errorHandler?.(failure)

    expect(warn).toHaveBeenCalledTimes(1)
    const logged = String(warn.mock.calls[0]?.[0])
    expect(logged).toContain("127.0.0.1:6380")
    expect(logged).toContain("ECONNREFUSED")
    expect(logged).not.toContain("s3cret")
    warn.mockRestore()
  })

  it("uses the bounded app retry strategy on the shared client", () => {
    getRedisClient()
    const options = IORedisMock.mock.calls[0]?.[1] as {
      maxRetriesPerRequest?: number
      retryStrategy?: (times: number) => number | null
    }
    expect(options.maxRetriesPerRequest).toBe(2)
    expect(options.retryStrategy?.(4)).toBeNull()
  })
})
