import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateCorporateDonationDto {
  @ApiProperty({
    description: 'Business ID',
    example: 'uuid-here',
  })
  @IsString()
  businessId: string;

  @ApiProperty({
    description: 'Donation amount in NGN',
    example: 1000000,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Date of donation',
    example: '2026-06-15',
  })
  @IsDateString()
  donationDate: string;

  @ApiProperty({
    description: 'Recipient organization name',
    example: 'Red Cross Nigeria',
  })
  @IsString()
  recipientName: string;

  @ApiPropertyOptional({
    description: 'Recipient TIN (for verification)',
    example: '12345678-0001',
  })
  @IsOptional()
  @IsString()
  recipientTIN?: string;

  @ApiPropertyOptional({
    description: 'Donation receipt URL',
    example: 'https://s3.amazonaws.com/receipts/receipt-123.pdf',
  })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiProperty({
    description: 'Tax year for the donation',
    example: 2026,
  })
  @IsNumber()
  taxYear: number;

  @ApiPropertyOptional({
    description: 'Description of donation',
    example: 'Donation to support education programs',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCorporateDonationDto {
  @ApiPropertyOptional({
    description: 'Donation amount in NGN',
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Date of donation',
    example: '2026-06-15',
  })
  @IsOptional()
  @IsDateString()
  donationDate?: string;

  @ApiPropertyOptional({
    description: 'Recipient organization name',
    example: 'Red Cross Nigeria',
  })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiPropertyOptional({
    description: 'Recipient TIN (for verification)',
    example: '12345678-0001',
  })
  @IsOptional()
  @IsString()
  recipientTIN?: string;

  @ApiPropertyOptional({
    description: 'Donation receipt URL',
    example: 'https://s3.amazonaws.com/receipts/receipt-123.pdf',
  })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({
    description: 'Description of donation',
    example: 'Donation to support education programs',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

