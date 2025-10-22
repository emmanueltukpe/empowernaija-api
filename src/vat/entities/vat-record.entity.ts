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

export enum VATType {
  INPUT = 'input',
  OUTPUT = 'output',
}

@Entity('vat_records')
export class VATRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: VATType,
  })
  type: VATType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  baseAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 7.5 })
  vatRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  vatAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  supplierName: string;

  @Column({ default: false })
  isZeroRated: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;
}

