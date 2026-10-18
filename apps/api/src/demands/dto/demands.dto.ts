import { Type } from "class-transformer"
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator"

const MONEY = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/

export class MoneyAmountDto {
  @IsString()
  @Matches(MONEY)
  amount!: string
}

export class PublishDemandDto {
  @IsString()
  @MinLength(1)
  surveyId!: string

  @IsString()
  @MinLength(1)
  assessmentYearId!: string

  @IsOptional()
  @IsString()
  @MinLength(8)
  idempotencyKey?: string
}

export class OpeningBalanceAllocationDto {
  @IsString()
  @MinLength(1)
  paymentId!: string

  @IsString()
  @Matches(MONEY)
  amount!: string
}

export class OpeningBalanceCreditDto {
  @IsString()
  @Matches(MONEY)
  amount!: string

  @IsString()
  @MinLength(3)
  reason!: string
}

export class OpeningBalanceDto {
  @IsString()
  @MinLength(1)
  surveyId!: string

  @IsString()
  @MinLength(1)
  assessmentYearId!: string

  @IsString()
  @Matches(MONEY)
  propertyTax!: string

  @IsString()
  @Matches(MONEY)
  waterTax!: string

  @IsString()
  @Matches(MONEY)
  drainageTax!: string

  @IsString()
  @Matches(MONEY)
  penalty!: string

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  interest?: string

  @IsString()
  @MinLength(3)
  reason!: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpeningBalanceAllocationDto)
  allocations?: OpeningBalanceAllocationDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpeningBalanceCreditDto)
  credits?: OpeningBalanceCreditDto[]

  @IsOptional()
  @IsString()
  @MinLength(8)
  idempotencyKey?: string

  @IsOptional()
  @IsIn(["COMPONENTS", "CLOSING_ONLY"])
  balanceKind?: "COMPONENTS" | "CLOSING_ONLY"

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  historicalPayments?: string

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  verifiedClosing?: string

  @IsOptional()
  @IsString()
  sourceReference?: string

  @IsOptional()
  @IsString()
  remarks?: string
}

export class AllocationLineDto {
  @IsString()
  @MinLength(1)
  assessmentDemandId!: string

  @IsString()
  @Matches(MONEY)
  amount!: string
}

export class AllocatePaymentDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AllocationLineDto)
  lines!: AllocationLineDto[]
}

export class CreateAdjustmentDto {
  @IsIn(["CREDIT", "DEBIT"])
  kind!: "CREDIT" | "DEBIT"

  @IsString()
  @Matches(MONEY)
  amount!: string

  @IsString()
  @MinLength(3)
  reason!: string

  @IsOptional()
  @IsString()
  reversesAdjustmentId?: string
}

export class ReversePaymentDto {
  @IsString()
  @MinLength(3)
  reason!: string
}

export class DemandHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number
}

export class OutstandingQueryDto {
  @IsString()
  @MinLength(1)
  surveyId!: string

  @IsString()
  @MinLength(1)
  assessmentYearId!: string
}
