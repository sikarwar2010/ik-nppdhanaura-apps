import { Type } from "class-transformer"
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from "class-validator"

const MONEY = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
const DAY = /^\d{4}-\d{2}-\d{2}$/

export class CollectionListQueryDto {
  @IsString()
  @MinLength(1)
  assessmentYearId!: string

  @IsOptional()
  @IsString()
  wardId?: string

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  receiptNumber?: string

  @IsOptional()
  @IsIn(["UNPAID", "PARTIAL", "PAID", "PENDING"])
  status?: "UNPAID" | "PARTIAL" | "PAID" | "PENDING"

  @IsOptional()
  @IsString()
  @Matches(DAY)
  dateFrom?: string

  @IsOptional()
  @IsString()
  @Matches(DAY)
  dateTo?: string

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

  @IsOptional()
  @IsIn(["surveyId", "ownerName", "outstanding"])
  sortBy?: "surveyId" | "ownerName" | "outstanding"

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc"
}

export class CollectTaxDto {
  @IsString()
  @MinLength(1)
  surveyId!: string

  @IsString()
  @MinLength(1)
  assessmentYearId!: string

  @IsString()
  @Matches(MONEY)
  amount!: string

  @IsIn(["CASH", "CHEQUE", "DD", "UPI_MANUAL", "OTHER"])
  paymentMode!: "CASH" | "CHEQUE" | "DD" | "UPI_MANUAL" | "OTHER"

  @IsOptional()
  @IsString()
  @Matches(DAY)
  paymentDate?: string

  @IsOptional()
  @IsString()
  reference?: string

  @IsOptional()
  @IsString()
  remarks?: string

  @IsOptional()
  @IsString()
  counterCode?: string

  @IsOptional()
  @IsString()
  @MinLength(8)
  idempotencyKey?: string
}

export class ReceiptListQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  receiptNumber?: string

  @IsOptional()
  @IsString()
  assessmentYearId?: string

  @IsOptional()
  @IsIn(["SUCCESS", "PENDING", "FAILED", "CANCELLED", "REFUNDED"])
  status?: string

  @IsOptional()
  @IsString()
  @Matches(DAY)
  dateFrom?: string

  @IsOptional()
  @IsString()
  @Matches(DAY)
  dateTo?: string

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
