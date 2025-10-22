import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum IncomeSource {
  SALARY = 'salary',
  FREELANCE = 'freelance',
  BUSINESS = 'business',
  INVESTMENT = 'investment',
  RENTAL = 'rental',
  PENSION = 'pension',
  PRIZE = 'prize',
  GRANT = 'grant',
  DIGITAL_ASSET = 'digital_asset',
  OTHER = 'other',
}

export enum IncomeFrequency {
  ONE_TIME = 'one_time',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

@Entity('income_records')
export class IncomeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: IncomeSource,
  })
  source: IncomeSource;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  incomeDate: Date;

  @Column({
    type: 'enum',
    enum: IncomeFrequency,
    default: IncomeFrequency.ONE_TIME,
  })
  frequency: IncomeFrequency;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  payer: string;

  @Column({ default: false })
  taxCalculated: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  calculatedTax: number;

  @Column({ default: false })
  taxPaid: boolean;

  @Column({ type: 'date', nullable: true })
  taxPaymentDate: Date;

  @Column({ nullable: true })
  receiptUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.incomeRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}
