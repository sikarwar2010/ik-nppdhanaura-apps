import { Module } from "@nestjs/common"

import { AuthModule } from "../auth/auth.module"
import { WardsController } from "./wards.controller"
import { WardsService } from "./wards.service"

@Module({
  imports: [AuthModule],
  controllers: [WardsController],
  providers: [WardsService],
})
export class WardsModule {}
