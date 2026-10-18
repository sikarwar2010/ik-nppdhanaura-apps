import { Transform, Type } from "class-transformer"
import {
  IsArray,
  IsBoolean,
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
const DAY = /^\d{4}-\d{2}-\d{2}$/
const RATE = /^(?:0|[1-9]\d{0,3})(?:\.\d{1,4})?$/

export class UpsertAssessmentYearDto {
  @IsString()
  @MinLength(1)
  referenceEntryId!: string

  @IsString()
  @Matches(DAY)
  startsOn!: string

  @IsString()
  @Matches(DAY)
  endsOn!: string

  @IsIn(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"])
  status!: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
}

export class UpdateAssessmentYearDto {
  @IsOptional()
  @IsString()
  @Matches(DAY)
  startsOn?: string

  @IsOptional()
  @IsString()
  @Matches(DAY)
  endsOn?: string

  @IsOptional()
  @IsIn(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"])
  status?: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
}

export class RebatePolicyDto {
  @IsString()
  @MinLength(3)
  name!: string

  @IsString()
  @MinLength(1)
  assessmentYearId!: string

  @IsIn(["PERCENTAGE", "FIXED_AMOUNT"])
  rebateType!: "PERCENTAGE" | "FIXED_AMOUNT"

  @IsOptional()
  @IsString()
  @Matches(RATE)
  rate?: string

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  fixedAmount?: string

  @IsBoolean()
  includePropertyTax!: boolean

  @IsBoolean()
  includeWaterTax!: boolean

  @IsBoolean()
  includeDrainageTax!: boolean

  @IsBoolean()
  includeArrears!: boolean

  @IsBoolean()
  includePenalty!: boolean

  @IsBoolean()
  includeInterest!: boolean

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  maxAmount?: string

  @IsOptional()
  @IsString()
  @Matches(DAY)
  startsOn?: string

  @IsOptional()
  @IsString()
  @Matches(DAY)
  endsOn?: string

  @IsOptional()
  @IsString()
  @Matches(DAY)
  paymentDeadline?: string
}

export class PenaltyPolicyDto {
  @IsString()
  @MinLength(3)
  name!: string

  @IsString()
  @MinLength(1)
  assessmentYearId!: string

  @IsIn(["PERCENT_OF_PROPERTY_TAX", "PERCENT_OF_ELIGIBLE_BASE", "FIXED_AMOUNT"])
  penaltyType!:
    | "PERCENT_OF_PROPERTY_TAX"
    | "PERCENT_OF_ELIGIBLE_BASE"
    | "FIXED_AMOUNT"

  @IsOptional()
  @IsString()
  @Matches(RATE)
  rate?: string

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  fixedAmount?: string

  @IsIn(["ON_ASSESSMENT", "DUE_DATE_PASSED"])
  trigger!: "ON_ASSESSMENT" | "DUE_DATE_PASSED"

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3650)
  graceDays?: number

  @IsOptional()
  @IsString()
  @Matches(DAY)
  dueDate?: string

  @IsBoolean()
  includePropertyTax!: boolean

  @IsBoolean()
  includeWaterTax!: boolean

  @IsBoolean()
  includeDrainageTax!: boolean

  @IsBoolean()
  includeArrears!: boolean

  @IsOptional()
  @IsBoolean()
  applyAfterRebate?: boolean

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  maxAmount?: string

  @IsOptional()
  @IsString()
  @Matches(DAY)
  startsOn?: string

  @IsOptional()
  @IsString()
  @Matches(DAY)
  endsOn?: string

  @IsOptional()
  @IsBoolean()
  recurring?: boolean
}

export class HistoricalImportRowDto {
  @IsString()
  @MinLength(1)
  propertyId!: string

  @IsString()
  @MinLength(1)
  assessmentYear!: string

  @IsOptional()
  @IsIn(["COMPONENTS", "CLOSING_ONLY"])
  balanceKind?: "COMPONENTS" | "CLOSING_ONLY"

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  propertyTax?: string

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  waterTax?: string

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  drainageTax?: string

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  penalty?: string

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  interest?: string

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  paymentsReceived?: string

  @IsOptional()
  @IsString()
  @Matches(MONEY)
  creditAmount?: string

  @IsOptional()
  @IsString()
  creditReason?: string

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

export class HistoricalImportDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  dryRun?: boolean

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoricalImportRowDto)
  rows?: HistoricalImportRowDto[]
}
