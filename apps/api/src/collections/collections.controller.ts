import {
  Controller,
  Get,
  Headers,
  Header,
  Param,
  Post,
  Body,
  Query,
  StreamableFile,
} from "@nestjs/common"

import {
  CurrentUser,
  RequirePermission,
  type AuthUser,
} from "../auth/auth.decorators"
import {
  CollectTaxDto,
  CollectionListQueryDto,
  ReceiptListQueryDto,
} from "./collections.dto"
import { CollectionsService } from "./collections.service"

@Controller("api/v1/collections")
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get("summary")
  @RequirePermission("demand:read")
  async summary(@Query() query: CollectionListQueryDto) {
    return { success: true, data: await this.collections.summary(query) }
  }

  @Get("properties/search")
  @RequirePermission("demand:read")
  async search(@Query("q") q = "", @CurrentUser() user: AuthUser) {
    return { success: true, data: await this.collections.search(q, user) }
  }

  @Get("properties")
  @RequirePermission("demand:read")
  async properties(
    @Query() query: CollectionListQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return { success: true, data: await this.collections.list(query, user) }
  }

  @Get("quote")
  @RequirePermission("demand:read")
  async quote(
    @Query("surveyId") surveyId: string,
    @Query("assessmentYearId") assessmentYearId: string,
    @CurrentUser() user: AuthUser
  ) {
    return {
      success: true,
      data: await this.collections.quote(surveyId, assessmentYearId, user),
    }
  }

  @Get("dues/export")
  @RequirePermission("report:export")
  @Header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  @Header("Content-Disposition", 'attachment; filename="outstanding-dues.xlsx"')
  async exportDues(
    @Query() query: CollectionListQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    const buffer = await this.collections.exportDues(query, user)
    return new StreamableFile(buffer)
  }

  @Get("receipts")
  @RequirePermission("demand:read")
  async receipts(@Query() query: ReceiptListQueryDto) {
    return { success: true, data: await this.collections.receipts(query) }
  }

  @Get("receipts/:id")
  @RequirePermission("demand:read")
  async receipt(@Param("id") id: string) {
    const html = await this.collections.receiptHtml(id)
    return { success: true, data: { html } }
  }

  @Get("receipts/:id/pdf")
  @RequirePermission("demand:read")
  @Header("Content-Type", "application/pdf")
  @Header("Content-Disposition", 'inline; filename="payment-receipt.pdf"')
  async receiptPdf(@Param("id") id: string) {
    const buffer = await this.collections.receiptPdf(id)
    return new StreamableFile(buffer)
  }

  @Post()
  @RequirePermission("payment:collect")
  async collect(
    @Body() dto: CollectTaxDto,
    @CurrentUser() user: AuthUser,
    @Headers("idempotency-key") idempotencyKey?: string
  ) {
    return {
      success: true,
      data: await this.collections.collect(dto, user, idempotencyKey),
    }
  }

  @Post(":id/confirm")
  @RequirePermission("payment:collect")
  async confirm(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return { success: true, data: await this.collections.confirm(id, user) }
  }
}
