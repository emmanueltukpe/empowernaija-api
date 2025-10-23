import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ConfigValueType {
  NUMBER = 'number',
  STRING = 'string',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

@Entity('tax_configurations')
@Index(['taxYear', 'configKey'], { unique: true })
export class TaxConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  taxYear: number;

  @Column()
  configKey: string;

  @Column({ type: 'text' })
  configValue: string;

  @Column({
    type: 'enum',
    enum: ConfigValueType,
    default: ConfigValueType.STRING,
  })
  valueType: ConfigValueType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

