import { Type } from "class-transformer"
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator"

export class UpdateTaxConfigParamsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  propertyTaxPct?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  waterTaxPct?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  drainageTaxPct?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  penaltyPct?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  assessablePct?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commercialAssessablePct?: number

  @IsOptional()
  @IsString()
  reason?: string
}

export class UpsertTaxCellDto {
  @IsString()
  roadWidthEntryId!: string

  @IsString()
  constructionEntryId!: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  annualRatePerSqFt!: number
}

export class UpsertTaxCellsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertTaxCellDto)
  cells!: UpsertTaxCellDto[]
}

export class TaxPreviewDto {
  @IsString()
  wardId!: string

  @IsString()
  assessmentYearId!: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  areaSqFt!: number

  @IsString()
  roadWidthEntryId!: string

  @IsString()
  constructionEntryId!: string

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]$/, {
    message: "GIS use code must be a single letter (A–Z)",
  })
  gisUseCode?: string
}

export class PublishTaxConfigDto {
  @IsOptional()
  @IsString()
  reason?: string

  @IsOptional()
  @IsString()
  effectiveFrom?: string
}

export class CreateTaxConfigDto {
  @IsString()
  wardId!: string

  @IsString()
  assessmentYearId!: string
}

export class CopyTaxToWardsDto {
  @IsString()
  sourceWardId!: string

  @IsString()
  assessmentYearId!: string
}
