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
import { Business } from '../../business/entities/business.entity';

export enum TaxType {
  PIT = 'personal_income_tax', // Personal Income Tax
  CIT = 'company_income_tax', // Company Income Tax
  CGT = 'capital_gains_tax', // Capital Gains Tax
  VAT = 'value_added_tax', // Value Added Tax
  DEVELOPMENT_LEVY = 'development_levy',
  STAMP_DUTY = 'stamp_duty',
  WITHHOLDING_TAX = 'withholding_tax',
}

export enum TaxYear {
  YEAR_2025 = '2025',
  YEAR_2026 = '2026',
  YEAR_2027 = '2027',
}

@Entity('tax_calculations')
export class TaxCalculation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TaxType,
  })
  taxType: TaxType;

  @Column({
    type: 'enum',
    enum: TaxYear,
    default: TaxYear.YEAR_2026,
  })
  taxYear: TaxYear;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  taxableIncome: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  taxLiability: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  deductions: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  reliefs: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  rentRelief: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  pensionContribution: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  healthInsurance: number;

  @Column({ type: 'jsonb', nullable: true })
  breakdown: {
    slabs?: Array<{
      from: number;
      to: number;
      rate: number;
      taxableAmount: number;
      tax: number;
    }>;
    effectiveRate?: number;
    marginalRate?: number;
    totalIncome?: number;
    netIncome?: number;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'date' })
  calculationDate: Date;

  @Column({ default: false })
  isFiled: boolean;

  @Column({ type: 'date', nullable: true })
  filingDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.taxCalculations, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Business, (business) => business.taxCalculations, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ nullable: true })
  businessId: string;
}
