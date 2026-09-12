import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common"
import type { Response } from "express"

import { Public, SkipCsrf } from "../auth/auth.decorators"
import { PaymentsService } from "./payments.service"

@Controller("api/v1/payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @SkipCsrf()
  @Post("gateway/callback")
  async callback(@Body() body: Record<string, unknown>) {
    const data = await this.paymentsService.handleCallback(body ?? {})
    return { success: true, data }
  }

  /** Atom (or sandbox) browser return — process payload and 302 to citizen web. */
  @Public()
  @SkipCsrf()
  @Post("gateway/return")
  async gatewayReturnPost(
    @Body() body: Record<string, unknown>,
    @Query() query: Record<string, string | undefined>,
    @Res() res: Response
  ) {
    const payload = { ...query, ...(body ?? {}) }
    const data = await this.paymentsService.handleGatewayReturn(payload)
    return res.redirect(302, data.redirectUrl)
  }

  @Public()
  @Get("gateway/return")
  async gatewayReturnGet(
    @Query() query: Record<string, string | undefined>,
    @Res() res: Response
  ) {
    const data = await this.paymentsService.handleGatewayReturn({ ...query })
    return res.redirect(302, data.redirectUrl)
  }
}
