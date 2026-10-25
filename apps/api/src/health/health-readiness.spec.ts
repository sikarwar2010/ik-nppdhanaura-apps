import { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import request from "supertest"
import { App } from "supertest/types"

import { HealthModule } from "./health.module"
import { HealthService } from "./health.service"
import { PrismaService } from "../prisma/prisma.service"
import { resetRoutesVerifiedStateForTests } from "./route-verification-state"

describe("health when redis is unavailable", () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    resetRoutesVerifiedStateForTests()
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: jest.fn(async () => [{ "?column?": 1 }]),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .overrideProvider(HealthService)
      .useValue({
        checkDependencies: async () => ({
          postgres: true,
          redis: false,
          routesRegistered: true,
        }),
      })
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    resetRoutesVerifiedStateForTests()
  })

  it("GET /api/v1/health does not depend on redis", () => {
    return request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true)
        expect(res.body.data.status).toBe("ok")
      })
  })

  it("GET /api/v1/health/live stays alive", () => {
    return request(app.getHttpServer())
      .get("/api/v1/health/live")
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("live")
      })
  })

  it("GET /api/v1/health/ready is 503", () => {
    return request(app.getHttpServer())
      .get("/api/v1/health/ready")
      .expect(503)
      .expect((res) => {
        expect(res.body.success).not.toBe(true)
      })
  })
})
