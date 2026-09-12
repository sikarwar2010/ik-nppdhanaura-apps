import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type { Prisma } from "@prisma/client"

import { AuditService } from "../audit/audit.service"
import type { AuthUser } from "../auth/auth.decorators"
import { PrismaService } from "../prisma/prisma.service"
import type { ClearWardSurveysDto } from "./dto/clear-ward-surveys.dto"

@Injectable()
export class WardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async clearSurveys(
    wardId: string,
    dto: ClearWardSurveysDto,
    user: AuthUser
  ) {
    const ward = await this.prisma.ward.findUnique({
      where: { id: wardId },
    })
    if (!ward) {
      throw new NotFoundException({
        code: "WARD_NOT_FOUND",
        message: "Ward not found",
      })
    }
    if (dto.confirmWardCode !== ward.code) {
      throw new BadRequestException({
        code: "WARD_CONFIRM_MISMATCH",
        message: "Ward code does not match",
      })
    }

    const now = new Date()
    const result = await this.prisma.survey.updateMany({
      where: {
        wardId: ward.id,
        deletedAt: null,
        status: { not: "DELETED" },
      },
      data: {
        status: "DELETED",
        deletedAt: now,
        updatedById: user.id,
      },
    })

    await this.audit.log({
      action: "SURVEY_DELETED",
      entity: "Ward",
      entityId: ward.id,
      actorId: user.id,
      oldValue: {
        source: "ward-clear",
        wardCode: ward.code,
        deletedCount: result.count,
      } as Prisma.InputJsonValue,
    })

    return {
      wardId: ward.id,
      wardCode: ward.code,
      deletedCount: result.count,
    }
  }
}
