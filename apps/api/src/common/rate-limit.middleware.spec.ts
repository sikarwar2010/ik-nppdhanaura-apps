import {
  getRateLimitMax,
  isHealthProbePath,
  RateLimitMiddleware,
} from "./rate-limit.middleware"

describe("isHealthProbePath", () => {
  it("matches Docker and ops health endpoints", () => {
    expect(isHealthProbePath("/health")).toBe(true)
    expect(isHealthProbePath("/api/v1/health")).toBe(true)
    expect(isHealthProbePath("/api/v1/health/live")).toBe(true)
    expect(isHealthProbePath("/api/v1/health/ready")).toBe(true)
    expect(isHealthProbePath("/api/v1/ready")).toBe(true)
  })

  it("strips query strings", () => {
    expect(isHealthProbePath("/api/v1/health/live?x=1")).toBe(true)
  })

  it("does not match unrelated routes", () => {
    expect(isHealthProbePath("/api/v1/auth/login")).toBe(false)
    expect(isHealthProbePath("/api/v1/surveys")).toBe(false)
  })
})

describe("getRateLimitMax", () => {
  it("keeps auth and public limits unchanged", () => {
    expect(getRateLimitMax("/api/v1/auth/login")).toBe(20)
    expect(getRateLimitMax("/api/v1/public/property-tax")).toBe(30)
    expect(getRateLimitMax("/api/v1/payments/gateway/callback")).toBe(120)
    expect(getRateLimitMax("/api/v1/surveys")).toBe(300)
  })
})

describe("RateLimitMiddleware health skip", () => {
  it("calls next without touching Redis for health probes", () => {
    const middleware = new RateLimitMiddleware()
    const next = jest.fn()
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    middleware.use(
      {
        ip: "127.0.0.1",
        path: "/api/v1/health/live",
        originalUrl: "/api/v1/health/live",
      } as never,
      res as never,
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })
})
