import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Exclude } from "class-transformer";
import { Business } from "../../business/entities/business.entity";
import { IncomeRecord } from "../../income/entities/income-record.entity";
import { TaxCalculation } from "../../tax-calculation/entities/tax-calculation.entity";
import { ForumPost } from "../../forum/entities/forum-post.entity";
import { Notification } from "../../notifications/entities/notification.entity";

export enum UserRole {
  EMPLOYEE = "employee",
  FREELANCER = "freelancer",
  BUSINESS_OWNER = "business_owner",
  INFORMAL_WORKER = "informal_worker",
  UNEMPLOYED = "unemployed",
  ADMIN = "admin",
}

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({
    type: "enum",
    enum: UserRole,
    array: true,
    default: [UserRole.EMPLOYEE],
  })
  roles: UserRole[];

  @Column({
    type: "enum",
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider: AuthProvider;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  tin: string; // Tax Identification Number

  @Column({ nullable: true })
  nin: string; // National Identification Number

  @Column({ default: false })
  tinVerified: boolean;

  @Column({ default: false })
  ninVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ type: "timestamp", nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Business, (business) => business.owner)
  businesses: Business[];

  @OneToMany(() => IncomeRecord, (income) => income.user)
  incomeRecords: IncomeRecord[];

  @OneToMany(() => TaxCalculation, (calculation) => calculation.user)
  taxCalculations: TaxCalculation[];

  @OneToMany(() => ForumPost, (post) => post.author)
  forumPosts: ForumPost[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
