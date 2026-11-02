import { Module } from "@nestjs/common"

import { DemandsModule } from "../demands/demands.module"
import { PaymentSettlementService } from "./payment-settlement.service"

@Module({
  imports: [DemandsModule],
  providers: [PaymentSettlementService],
  exports: [PaymentSettlementService],
})
export class SettlementModule {}
