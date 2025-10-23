import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { UserRole } from "../entities/user.entity";
import { IsTIN, IsNIN } from "../../common/validators/tin-nin.validator";

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    required: false,
    description: "Tax Identification Number (format: ########-####)",
    example: "12345678-0001",
  })
  @IsOptional()
  @IsString()
  @IsTIN()
  tin?: string;

  @ApiProperty({
    required: false,
    description: "National Identification Number (11 digits)",
    example: "12345678901",
  })
  @IsOptional()
  @IsString()
  @IsNIN()
  nin?: string;

  @ApiProperty({ required: false, enum: UserRole, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}
