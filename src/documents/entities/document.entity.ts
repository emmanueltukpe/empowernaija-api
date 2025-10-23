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

export enum DocumentType {
  RENT_RECEIPT = 'rent_receipt',
  LEASE_AGREEMENT = 'lease_agreement',
  PENSION_CERTIFICATE = 'pension_certificate',
  HEALTH_INSURANCE_POLICY = 'health_insurance_policy',
  CAPITAL_EXPENDITURE_INVOICE = 'capital_expenditure_invoice',
  DONATION_RECEIPT = 'donation_receipt',
  SEVERANCE_AGREEMENT = 'severance_agreement',
  TERMINATION_LETTER = 'termination_letter',
  NGO_EXEMPTION_CERTIFICATE = 'ngo_exemption_certificate',
  CAC_REGISTRATION = 'cac_registration',
  BANK_STATEMENT = 'bank_statement',
  TAX_CLEARANCE_CERTIFICATE = 'tax_clearance_certificate',
  AGRICULTURAL_REGISTRATION = 'agricultural_registration',
  INVESTMENT_CERTIFICATE = 'investment_certificate',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'bigint' })
  fileSizeBytes: number;

  @Column()
  mimeType: string;

  @Column({ type: 'date' })
  uploadDate: Date;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  businessId: string;

  @Column({ type: 'int' })
  taxYear: number;

  @Column({ type: 'jsonb', nullable: true })
  ocrData: any; // Extracted text from OCR

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  verifiedBy: string; // Admin user ID who verified

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Business, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

