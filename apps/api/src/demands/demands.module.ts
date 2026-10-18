import { Module } from "@nestjs/common"

import { AuthModule } from "../auth/auth.module"
import { TaxConfigsModule } from "../tax-configs/tax-configs.module"
import { AuditModule } from "../audit/audit.module"
import { DemandsController } from "./demands.controller"
import { DemandsService } from "./demands.service"
import { PoliciesController } from "./policies.controller"
import { PoliciesService } from "./policies.service"

@Module({
  imports: [AuthModule, AuditModule, TaxConfigsModule],
  controllers: [DemandsController, PoliciesController],
  providers: [DemandsService, PoliciesService],
  exports: [DemandsService, PoliciesService],
})
export class DemandsModule {}
