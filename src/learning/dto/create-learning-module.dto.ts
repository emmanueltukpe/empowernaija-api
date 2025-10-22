import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsBoolean, Min } from 'class-validator';
import { ModuleType, ModuleCategory, DifficultyLevel } from '../entities/learning-module.entity';

export class CreateLearningModuleDto {
  @ApiProperty({ description: 'Module title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Module description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Module content' })
  @IsString()
  content: string;

  @ApiProperty({ enum: ModuleType, description: 'Module type' })
  @IsEnum(ModuleType)
  type: ModuleType;

  @ApiProperty({ enum: ModuleCategory, description: 'Module category' })
  @IsEnum(ModuleCategory)
  category: ModuleCategory;

  @ApiPropertyOptional({ enum: DifficultyLevel, description: 'Difficulty level' })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({ description: 'Video URL (for video modules)' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Quiz questions (for quiz modules)' })
  @IsOptional()
  @IsArray()
  quizQuestions?: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is published?' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

