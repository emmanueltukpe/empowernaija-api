import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ModuleType {
  ARTICLE = 'article',
  VIDEO = 'video',
  QUIZ = 'quiz',
  GUIDE = 'guide',
}

export enum ModuleCategory {
  TAX_BASICS = 'tax_basics',
  PERSONAL_TAX = 'personal_tax',
  BUSINESS_TAX = 'business_tax',
  COMPLIANCE = 'compliance',
  PLANNING = 'planning',
  REFORMS_2026 = 'reforms_2026',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Entity('learning_modules')
export class LearningModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ModuleType,
  })
  type: ModuleType;

  @Column({
    type: 'enum',
    enum: ModuleCategory,
  })
  category: ModuleCategory;

  @Column({
    type: 'enum',
    enum: DifficultyLevel,
    default: DifficultyLevel.BEGINNER,
  })
  difficulty: DifficultyLevel;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'int', default: 0 })
  durationMinutes: number;

  @Column({ type: 'jsonb', nullable: true })
  quizQuestions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ default: true })
  isPublished: boolean;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

