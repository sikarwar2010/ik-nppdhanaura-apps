import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  StreamableFile,
} from "@nestjs/common"
import { ArrayMaxSize, IsArray, IsOptional, IsString, MinLength } from "class-validator"

import {
  CurrentUser,
  RequirePermission,
  Roles,
  type AuthUser,
} from "../auth/auth.decorators"
import { ProductionResetService } from "./production-reset.service"

class ResetSelectionDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10000)
  @IsString({ each: true })
  approvedPaymentIds?: string[]
}

class ResetReasonDto {
  @IsString()
  @MinLength(10)
  reason!: string
}

class ResetExecuteDto extends ResetReasonDto {
  @IsString()
  confirmationPhrase!: string
}

/** Super Admin only, on both the role and the permission. */
@Controller("api/v1/production-reset")
@Roles("SUPER_ADMIN")
@RequirePermission("system:production-reset")
export class ProductionResetController {
  constructor(private readonly reset: ProductionResetService) {}

  @Get("preview")
  async preview(@CurrentUser() user: AuthUser) {
    return { success: true, data: await this.reset.preview(user) }
  }

  @Post("preview")
  @HttpCode(200)
  async previewSelection(@Body() dto: ResetSelectionDto, @CurrentUser() user: AuthUser) {
    return { success: true, data: await this.reset.preview(user, dto.approvedPaymentIds ?? []) }
  }

  @Post("runs")
  async prepare(@Body() dto: ResetSelectionDto, @CurrentUser() user: AuthUser) {
    return { success: true, data: await this.reset.prepare(user, dto.approvedPaymentIds ?? []) }
  }

  @Post("runs/:id/backup")
  async backup(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return { success: true, data: await this.reset.createBackup(id, user) }
  }

  @Get("runs/:id/backup")
  @Header("Content-Type", "application/json")
  async download(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const { buffer, fileName } = await this.reset.downloadBackup(id, user)
    return new StreamableFile(buffer, {
      type: "application/json",
      disposition: `attachment; filename="${fileName}"`,
    })
  }

  @Post("runs/:id/request-approval")
  async requestApproval(
    @Param("id") id: string,
    @Body() dto: ResetReasonDto,
    @CurrentUser() user: AuthUser
  ) {
    return { success: true, data: await this.reset.requestApproval(id, dto.reason, user) }
  }

  @Post("runs/:id/approve")
  async approve(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return { success: true, data: await this.reset.approve(id, user) }
  }

  @Post("runs/:id/cancel")
  async cancel(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return { success: true, data: await this.reset.cancel(id, user) }
  }

  @Post("runs/:id/execute")
  async execute(
    @Param("id") id: string,
    @Body() dto: ResetExecuteDto,
    @CurrentUser() user: AuthUser
  ) {
    return { success: true, data: await this.reset.execute(id, dto, user) }
  }
}
