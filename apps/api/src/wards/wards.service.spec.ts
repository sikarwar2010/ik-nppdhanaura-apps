import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"

import { AuditService } from "../audit/audit.service"
import type { AuthUser } from "../auth/auth.decorators"
import { PrismaService } from "../prisma/prisma.service"
import { WardsService } from "./wards.service"

const ward = {
  id: "ward-5",
  code: "W05",
  name: "वार्ड नंबर 5 - संसारपुर",
  number: 5,
  isActive: true,
}

const actor: AuthUser = {
  id: "user-super",
  email: "admin@example.com",
  name: "Super Admin",
  status: "ACTIVE",
  roles: ["SUPER_ADMIN"],
  permissions: ["survey:bulk-delete"],
}

describe("WardsService.clearSurveys", () => {
  let service: WardsService
  let prisma: {
    ward: { findUnique: jest.Mock }
    survey: { updateMany: jest.Mock }
    payment: { updateMany: jest.Mock; deleteMany: jest.Mock }
    taxConfig: { updateMany: jest.Mock; deleteMany: jest.Mock }
    importJob: { updateMany: jest.Mock; deleteMany: jest.Mock }
  }
  let audit: { log: jest.Mock }

  beforeEach(async () => {
    prisma = {
      ward: { findUnique: jest.fn() },
      survey: { updateMany: jest.fn() },
      payment: { updateMany: jest.fn(), deleteMany: jest.fn() },
      taxConfig: { updateMany: jest.fn(), deleteMany: jest.fn() },
      importJob: { updateMany: jest.fn(), deleteMany: jest.fn() },
    }
    audit = { log: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WardsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile()

    service = module.get(WardsService)
  })

  it("soft-deletes live surveys in the confirmed ward only", async () => {
    prisma.ward.findUnique.mockResolvedValue(ward)
    prisma.survey.updateMany.mockResolvedValue({ count: 12 })

    const result = await service.clearSurveys(
      ward.id,
      { confirmWardCode: "W05" },
      actor
    )

    expect(result).toEqual({
      wardId: ward.id,
      wardCode: "W05",
      deletedCount: 12,
    })
    expect(prisma.survey.updateMany).toHaveBeenCalledWith({
      where: {
        wardId: ward.id,
        deletedAt: null,
        status: { not: "DELETED" },
      },
      data: {
        status: "DELETED",
        deletedAt: expect.any(Date),
        updatedById: actor.id,
      },
    })
    expect(audit.log).toHaveBeenCalledTimes(1)
    expect(audit.log).toHaveBeenCalledWith({
      action: "SURVEY_DELETED",
      entity: "Ward",
      entityId: ward.id,
      actorId: actor.id,
      oldValue: {
        source: "ward-clear",
        wardCode: "W05",
        deletedCount: 12,
      },
    })
    expect(prisma.payment.updateMany).not.toHaveBeenCalled()
    expect(prisma.payment.deleteMany).not.toHaveBeenCalled()
    expect(prisma.taxConfig.updateMany).not.toHaveBeenCalled()
    expect(prisma.taxConfig.deleteMany).not.toHaveBeenCalled()
    expect(prisma.importJob.updateMany).not.toHaveBeenCalled()
    expect(prisma.importJob.deleteMany).not.toHaveBeenCalled()
  })

  it("returns deletedCount 0 for an empty ward without extra writes", async () => {
    prisma.ward.findUnique.mockResolvedValue(ward)
    prisma.survey.updateMany.mockResolvedValue({ count: 0 })

    const result = await service.clearSurveys(
      ward.id,
      { confirmWardCode: "W05" },
      actor
    )

    expect(result.deletedCount).toBe(0)
    expect(prisma.survey.updateMany).toHaveBeenCalledTimes(1)
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        oldValue: expect.objectContaining({ deletedCount: 0 }),
      })
    )
  })

  it("rejects a mismatched ward code before any survey update", async () => {
    prisma.ward.findUnique.mockResolvedValue(ward)

    try {
      await service.clearSurveys(ward.id, { confirmWardCode: "w05" }, actor)
      throw new Error("expected WARD_CONFIRM_MISMATCH")
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException)
      expect((err as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({ code: "WARD_CONFIRM_MISMATCH" })
      )
    }
    expect(prisma.survey.updateMany).not.toHaveBeenCalled()
    expect(audit.log).not.toHaveBeenCalled()
  })

  it("returns 404 when the ward does not exist", async () => {
    prisma.ward.findUnique.mockResolvedValue(null)

    try {
      await service.clearSurveys("missing", { confirmWardCode: "W05" }, actor)
      throw new Error("expected WARD_NOT_FOUND")
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException)
      expect((err as NotFoundException).getResponse()).toEqual(
        expect.objectContaining({ code: "WARD_NOT_FOUND" })
      )
    }
    expect(prisma.survey.updateMany).not.toHaveBeenCalled()
    expect(audit.log).not.toHaveBeenCalled()
  })
})
