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

@Entity('capital_expenditures')
export class CapitalExpenditure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  expenditureDate: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  invoiceUrl: string;

  @Column({ nullable: true })
  supplierName: string;

  @Column({ nullable: true })
  supplierTIN: string;

  @Column({ type: 'int' })
  taxYear: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  creditClaimed: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  creditRemaining: number;

  @Column({ default: false })
  fullyUtilized: boolean;

  @Column({ type: 'int', nullable: true })
  expiryYear: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

