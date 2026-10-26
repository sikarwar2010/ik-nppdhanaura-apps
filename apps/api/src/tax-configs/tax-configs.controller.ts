import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common"

import {
  CurrentUser,
  RequirePermission,
  type AuthUser,
} from "../auth/auth.decorators"
import {
  CopyTaxToWardsDto,
  CreateTaxConfigDto,
  PublishTaxConfigDto,
  TaxPreviewDto,
  UpdateTaxConfigParamsDto,
  UpsertTaxCellsDto,
} from "./dto/tax-config.dto"
import { TaxConfigsService } from "./tax-configs.service"

@Controller("api/v1/tax-configs")
export class TaxConfigsController {
  constructor(private readonly taxConfigsService: TaxConfigsService) {}

  @Get()
  @RequirePermission("report:read")
  get(
    @Query("wardId") wardId: string,
    @Query("assessmentYearId") assessmentYearId: string
  ) {
    return this.taxConfigsService.get(wardId, assessmentYearId)
  }

  @Post()
  @RequirePermission("settings:update")
  createDraft(@Body() dto: CreateTaxConfigDto, @CurrentUser() user: AuthUser) {
    return this.taxConfigsService.createDraft(dto, user.id)
  }

  @Post("copy-to-wards")
  @RequirePermission("settings:update")
  copyToWards(@Body() dto: CopyTaxToWardsDto, @CurrentUser() user: AuthUser) {
    return this.taxConfigsService.copyToAllWards(dto, user.id)
  }

  @Patch(":id")
  @RequirePermission("settings:update")
  updateParams(
    @Param("id") id: string,
    @Body() dto: UpdateTaxConfigParamsDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.taxConfigsService.updateParams(id, dto, user.id)
  }

  @Put(":id/cells")
  @RequirePermission("settings:update")
  upsertCells(
    @Param("id") id: string,
    @Body() dto: UpsertTaxCellsDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.taxConfigsService.upsertCells(id, dto.cells ?? [], user.id)
  }

  @Get("overview")
  @RequirePermission("report:read")
  async overview(@Query("assessmentYearId") assessmentYearId: string) {
    return this.taxConfigsService.overview(assessmentYearId)
  }

  @Post("preview")
  @RequirePermission("report:read")
  preview(@Body() dto: TaxPreviewDto) {
    return this.taxConfigsService.preview(dto)
  }

  @Get(":id/versions")
  @RequirePermission("settings:update")
  versions(@Param("id") id: string) {
    return this.taxConfigsService.listVersions(id)
  }

  @Post(":id/publish")
  @RequirePermission("settings:update")
  publish(
    @Param("id") id: string,
    @Body() dto: PublishTaxConfigDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.taxConfigsService.publish(id, dto, user.id)
  }
}
