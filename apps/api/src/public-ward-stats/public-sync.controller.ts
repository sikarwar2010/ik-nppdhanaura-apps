import { Body, Controller, Get, Post } from "@nestjs/common"
import { IsOptional, IsString } from "class-validator"

import {
  CurrentUser,
  RequirePermission,
  type AuthUser,
} from "../auth/auth.decorators"
import { PublicSyncService } from "./public-sync.service"

class ReconcileDto {
  @IsOptional()
  @IsString()
  assessmentYearId?: string
}

/** Staff view of website synchronisation. */
@Controller("api/v1/public-sync")
export class PublicSyncController {
  constructor(private readonly sync: PublicSyncService) {}

  @Get("status")
  @RequirePermission("report:read")
  async status() {
    return { success: true, data: await this.sync.status() }
  }

  @Post("retry")
  @RequirePermission("settings:update")
  async retry() {
    return { success: true, data: await this.sync.retryFailed() }
  }

  @Post("reconcile")
  @RequirePermission("settings:update")
  async reconcile(@Body() dto: ReconcileDto, @CurrentUser() user: AuthUser) {
    return { success: true, data: await this.sync.reconcile(dto.assessmentYearId, user.id) }
  }
}
