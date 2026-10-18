import { Module } from "@nestjs/common"

import { AuditModule } from "../audit/audit.module"
import { AuthModule } from "../auth/auth.module"
import { DemandsModule } from "../demands/demands.module"
import { CollectionsController } from "./collections.controller"
import { CollectionsService } from "./collections.service"

@Module({
  imports: [AuthModule, AuditModule, DemandsModule],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
