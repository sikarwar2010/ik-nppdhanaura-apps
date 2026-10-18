import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
} from "@nestjs/common"
import type { Response } from "express"

import {
  CurrentUser,
  RequirePermission,
  type AuthUser,
} from "../../auth/auth.decorators"
import {
  DemandNoticeCreateJobDto,
  DemandNoticeValidateDto,
} from "./demand-notice.dto"
import { DemandNoticeService } from "./demand-notice.service"

@Controller("api/v1/reports/demand-notices")
export class DemandNoticeController {
  constructor(private readonly demandNotices: DemandNoticeService) {}

  @Get("candidates")
  @RequirePermission("report:read")
  listCandidates(
    @Query("wardId") wardId: string,
    @Query("assessmentYearId") assessmentYearId: string,
    @Query("parcelNo") parcelNo?: string,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.demandNotices.listCandidates({
      wardId,
      assessmentYearId,
      parcelNo,
      q,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
  }

  @Post("validate")
  @RequirePermission("report:export")
  validate(@Body() dto: DemandNoticeValidateDto) {
    return this.demandNotices.validate(dto)
  }

  @Post("jobs")
  @RequirePermission("report:export")
  createJob(
    @Body() dto: DemandNoticeCreateJobDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.demandNotices.createJob(dto, user)
  }

  @Get("jobs/:id")
  @RequirePermission("report:read")
  getJob(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.demandNotices.getJob(id, user)
  }

  @Post("jobs/:id/cancel")
  @RequirePermission("report:export")
  cancelJob(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.demandNotices.cancelJob(id, user)
  }

  @Get("preview")
  @RequirePermission("report:read")
  @Header("Content-Type", "text/html; charset=utf-8")
  async preview(
    @Query("surveyId") surveyId: string,
    @Query("assessmentYearId") assessmentYearId: string,
    @Query("wardId") wardId: string | undefined,
    @Query("logoUrl") logoUrl: string | undefined,
    @Query("websiteDisplayHost") websiteDisplayHost: string | undefined,
    @CurrentUser() user: AuthUser,
    @Res() res: Response
  ) {
    const html = await this.demandNotices.previewHtml({
      surveyId,
      assessmentYearId,
      wardId,
      logoUrl,
      websiteDisplayHost,
      actorId: user.id,
    })
    res.type("html").send(html)
  }
}
