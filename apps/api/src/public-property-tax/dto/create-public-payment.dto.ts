import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator"

export class CreatePublicPropertyTaxPaymentDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  surveyId!: string

  @IsString()
  @Matches(/^\d{10}$/, { message: "payerMobile must be exactly 10 digits" })
  payerMobile!: string

  /** Which tax to pay. Omitted means everything outstanding. */
  @IsOptional()
  @IsIn(["PROPERTY_TAX", "WATER_TAX", "COMBINED"])
  taxKind?: "PROPERTY_TAX" | "WATER_TAX" | "COMBINED"

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  payerEmail?: string
}
