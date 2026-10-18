import { Module } from "@nestjs/common"

import { AuthModule } from "../auth/auth.module"
import { DemandsModule } from "../demands/demands.module"
import { TaxConfigsModule } from "../tax-configs/tax-configs.module"
import { DemandNoticeController } from "./demand-notice/demand-notice.controller"
import { DemandNoticeService } from "./demand-notice/demand-notice.service"
import { DemandNoticeWorker } from "./demand-notice/demand-notice.worker"
import { ReportsController } from "./reports.controller"

@Module({
  imports: [AuthModule, TaxConfigsModule, DemandsModule],
  controllers: [ReportsController, DemandNoticeController],
  providers: [DemandNoticeService, DemandNoticeWorker],
  exports: [DemandNoticeService],
})
export class ReportsModule {}
