import { Body, Controller, Get, Param, Post } from "@nestjs/common"

import {
  CurrentUser,
  RequirePermission,
  type AuthUser,
} from "../auth/auth.decorators"
import { PrismaService } from "../prisma/prisma.service"
import { ClearWardSurveysDto } from "./dto/clear-ward-surveys.dto"
import { WardsService } from "./wards.service"

@Controller("api/v1/wards")
export class WardsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wardsService: WardsService
  ) {}

  @Get()
  @RequirePermission("survey:read")
  async list() {
    const wards = await this.prisma.ward.findMany({
      where: { isActive: true },
      orderBy: { number: "asc" },
      include: {
        _count: {
          select: {
            surveys: {
              where: { deletedAt: null, status: { not: "DELETED" } },
            },
          },
        },
      },
    })
    return {
      success: true,
      data: wards.map((ward) => ({
        id: ward.id,
        code: ward.code,
        name: ward.name,
        number: ward.number,
        isActive: ward.isActive,
        surveyCount: ward._count.surveys,
      })),
    }
  }

  @Post(":wardId/clear-surveys")
  @RequirePermission("survey:bulk-delete")
  async clearSurveys(
    @Param("wardId") wardId: string,
    @Body() dto: ClearWardSurveysDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.wardsService.clearSurveys(wardId, dto, user)
    return { success: true, data }
  }
}
