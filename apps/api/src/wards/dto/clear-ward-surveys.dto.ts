import { IsString, MaxLength, MinLength } from "class-validator"

export class ClearWardSurveysDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  confirmWardCode!: string
}
