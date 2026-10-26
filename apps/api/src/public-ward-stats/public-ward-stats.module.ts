import { Module } from "@nestjs/common"

import { PrismaModule } from "../prisma/prisma.module"
import { PublicWardStatsController } from "./public-ward-stats.controller"
import { PublicWardStatsService } from "./public-ward-stats.service"

@Module({
  imports: [PrismaModule],
  controllers: [PublicWardStatsController],
  providers: [PublicWardStatsService],
})
export class PublicWardStatsModule {}
