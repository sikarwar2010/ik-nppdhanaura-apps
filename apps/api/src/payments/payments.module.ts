import { Module } from "@nestjs/common"

import { AuthModule } from "../auth/auth.module"
import { DemandsModule } from "../demands/demands.module"
import { PaymentsController } from "./payments.controller"
import { PaymentsService } from "./payments.service"

@Module({
  imports: [AuthModule, DemandsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
