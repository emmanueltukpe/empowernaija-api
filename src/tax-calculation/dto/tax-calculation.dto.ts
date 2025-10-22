import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
  IsEnum,
  Min,
} from 'class-validator';
import { TaxType } from '../entities/tax-calculation.entity';

/**
 * Personal Income Tax Calculation DTO
 */
export class PersonalIncomeTaxDto {
  @ApiProperty({
    description: 'Gross annual income in NGN',
    example: 5000000,
  })
  @IsNumber()
  @Min(0)
  grossIncome: number;

  @ApiPropertyOptional({
    description: 'Annual rent paid in NGN (for rent relief calculation)',
    example: 1200000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rentPaid?: number;

  @ApiPropertyOptional({
    description: 'Annual pension contribution in NGN',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pensionContribution?: number;

  @ApiPropertyOptional({
    description: 'Annual health insurance premium in NGN',
    example: 200000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  healthInsurance?: number;
}

/**
 * Company Income Tax Calculation DTO
 */
export class CompanyIncomeTaxDto {
  @ApiProperty({
    description: 'Business name',
    example: 'Ada Electronics Ltd',
  })
  @IsString()
  businessName: string;

  @ApiProperty({
    description: 'Annual turnover in NGN',
    example: 80000000,
  })
  @IsNumber()
  @Min(0)
  annualTurnover: number;

  @ApiProperty({
    description: 'Total asset value in NGN',
    example: 150000000,
  })
  @IsNumber()
  @Min(0)
  assetValue: number;

  @ApiPropertyOptional({
    description: 'Assessable profits in NGN (if known)',
    example: 8000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  assessableProfits?: number;
}

/**
 * Capital Gains Tax Calculation DTO
 */
export class CapitalGainsTaxDto {
  @ApiProperty({
    description: 'Proceeds from asset sale in NGN',
    example: 10000000,
  })
  @IsNumber()
  @Min(0)
  proceeds: number;

  @ApiProperty({
    description: 'Cost basis (original purchase price + improvements) in NGN',
    example: 7000000,
  })
  @IsNumber()
  @Min(0)
  costBasis: number;

  @ApiPropertyOptional({
    description: 'Is this a company transaction?',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isCompany?: boolean;

  @ApiPropertyOptional({
    description: 'Is this a private residence?',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivateResidence?: boolean;

  @ApiPropertyOptional({
    description: 'Is this a personal vehicle?',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPersonalVehicle?: boolean;

  @ApiPropertyOptional({
    description: 'Number of personal vehicles (if applicable)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vehicleCount?: number;

  @ApiPropertyOptional({
    description: 'Is this loss-of-office compensation?',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isLossOfOffice?: boolean;
}

/**
 * VAT Calculation DTO
 */
export class VATCalculationDto {
  @ApiProperty({
    description: 'Base amount before VAT in NGN',
    example: 100000,
  })
  @IsNumber()
  @Min(0)
  baseAmount: number;

  @ApiPropertyOptional({
    description: 'Is this item zero-rated? (basic foods, medical, education, exports, electricity)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isZeroRated?: boolean;

  @ApiPropertyOptional({
    description: 'Item description for VAT classification',
    example: 'Electronics equipment',
  })
  @IsOptional()
  @IsString()
  itemDescription?: string;
}

/**
 * Tax Calculation Result DTO
 */
export class TaxCalculationResultDto {
  @ApiProperty({
    description: 'Type of tax calculated',
    enum: TaxType,
  })
  taxType: TaxType;

  @ApiProperty({
    description: 'Gross income/turnover before deductions',
    example: 5000000,
  })
  grossIncome: number;

  @ApiProperty({
    description: 'Total deductions applied',
    example: 700000,
  })
  deductions: number;

  @ApiProperty({
    description: 'Tax reliefs applied',
    example: {
      rentRelief: 500000,
      pensionContribution: 200000,
      healthInsurance: 0,
    },
  })
  reliefs: {
    rentRelief?: number;
    pensionContribution?: number;
    healthInsurance?: number;
    [key: string]: any;
  };

  @ApiProperty({
    description: 'Taxable income after deductions and reliefs',
    example: 4300000,
  })
  taxableIncome: number;

  @ApiProperty({
    description: 'Total tax liability in NGN',
    example: 585000,
  })
  taxLiability: number;

  @ApiProperty({
    description: 'Net income after tax',
    example: 4415000,
  })
  netIncome: number;

  @ApiProperty({
    description: 'Detailed calculation breakdown',
  })
  breakdown?: any;
}

/**
 * Save Tax Calculation DTO
 */
export class SaveTaxCalculationDto {
  @ApiProperty({
    description: 'Tax calculation result to save',
  })
  calculation: TaxCalculationResultDto;

  @ApiPropertyOptional({
    description: 'User ID (for personal tax)',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Business ID (for business tax)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Save Tax Calculation Request DTO
 */
export class SaveTaxCalculationRequestDto {
  @ApiProperty({
    description: 'Tax calculation result to save',
    type: TaxCalculationResultDto,
  })
  calculation: TaxCalculationResultDto;

  @ApiPropertyOptional({
    description: 'Business ID (for business tax calculations)',
    example: 'business-uuid-123',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
