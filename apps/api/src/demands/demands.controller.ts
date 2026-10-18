import { Body, Controller, Get, Header, Param, Post, Query, StreamableFile, UploadedFile, UseInterceptors } from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"

import {
  CurrentUser,
  RequirePermission,
  type AuthUser,
} from "../auth/auth.decorators"
import { DemandsService } from "./demands.service"
import {
  AllocatePaymentDto,
  CreateAdjustmentDto,
  DemandHistoryQueryDto,
  OpeningBalanceDto,
  OutstandingQueryDto,
  PublishDemandDto,
  ReversePaymentDto,
} from "./dto/demands.dto"
import { HistoricalImportDto } from "./dto/policies.dto"

@Controller("api/v1")
export class DemandsController {
  constructor(private readonly demands: DemandsService) {}

  @Get("demands/outstanding")
  @RequirePermission("demand:read")
  async outstanding(@Query() query: OutstandingQueryDto) {
    const data = await this.demands.outstanding(
      query.surveyId,
      query.assessmentYearId
    )
    return { success: true, data }
  }

  @Post("demands/publish")
  @RequirePermission("demand:publish")
  async publish(
    @Body() dto: PublishDemandDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.demands.publish(dto, user.id)
    return { success: true, data }
  }

  @Post("demands/opening-balances")
  @RequirePermission("demand:adjust")
  async openingBalance(
    @Body() dto: OpeningBalanceDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.demands.openingBalance(dto, user.id)
    return { success: true, data }
  }

  @Get("demands/opening-balances/template")
  @RequirePermission("demand:adjust")
  @Header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  @Header(
    "Content-Disposition",
    'attachment; filename="historical-opening-balances.xlsx"'
  )
  async openingTemplate() {
    const buffer = await this.demands.openingBalanceTemplate()
    return new StreamableFile(buffer)
  }

  @Post("demands/opening-balances/import")
  @RequirePermission("demand:adjust")
  @UseInterceptors(FileInterceptor("file"))
  async importOpeningBalances(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: HistoricalImportDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.demands.importOpeningBalances(
      {
        dryRun: body.dryRun === true,
        rows: body.rows ?? [],
        file: file?.buffer,
        sourceFile: file?.originalname,
      },
      user.id
    )
    return { success: true, data }
  }

  @Post("demands/opening-balances/:id/verify")
  @RequirePermission("demand:adjust")
  async verifyOpening(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.demands.verifyOpening(id, user.id)
    return { success: true, data }
  }

  @Get("demands/:id/history")
  @RequirePermission("demand:read")
  async history(
    @Param("id") id: string,
    @Query() query: DemandHistoryQueryDto
  ) {
    const { items, meta } = await this.demands.history(
      id,
      query.page ?? 1,
      query.pageSize ?? 20
    )
    return { success: true, data: items, meta }
  }

  @Post("demands/:id/adjustments")
  @RequirePermission("demand:adjust")
  async adjust(
    @Param("id") id: string,
    @Body() dto: CreateAdjustmentDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.demands.adjust(id, dto, user.id)
    return { success: true, data }
  }

  @Post("payments/:id/allocations")
  @RequirePermission("payment:allocate")
  async allocate(
    @Param("id") id: string,
    @Body() dto: AllocatePaymentDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.demands.allocate(id, dto, user.id)
    return { success: true, data }
  }

  @Post("payments/:id/reversals")
  @RequirePermission("payment:reverse")
  async reverse(
    @Param("id") id: string,
    @Body() dto: ReversePaymentDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.demands.reversePayment(id, dto, user.id)
    return { success: true, data }
  }
}
