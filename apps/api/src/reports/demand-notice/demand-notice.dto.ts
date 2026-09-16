import { ArrayMinSize, IsArray, IsOptional, IsString } from "class-validator"

export class DemandNoticeValidateDto {
  @IsString()
  wardId!: string

  @IsString()
  assessmentYearId!: string

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  surveyIds!: string[]
}

export class DemandNoticeCreateJobDto {
  @IsString()
  wardId!: string

  @IsString()
  assessmentYearId!: string

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  surveyIds!: string[]

  @IsOptional()
  @IsString()
  paperSize?: string

  @IsOptional()
  @IsString()
  orientation?: string

  @IsOptional()
  @IsString()
  sortBy?: string
}
