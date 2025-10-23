import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
  IsEnum,
  Min,
} from "class-validator";
import { TaxType } from "../entities/tax-calculation.entity";
import { IsTIN } from "../../common/validators/tin-nin.validator";

/**
 * Personal Income Tax Calculation DTO
 */
export class PersonalIncomeTaxDto {
  @ApiProperty({
    description: "Gross annual income in NGN",
    example: 5000000,
  })
  @IsNumber()
  @Min(0)
  grossIncome: number;

  @ApiPropertyOptional({
    description: "Annual rent paid in NGN (for rent relief calculation)",
    example: 1200000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rentPaid?: number;

  @ApiPropertyOptional({
    description: "Landlord full name",
    example: "John Doe",
  })
  @IsOptional()
  @IsString()
  landlordName?: string;

  @ApiPropertyOptional({
    description: "Landlord TIN (format: ########-####)",
    example: "12345678-0001",
  })
  @IsOptional()
  @IsString()
  @IsTIN()
  landlordTIN?: string;

  @ApiPropertyOptional({
    description: "Landlord address",
    example: "123 Victoria Island, Lagos",
  })
  @IsOptional()
  @IsString()
  landlordAddress?: string;

  @ApiPropertyOptional({
    description: "Rent receipt numbers (comma-separated)",
    example: "REC-2026-001,REC-2026-002",
  })
  @IsOptional()
  @IsString()
  rentReceiptNumbers?: string;

  @ApiPropertyOptional({
    description: "Annual pension contribution in NGN",
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pensionContribution?: number;

  @ApiPropertyOptional({
    description: "Pension provider name",
    example: "ARM Pension Managers",
  })
  @IsOptional()
  @IsString()
  pensionProviderName?: string;

  @ApiPropertyOptional({
    description: "Pension policy number",
    example: "PEN-123456789",
  })
  @IsOptional()
  @IsString()
  pensionPolicyNumber?: string;

  @ApiPropertyOptional({
    description: "Annual health insurance premium in NGN",
    example: 200000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  healthInsurance?: number;

  @ApiPropertyOptional({
    description: "Health insurance provider name",
    example: "Hygeia HMO",
  })
  @IsOptional()
  @IsString()
  healthInsuranceProviderName?: string;

  @ApiPropertyOptional({
    description: "Health insurance policy number",
    example: "HMO-987654321",
  })
  @IsOptional()
  @IsString()
  healthInsurancePolicyNumber?: string;
}

/**
 * Company Income Tax Calculation DTO
 */
export class CompanyIncomeTaxDto {
  @ApiProperty({
    description: "Business name",
    example: "Ada Electronics Ltd",
  })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({
    description: "Business TIN (format: ########-####)",
    example: "87654321-0001",
  })
  @IsOptional()
  @IsString()
  @IsTIN()
  businessTIN?: string;

  @ApiProperty({
    description: "Annual turnover in NGN",
    example: 80000000,
  })
  @IsNumber()
  @Min(0)
  annualTurnover: number;

  @ApiProperty({
    description: "Total asset value in NGN",
    example: 150000000,
  })
  @IsNumber()
  @Min(0)
  assetValue: number;

  @ApiPropertyOptional({
    description: "Assessable profits in NGN (if known)",
    example: 8000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  assessableProfits?: number;

  @ApiPropertyOptional({
    description:
      "Business type (for_profit, ngo, charity, religious, educational)",
    example: "for_profit",
  })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({
    description: "Tax exempt status (for NGOs/charities)",
    example: false,
  })
  @IsOptional()
  taxExemptStatus?: boolean;

  @ApiPropertyOptional({
    description: "Is this an agricultural business?",
    example: false,
  })
  @IsOptional()
  isAgriculturalBusiness?: boolean;

  @ApiPropertyOptional({
    description: "Agricultural business start date (for 5-year tax holiday)",
    example: "2024-01-01",
  })
  @IsOptional()
  agriculturalBusinessStartDate?: Date;

  @ApiPropertyOptional({
    description: "Tax year for calculation",
    example: 2026,
  })
  @IsOptional()
  @IsNumber()
  taxYear?: number;
}

/**
 * Presumptive Tax Calculation DTO (for informal sector workers)
 */
export class PresumptiveTaxDto {
  @ApiProperty({
    description: "Estimated annual turnover for informal business in NGN",
    example: 2000000,
  })
  @IsNumber()
  @Min(0)
  estimatedTurnover: number;

  @ApiProperty({
    description: "Business activity type",
    example: "street_vendor",
    enum: [
      "street_vendor",
      "artisan",
      "small_trader",
      "taxi_driver",
      "mechanic",
      "tailor",
      "hairdresser",
      "food_vendor",
      "other",
    ],
  })
  @IsString()
  activityType: string;

  @ApiPropertyOptional({
    description: "Number of employees (if any)",
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employeeCount?: number;

  @ApiPropertyOptional({
    description: "Business location (city/state)",
    example: "Lagos",
  })
  @IsOptional()
  @IsString()
  location?: string;
}

/**
 * Capital Gains Tax Calculation DTO
 */
export class CapitalGainsTaxDto {
  @ApiProperty({
    description: "Proceeds from asset sale in NGN",
    example: 10000000,
  })
  @IsNumber()
  @Min(0)
  proceeds: number;

  @ApiProperty({
    description: "Cost basis (original purchase price + improvements) in NGN",
    example: 7000000,
  })
  @IsNumber()
  @Min(0)
  costBasis: number;

  @ApiPropertyOptional({
    description: "Is this a company transaction?",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isCompany?: boolean;

  @ApiPropertyOptional({
    description: "Is this a private residence?",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivateResidence?: boolean;

  @ApiPropertyOptional({
    description: "Is this a personal vehicle?",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPersonalVehicle?: boolean;

  @ApiPropertyOptional({
    description: "Number of personal vehicles (if applicable)",
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vehicleCount?: number;

  @ApiPropertyOptional({
    description: "Is this loss-of-office compensation?",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isLossOfOffice?: boolean;

  @ApiPropertyOptional({
    description: "Severance payment amount in NGN",
    example: 30000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  severanceAmount?: number;

  @ApiPropertyOptional({
    description: "Date of termination",
    example: "2026-06-30",
  })
  @IsOptional()
  @IsString()
  terminationDate?: string;

  @ApiPropertyOptional({
    description: "Reason for termination",
    example: "Redundancy",
  })
  @IsOptional()
  @IsString()
  terminationReason?: string;

  @ApiPropertyOptional({
    description: "Employer name",
    example: "ABC Corporation Ltd",
  })
  @IsOptional()
  @IsString()
  employerName?: string;

  @ApiPropertyOptional({
    description: "Employer TIN (format: ########-####)",
    example: "11223344-0001",
  })
  @IsOptional()
  @IsString()
  @IsTIN()
  employerTIN?: string;

  @ApiPropertyOptional({
    description: "Years of service",
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsOfService?: number;
}

/**
 * VAT Calculation DTO
 */
export class VATCalculationDto {
  @ApiProperty({
    description: "Base amount before VAT in NGN",
    example: 100000,
  })
  @IsNumber()
  @Min(0)
  baseAmount: number;

  @ApiPropertyOptional({
    description:
      "Is this item zero-rated? (basic foods, medical, education, exports, electricity)",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isZeroRated?: boolean;

  @ApiPropertyOptional({
    description: "Item description for VAT classification",
    example: "Electronics equipment",
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
    description: "Type of tax calculated",
    enum: TaxType,
  })
  taxType: TaxType;

  @ApiProperty({
    description: "Gross income/turnover before deductions",
    example: 5000000,
  })
  grossIncome: number;

  @ApiProperty({
    description: "Total deductions applied",
    example: 700000,
  })
  deductions: number;

  @ApiProperty({
    description: "Tax reliefs applied",
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
    description: "Taxable income after deductions and reliefs",
    example: 4300000,
  })
  taxableIncome: number;

  @ApiProperty({
    description: "Total tax liability in NGN",
    example: 585000,
  })
  taxLiability: number;

  @ApiProperty({
    description: "Net income after tax",
    example: 4415000,
  })
  netIncome: number;

  @ApiProperty({
    description: "Detailed calculation breakdown",
  })
  breakdown?: any;
}

/**
 * Save Tax Calculation DTO
 */
export class SaveTaxCalculationDto {
  @ApiProperty({
    description: "Tax calculation result to save",
  })
  calculation: TaxCalculationResultDto;

  @ApiPropertyOptional({
    description: "User ID (for personal tax)",
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: "Business ID (for business tax)",
  })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({
    description: "Additional notes",
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
    description: "Tax calculation result to save",
    type: TaxCalculationResultDto,
  })
  calculation: TaxCalculationResultDto;

  @ApiPropertyOptional({
    description: "Business ID (for business tax calculations)",
    example: "business-uuid-123",
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
