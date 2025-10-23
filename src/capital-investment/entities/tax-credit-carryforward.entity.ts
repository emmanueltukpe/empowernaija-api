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
import { CapitalExpenditure } from './capital-expenditure.entity';

@Entity('tax_credit_carryforwards')
export class TaxCreditCarryForward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessId: string;

  @Column({ nullable: true })
  capitalExpenditureId: string;

  @Column({ type: 'int' })
  originYear: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  originalAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  remainingAmount: number;

  @Column({ type: 'int' })
  expiryYear: number;

  @Column({ default: false })
  fullyUtilized: boolean;

  @Column({ type: 'int', nullable: true })
  lastAppliedYear: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ManyToOne(() => CapitalExpenditure, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'capitalExpenditureId' })
  capitalExpenditure: CapitalExpenditure;
}

