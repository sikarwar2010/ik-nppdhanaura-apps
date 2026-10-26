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

/** Optional reason recorded in the audit trail for approval actions. */
export class PolicyActionDto {
  @IsOptional()
  @IsString()
  reason?: string
}

/** Create a new assessment year (catalog entry + dates) in one step. */
export class CreateAssessmentYearDto {
  /** Year label as printed on notices, e.g. 2027-2028. */
  @IsString()
  @Matches(/^\d{4}-\d{4}$/, { message: "Use the form 2027-2028" })
  label!: string

  @Matches(DAY)
  startsOn!: string

  @Matches(DAY)
  endsOn!: string

  @IsIn(["DRAFT", "ACTIVE"])
  status!: "DRAFT" | "ACTIVE"
}

export class ChargePreviewSampleDto {
  @IsOptional() @Matches(MONEY) propertyTax?: string
  @IsOptional() @Matches(MONEY) waterTax?: string
  @IsOptional() @Matches(MONEY) drainageTax?: string
  @IsOptional() @Matches(MONEY) previousPropertyTax?: string
  @IsOptional() @Matches(MONEY) previousWaterTax?: string
  @IsOptional() @Matches(MONEY) previousDrainageTax?: string
  @IsOptional() @Matches(MONEY) alreadyPaid?: string
  @Matches(DAY) asOf!: string
}

export class ChargePreviewDto {
  @IsIn(["rebate", "penalty"])
  kind!: "rebate" | "penalty"

  @IsIn(["PROPERTY_TAX", "WATER_TAX", "DRAINAGE_TAX"])
  taxCategory!: "PROPERTY_TAX" | "WATER_TAX" | "DRAINAGE_TAX"

  @IsIn(["PERCENTAGE", "FIXED_AMOUNT"])
  type!: "PERCENTAGE" | "FIXED_AMOUNT"

  @IsOptional() @IsString() rate?: string
  @IsOptional() @IsString() fixedAmount?: string
  @IsOptional() @IsString() maxAmount?: string
  @IsBoolean() includeArrears!: boolean
  @IsOptional() @IsBoolean() includePenalty?: boolean
  @IsOptional() @IsBoolean() applyAfterRebate?: boolean
  @IsOptional() @IsIn(["ON_ASSESSMENT", "DUE_DATE_PASSED"]) trigger?: "ON_ASSESSMENT" | "DUE_DATE_PASSED"
  @IsOptional() @Matches(DAY) dueDate?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(365) graceDays?: number

  @ValidateNested()
  @Type(() => ChargePreviewSampleDto)
  sample!: ChargePreviewSampleDto
}

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

  /** Recorded in the audit trail. */
  @IsOptional()
  @IsString()
  reason?: string
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

  /** Required when closing or archiving; recorded in the audit trail. */
  @IsOptional()
  @IsString()
  reason?: string
}

export class RebatePolicyDto {
  @IsString()
  @MinLength(3)
  name!: string

  @IsString()
  @MinLength(1)
  assessmentYearId!: string

  /** COMBINED (legacy, flags choose components) or one tax only. */
  @IsOptional()
  @IsIn(["COMBINED", "PROPERTY_TAX", "WATER_TAX", "DRAINAGE_TAX"])
  taxCategory?: "COMBINED" | "PROPERTY_TAX" | "WATER_TAX" | "DRAINAGE_TAX"

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

  /** COMBINED (legacy, flags choose components) or one tax only. */
  @IsOptional()
  @IsIn(["COMBINED", "PROPERTY_TAX", "WATER_TAX", "DRAINAGE_TAX"])
  taxCategory?: "COMBINED" | "PROPERTY_TAX" | "WATER_TAX" | "DRAINAGE_TAX"

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
