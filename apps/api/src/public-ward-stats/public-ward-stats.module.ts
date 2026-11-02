import { Module } from "@nestjs/common"

import { AuthModule } from "../auth/auth.module"
import { PrismaModule } from "../prisma/prisma.module"
import { PublicWardStatsController } from "./public-ward-stats.controller"
import { PublicSyncController } from "./public-sync.controller"
import { PublicSyncService } from "./public-sync.service"
import { PublicWardStatsService } from "./public-ward-stats.service"

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PublicWardStatsController, PublicSyncController],
  providers: [PublicWardStatsService, PublicSyncService],
  exports: [PublicSyncService, PublicWardStatsService],
})
export class PublicWardStatsModule {}
