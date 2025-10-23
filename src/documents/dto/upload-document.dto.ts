import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsObject,
  IsInt,
} from 'class-validator';
import { DocumentType } from '../entities/document.entity';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Type of document being uploaded',
    enum: DocumentType,
    example: DocumentType.RENT_RECEIPT,
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({
    description: 'Tax year this document relates to',
    example: 2026,
  })
  @IsInt()
  @Min(2025)
  taxYear: number;

  @ApiPropertyOptional({
    description: 'Business ID if document is for a business',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({
    description: 'Description of the document',
    example: 'Rent receipt for January 2026',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the document',
    example: {
      landlordName: 'John Doe',
      landlordTIN: '12345678-0001',
      propertyAddress: '123 Main St, Lagos',
      amount: 50000,
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    landlordName?: string;
    landlordTIN?: string;
    propertyAddress?: string;
    recipientName?: string;
    recipientTIN?: string;
    employerName?: string;
    employerTIN?: string;
    amount?: number;
    dateOfTransaction?: string;
    [key: string]: any;
  };
}

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: 'Description of the document',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the document',
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    landlordName?: string;
    landlordTIN?: string;
    propertyAddress?: string;
    recipientName?: string;
    recipientTIN?: string;
    employerName?: string;
    employerTIN?: string;
    amount?: number;
    dateOfTransaction?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({
    description: 'Notes about the document',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifyDocumentDto {
  @ApiProperty({
    description: 'Whether to approve or reject the document',
    example: true,
  })
  approved: boolean;

  @ApiPropertyOptional({
    description: 'Reason for rejection (required if approved is false)',
    example: 'Document is not clear enough',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'Notes from the verifier',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

