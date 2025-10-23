import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateCapitalExpenditureDto {
  @ApiProperty({
    description: 'Business ID',
    example: 'uuid-here',
  })
  @IsString()
  businessId: string;

  @ApiProperty({
    description: 'Expenditure amount in NGN',
    example: 5000000,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Date of expenditure',
    example: '2026-03-15',
  })
  @IsDateString()
  expenditureDate: string;

  @ApiProperty({
    description: 'Description of capital expenditure',
    example: 'Purchase of manufacturing equipment',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Invoice document URL',
    example: 'https://s3.amazonaws.com/invoices/inv-123.pdf',
  })
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  @ApiPropertyOptional({
    description: 'Supplier name',
    example: 'ABC Equipment Ltd',
  })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({
    description: 'Supplier TIN',
    example: '12345678-0001',
  })
  @IsOptional()
  @IsString()
  supplierTIN?: string;

  @ApiProperty({
    description: 'Tax year for the expenditure',
    example: 2026,
  })
  @IsNumber()
  taxYear: number;
}

export class UpdateCapitalExpenditureDto {
  @ApiPropertyOptional({
    description: 'Expenditure amount in NGN',
    example: 5000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Date of expenditure',
    example: '2026-03-15',
  })
  @IsOptional()
  @IsDateString()
  expenditureDate?: string;

  @ApiPropertyOptional({
    description: 'Description of capital expenditure',
    example: 'Purchase of manufacturing equipment',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Invoice document URL',
    example: 'https://s3.amazonaws.com/invoices/inv-123.pdf',
  })
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  @ApiPropertyOptional({
    description: 'Supplier name',
    example: 'ABC Equipment Ltd',
  })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({
    description: 'Supplier TIN',
    example: '12345678-0001',
  })
  @IsOptional()
  @IsString()
  supplierTIN?: string;
}

