import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ComplianceType } from '../entities/compliance-task.entity';

export class CreateComplianceTaskDto {
  @ApiProperty({ enum: ComplianceType, description: 'Compliance task type' })
  @IsEnum(ComplianceType)
  type: ComplianceType;

  @ApiProperty({ description: 'Task title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Due date', example: '2026-03-31' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Business ID (for business-related tasks)' })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

