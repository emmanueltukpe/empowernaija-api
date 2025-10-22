import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { IncomeSource, IncomeFrequency } from '../entities/income-record.entity';

export class CreateIncomeDto {
  @ApiProperty({
    enum: IncomeSource,
    description: 'Source of income',
    example: IncomeSource.FREELANCE,
  })
  @IsEnum(IncomeSource)
  source: IncomeSource;

  @ApiProperty({
    description: 'Income amount in NGN',
    example: 500000,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Date when income was received',
    example: '2026-01-15',
  })
  @IsDateString()
  incomeDate: string;

  @ApiPropertyOptional({
    enum: IncomeFrequency,
    description: 'Frequency of income',
    example: IncomeFrequency.MONTHLY,
  })
  @IsOptional()
  @IsEnum(IncomeFrequency)
  frequency?: IncomeFrequency;

  @ApiPropertyOptional({
    description: 'Description of income',
    example: 'Web development project payment',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Name of payer/client',
    example: 'ABC Company Ltd',
  })
  @IsOptional()
  @IsString()
  payer?: string;

  @ApiPropertyOptional({
    description: 'URL to receipt/invoice',
  })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

