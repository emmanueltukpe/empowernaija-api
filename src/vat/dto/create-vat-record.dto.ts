import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, IsBoolean, Min } from 'class-validator';
import { VATType } from '../entities/vat-record.entity';

export class CreateVATRecordDto {
  @ApiProperty({ description: 'Business ID' })
  @IsString()
  businessId: string;

  @ApiProperty({ enum: VATType, description: 'VAT type (input or output)' })
  @IsEnum(VATType)
  type: VATType;

  @ApiProperty({ description: 'Base amount before VAT in NGN' })
  @IsNumber()
  @Min(0)
  baseAmount: number;

  @ApiProperty({ description: 'Transaction date', example: '2026-01-15' })
  @IsDateString()
  transactionDate: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Invoice number' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier/Customer name' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({ description: 'Is zero-rated?' })
  @IsOptional()
  @IsBoolean()
  isZeroRated?: boolean;
}

