import { Module } from "@nestjs/common"

import { AuthModule } from "../auth/auth.module"
import { PrismaModule } from "../prisma/prisma.module"
import { PublicWardStatsModule } from "../public-ward-stats/public-ward-stats.module"
import { StorageModule } from "../storage/storage.module"
import { ProductionResetController } from "./production-reset.controller"
import { ProductionResetService } from "./production-reset.service"

@Module({
  imports: [AuthModule, PrismaModule, StorageModule, PublicWardStatsModule],
  controllers: [ProductionResetController],
  providers: [ProductionResetService],
})
export class ProductionResetModule {}
