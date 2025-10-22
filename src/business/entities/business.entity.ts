import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Invoice } from '../../invoice/entities/invoice.entity';
import { TaxCalculation } from '../../tax-calculation/entities/tax-calculation.entity';

export enum BusinessSize {
  MICRO = 'micro', // Turnover ≤ ₦10M
  SMALL = 'small', // Turnover ≤ ₦50-100M
  MEDIUM = 'medium', // Turnover ≤ ₦500M
  LARGE = 'large', // Turnover > ₦500M
}

export enum BusinessSector {
  AGRICULTURE = 'agriculture',
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail',
  SERVICES = 'services',
  TECHNOLOGY = 'technology',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  CONSTRUCTION = 'construction',
  HOSPITALITY = 'hospitality',
  TRANSPORT = 'transport',
  FINANCE = 'finance',
  OTHER = 'other',
}

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessName: string;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column({ nullable: true })
  tin: string;

  @Column({ default: false })
  tinVerified: boolean;

  @Column({
    type: 'enum',
    enum: BusinessSector,
  })
  sector: BusinessSector;

  @Column({
    type: 'enum',
    enum: BusinessSize,
    default: BusinessSize.MICRO,
  })
  size: BusinessSize;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedAnnualTurnover: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedAssetValue: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  registrationDate: Date;

  @Column({ default: false })
  vatRegistered: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.businesses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Invoice, (invoice) => invoice.business)
  invoices: Invoice[];

  @OneToMany(() => TaxCalculation, (calculation) => calculation.business)
  taxCalculations: TaxCalculation[];
}
