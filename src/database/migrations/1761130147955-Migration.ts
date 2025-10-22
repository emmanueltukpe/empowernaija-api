import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761130147955 implements MigrationInterface {
    name = 'Migration1761130147955'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."income_records_source_enum" AS ENUM('salary', 'freelance', 'business', 'investment', 'rental', 'pension', 'prize', 'grant', 'digital_asset', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."income_records_frequency_enum" AS ENUM('one_time', 'daily', 'weekly', 'monthly', 'quarterly', 'annually')`);
        await queryRunner.query(`CREATE TABLE "income_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source" "public"."income_records_source_enum" NOT NULL, "amount" numeric(15,2) NOT NULL, "incomeDate" date NOT NULL, "frequency" "public"."income_records_frequency_enum" NOT NULL DEFAULT 'one_time', "description" text, "payer" character varying, "taxCalculated" boolean NOT NULL DEFAULT false, "calculatedTax" numeric(15,2), "taxPaid" boolean NOT NULL DEFAULT false, "taxPaymentDate" date, "receiptUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_4ac197a85317ab0af01c7fa19e2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tax_calculations_taxtype_enum" AS ENUM('personal_income_tax', 'company_income_tax', 'capital_gains_tax', 'value_added_tax', 'development_levy', 'stamp_duty', 'withholding_tax')`);
        await queryRunner.query(`CREATE TYPE "public"."tax_calculations_taxyear_enum" AS ENUM('2025', '2026', '2027')`);
        await queryRunner.query(`CREATE TABLE "tax_calculations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taxType" "public"."tax_calculations_taxtype_enum" NOT NULL, "taxYear" "public"."tax_calculations_taxyear_enum" NOT NULL DEFAULT '2026', "taxableIncome" numeric(15,2) NOT NULL, "taxLiability" numeric(15,2) NOT NULL, "deductions" numeric(15,2) NOT NULL DEFAULT '0', "reliefs" numeric(15,2) NOT NULL DEFAULT '0', "rentRelief" numeric(15,2) NOT NULL DEFAULT '0', "pensionContribution" numeric(15,2) NOT NULL DEFAULT '0', "healthInsurance" numeric(15,2) NOT NULL DEFAULT '0', "breakdown" jsonb, "notes" text, "calculationDate" date NOT NULL, "isFiled" boolean NOT NULL DEFAULT false, "filingDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "businessId" uuid, CONSTRAINT "PK_2336d6892ee3f8738d374f10b76" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."forum_posts_category_enum" AS ENUM('general', 'tax_questions', 'business', 'compliance', 'reforms', 'support')`);
        await queryRunner.query(`CREATE TABLE "forum_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "content" text NOT NULL, "category" "public"."forum_posts_category_enum" NOT NULL DEFAULT 'general', "tags" text, "viewCount" integer NOT NULL DEFAULT '0', "replyCount" integer NOT NULL DEFAULT '0', "isResolved" boolean NOT NULL DEFAULT false, "isPinned" boolean NOT NULL DEFAULT false, "isLocked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "authorId" uuid NOT NULL, CONSTRAINT "PK_3e9c301114a0fd42c998681b04e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('tax_deadline', 'payment_reminder', 'compliance_alert', 'system', 'educational', 'forum')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notifications_type_enum" NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "link" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_roles_enum" AS ENUM('employee', 'freelancer', 'business_owner', 'unemployed', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."users_authprovider_enum" AS ENUM('local', 'google')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "phoneNumber" character varying, "roles" "public"."users_roles_enum" array NOT NULL DEFAULT '{employee}', "authProvider" "public"."users_authprovider_enum" NOT NULL DEFAULT 'local', "googleId" character varying, "avatar" character varying, "tin" character varying, "nin" character varying, "tinVerified" boolean NOT NULL DEFAULT false, "ninVerified" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "emailVerified" boolean NOT NULL DEFAULT false, "refreshToken" character varying, "lastLoginAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."invoices_status_enum" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceNumber" character varying NOT NULL, "clientName" character varying NOT NULL, "clientEmail" character varying, "clientAddress" character varying, "description" text, "subtotal" numeric(15,2) NOT NULL, "vatRate" numeric(5,2) NOT NULL DEFAULT '7.5', "vatAmount" numeric(15,2) NOT NULL, "totalAmount" numeric(15,2) NOT NULL, "issueDate" date NOT NULL, "dueDate" date NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'draft', "paidDate" date, "lineItems" jsonb, "notes" text, "pdfUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "businessId" uuid NOT NULL, CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."businesses_sector_enum" AS ENUM('agriculture', 'manufacturing', 'retail', 'services', 'technology', 'healthcare', 'education', 'construction', 'hospitality', 'transport', 'finance', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."businesses_size_enum" AS ENUM('micro', 'small', 'medium', 'large')`);
        await queryRunner.query(`CREATE TABLE "businesses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessName" character varying NOT NULL, "registrationNumber" character varying, "tin" character varying, "tinVerified" boolean NOT NULL DEFAULT false, "sector" "public"."businesses_sector_enum" NOT NULL, "size" "public"."businesses_size_enum" NOT NULL DEFAULT 'micro', "estimatedAnnualTurnover" numeric(15,2) NOT NULL DEFAULT '0', "estimatedAssetValue" numeric(15,2) NOT NULL DEFAULT '0', "address" character varying, "city" character varying, "state" character varying, "phoneNumber" character varying, "email" character varying, "website" character varying, "description" text, "isActive" boolean NOT NULL DEFAULT true, "registrationDate" date, "vatRegistered" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid NOT NULL, CONSTRAINT "PK_bc1bf63498dd2368ce3dc8686e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."vat_records_type_enum" AS ENUM('input', 'output')`);
        await queryRunner.query(`CREATE TABLE "vat_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."vat_records_type_enum" NOT NULL, "baseAmount" numeric(15,2) NOT NULL, "vatRate" numeric(5,2) NOT NULL DEFAULT '7.5', "vatAmount" numeric(15,2) NOT NULL, "totalAmount" numeric(15,2) NOT NULL, "transactionDate" date NOT NULL, "description" text, "invoiceNumber" character varying, "supplierName" character varying, "isZeroRated" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "businessId" uuid NOT NULL, CONSTRAINT "PK_05b8c6d7df1b155c7e77e01d5da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."learning_modules_type_enum" AS ENUM('article', 'video', 'quiz', 'guide')`);
        await queryRunner.query(`CREATE TYPE "public"."learning_modules_category_enum" AS ENUM('tax_basics', 'personal_tax', 'business_tax', 'compliance', 'planning', 'reforms_2026')`);
        await queryRunner.query(`CREATE TYPE "public"."learning_modules_difficulty_enum" AS ENUM('beginner', 'intermediate', 'advanced')`);
        await queryRunner.query(`CREATE TABLE "learning_modules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "content" text NOT NULL, "type" "public"."learning_modules_type_enum" NOT NULL, "category" "public"."learning_modules_category_enum" NOT NULL, "difficulty" "public"."learning_modules_difficulty_enum" NOT NULL DEFAULT 'beginner', "videoUrl" character varying, "thumbnailUrl" character varying, "durationMinutes" integer NOT NULL DEFAULT '0', "quizQuestions" jsonb, "tags" text, "isPublished" boolean NOT NULL DEFAULT true, "viewCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5884364b4820dc6ee536d3f65ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."compliance_tasks_type_enum" AS ENUM('tax_filing', 'vat_return', 'annual_return', 'audit', 'license_renewal', 'registration', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."compliance_tasks_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'overdue')`);
        await queryRunner.query(`CREATE TABLE "compliance_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."compliance_tasks_type_enum" NOT NULL, "title" character varying NOT NULL, "description" text, "dueDate" date NOT NULL, "status" "public"."compliance_tasks_status_enum" NOT NULL DEFAULT 'pending', "completedDate" date, "notes" text, "documentUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "businessId" uuid, CONSTRAINT "PK_204138d089f35800efce2207a5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "income_records" ADD CONSTRAINT "FK_df10c13ad51c3f70adc58e92c10" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tax_calculations" ADD CONSTRAINT "FK_310e0f70e25ceccfbdabd818164" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tax_calculations" ADD CONSTRAINT "FK_573d63553ccdb0f63b87155ddf5" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_posts" ADD CONSTRAINT "FK_151dff45f01c0c195022e7db127" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_68a367d17c787b9d2925987a4fa" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD CONSTRAINT "FK_02e7bfb8e766e8e0ef449cc0f36" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vat_records" ADD CONSTRAINT "FK_bd9b0caf3850ef778465daa2d69" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compliance_tasks" ADD CONSTRAINT "FK_e042b266646c84eb9447145bb60" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compliance_tasks" ADD CONSTRAINT "FK_77d816ab1e21fbec88ed26cd774" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "compliance_tasks" DROP CONSTRAINT "FK_77d816ab1e21fbec88ed26cd774"`);
        await queryRunner.query(`ALTER TABLE "compliance_tasks" DROP CONSTRAINT "FK_e042b266646c84eb9447145bb60"`);
        await queryRunner.query(`ALTER TABLE "vat_records" DROP CONSTRAINT "FK_bd9b0caf3850ef778465daa2d69"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP CONSTRAINT "FK_02e7bfb8e766e8e0ef449cc0f36"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_68a367d17c787b9d2925987a4fa"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "forum_posts" DROP CONSTRAINT "FK_151dff45f01c0c195022e7db127"`);
        await queryRunner.query(`ALTER TABLE "tax_calculations" DROP CONSTRAINT "FK_573d63553ccdb0f63b87155ddf5"`);
        await queryRunner.query(`ALTER TABLE "tax_calculations" DROP CONSTRAINT "FK_310e0f70e25ceccfbdabd818164"`);
        await queryRunner.query(`ALTER TABLE "income_records" DROP CONSTRAINT "FK_df10c13ad51c3f70adc58e92c10"`);
        await queryRunner.query(`DROP TABLE "compliance_tasks"`);
        await queryRunner.query(`DROP TYPE "public"."compliance_tasks_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."compliance_tasks_type_enum"`);
        await queryRunner.query(`DROP TABLE "learning_modules"`);
        await queryRunner.query(`DROP TYPE "public"."learning_modules_difficulty_enum"`);
        await queryRunner.query(`DROP TYPE "public"."learning_modules_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."learning_modules_type_enum"`);
        await queryRunner.query(`DROP TABLE "vat_records"`);
        await queryRunner.query(`DROP TYPE "public"."vat_records_type_enum"`);
        await queryRunner.query(`DROP TABLE "businesses"`);
        await queryRunner.query(`DROP TYPE "public"."businesses_size_enum"`);
        await queryRunner.query(`DROP TYPE "public"."businesses_sector_enum"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_authprovider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "forum_posts"`);
        await queryRunner.query(`DROP TYPE "public"."forum_posts_category_enum"`);
        await queryRunner.query(`DROP TABLE "tax_calculations"`);
        await queryRunner.query(`DROP TYPE "public"."tax_calculations_taxyear_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tax_calculations_taxtype_enum"`);
        await queryRunner.query(`DROP TABLE "income_records"`);
        await queryRunner.query(`DROP TYPE "public"."income_records_frequency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."income_records_source_enum"`);
    }

}
