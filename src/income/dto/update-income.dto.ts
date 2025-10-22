import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, IsBoolean, Min } from 'class-validator';
import { IncomeSource, IncomeFrequency } from '../entities/income-record.entity';

export class UpdateIncomeDto {
  @ApiPropertyOptional({ enum: IncomeSource })
  @IsOptional()
  @IsEnum(IncomeSource)
  source?: IncomeSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  incomeDate?: string;

  @ApiPropertyOptional({ enum: IncomeFrequency })
  @IsOptional()
  @IsEnum(IncomeFrequency)
  frequency?: IncomeFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  taxCalculated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  calculatedTax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  taxPaid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  taxPaymentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

