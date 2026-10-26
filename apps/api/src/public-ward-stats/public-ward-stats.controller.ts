import { Controller, Get, Query } from "@nestjs/common"

import { Public } from "../auth/auth.decorators"
import { PublicWardStatsService } from "./public-ward-stats.service"

/** Read-only ward aggregates for the public website. No personal data. */
@Public()
@Controller("api/v1/public/ward-stats")
export class PublicWardStatsController {
  constructor(private readonly service: PublicWardStatsService) {}

  @Get()
  async stats(@Query("assessmentYear") assessmentYear?: string) {
    const data = await this.service.stats(assessmentYear?.slice(0, 64))
    return { success: true, data }
  }
}
