import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity';

@Entity('corporate_donations')
export class CorporateDonation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  donationDate: Date;

  @Column()
  recipientName: string;

  @Column({ nullable: true })
  recipientTIN: string;

  @Column({ default: false })
  recipientVerified: boolean;

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ type: 'int' })
  taxYear: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  deductionClaimed: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  approved: boolean;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

