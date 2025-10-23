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
import { TaxType } from '../../tax-calculation/entities/tax-calculation.entity';

export enum TaxReturnStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  READY_TO_FILE = 'ready_to_file',
  FILED = 'filed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('tax_returns')
export class TaxReturn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  businessId: string;

  @Column({ type: 'int' })
  taxYear: number;

  @Column({
    type: 'enum',
    enum: TaxType,
  })
  taxType: TaxType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalIncome: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDeductions: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalReliefs: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  taxableIncome: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  taxLiability: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxPaid: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxDue: number;

  @Column({
    type: 'enum',
    enum: TaxReturnStatus,
    default: TaxReturnStatus.DRAFT,
  })
  status: TaxReturnStatus;

  @Column({ type: 'jsonb', nullable: true })
  supportingDocuments: {
    rentReceipts?: string[];
    pensionCertificates?: string[];
    healthInsurancePolicies?: string[];
    capitalExpenditureInvoices?: string[];
    donationReceipts?: string[];
    severanceDocuments?: string[];
    incomeStatements?: string[];
    bankStatements?: string[];
    [key: string]: string[] | undefined;
  };

  @Column({ type: 'jsonb', nullable: true })
  calculationBreakdown: {
    incomeBreakdown?: any;
    deductionsBreakdown?: any;
    reliefsBreakdown?: any;
    taxSlabs?: any[];
    exemptions?: any[];
    credits?: any[];
    [key: string]: any;
  };

  @Column({ nullable: true })
  generatedPdfUrl: string;

  @Column({ default: false })
  submitted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  submissionDate: Date;

  @Column({ nullable: true })
  firsReferenceNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ default: false })
  documentationComplete: boolean;

  @Column({ type: 'jsonb', nullable: true })
  missingDocuments: string[];

  @Column({ type: 'jsonb', nullable: true })
  validationErrors: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Business, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

