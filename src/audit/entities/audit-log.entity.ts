import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

export enum AuditAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  VIEW = "view",
  CALCULATE = "calculate",
  SUBMIT = "submit",
  APPROVE = "approve",
  REJECT = "reject",
  VERIFY = "verify",
  UPLOAD = "upload",
  DOWNLOAD = "download",
  LOGIN = "login",
  LOGOUT = "logout",
}

export enum AuditEntityType {
  USER = "user",
  BUSINESS = "business",
  INCOME_RECORD = "income_record",
  TAX_CALCULATION = "tax_calculation",
  TAX_RETURN = "tax_return",
  DOCUMENT = "document",
  CAPITAL_EXPENDITURE = "capital_expenditure",
  DONATION = "donation",
  TAX_CONFIG = "tax_config",
}

/**
 * Audit Log Entity
 * Tracks all user actions and data changes for compliance and security
 */
@Entity("audit_logs")
@Index(["userId", "createdAt"])
@Index(["entityType", "entityId"])
@Index(["action", "createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({
    type: "enum",
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: "enum",
    enum: AuditEntityType,
  })
  entityType: AuditEntityType;

  @Column({ nullable: true })
  entityId: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "jsonb", nullable: true })
  oldValue: any;

  @Column({ type: "jsonb", nullable: true })
  newValue: any;

  @Column({ type: "jsonb", nullable: true })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    duration?: number;
    [key: string]: any;
  };

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: "text", nullable: true })
  userAgent: string;

  @Column({ default: false })
  isSensitive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

