import { Module } from "@nestjs/common"

import { DemandsModule } from "../demands/demands.module"
import { PaymentsModule } from "../payments/payments.module"
import { PrismaModule } from "../prisma/prisma.module"
import { PublicPropertyTaxController } from "./public-property-tax.controller"
import { PublicPropertyTaxService } from "./public-property-tax.service"

@Module({
  imports: [PrismaModule, PaymentsModule, DemandsModule],
  controllers: [PublicPropertyTaxController],
  providers: [PublicPropertyTaxService],
})
export class PublicPropertyTaxModule {}
