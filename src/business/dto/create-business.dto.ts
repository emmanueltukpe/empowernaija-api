import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsBoolean, Min } from 'class-validator';
import { BusinessSector, BusinessSize } from '../entities/business.entity';

export class CreateBusinessDto {
  @ApiProperty({ description: 'Business name', example: 'Ada Electronics Ltd' })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({ description: 'Business registration number' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Tax Identification Number (TIN)' })
  @IsOptional()
  @IsString()
  tin?: string;

  @ApiProperty({ enum: BusinessSector, description: 'Business sector' })
  @IsEnum(BusinessSector)
  sector: BusinessSector;

  @ApiPropertyOptional({ enum: BusinessSize, description: 'Business size' })
  @IsOptional()
  @IsEnum(BusinessSize)
  size?: BusinessSize;

  @ApiPropertyOptional({ description: 'Estimated annual turnover in NGN' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedAnnualTurnover?: number;

  @ApiPropertyOptional({ description: 'Estimated asset value in NGN' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedAssetValue?: number;

  @ApiPropertyOptional({ description: 'Business address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Business description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Registration date' })
  @IsOptional()
  @IsDateString()
  registrationDate?: string;

  @ApiPropertyOptional({ description: 'Is VAT registered?' })
  @IsOptional()
  @IsBoolean()
  vatRegistered?: boolean;
}

