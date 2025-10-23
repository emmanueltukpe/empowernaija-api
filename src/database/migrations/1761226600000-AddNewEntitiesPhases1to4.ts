import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewEntitiesPhases1to41761226600000
  implements MigrationInterface
{
  name = "AddNewEntitiesPhases1to41761226600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for new entities
    await queryRunner.query(`
      CREATE TYPE "public"."documents_documenttype_enum" AS ENUM(
        'rent_receipt', 'lease_agreement', 'pension_certificate', 
        'health_insurance_policy', 'capital_expenditure_invoice', 
        'donation_receipt', 'severance_agreement', 'termination_letter', 
        'ngo_exemption_certificate', 'cac_registration', 'bank_statement', 
        'tax_clearance_certificate', 'agricultural_registration', 
        'investment_certificate', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."documents_status_enum" AS ENUM('pending', 'verified', 'rejected')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."tax_returns_status_enum" AS ENUM(
        'draft', 'pending_review', 'ready_to_file', 'filed', 'accepted', 'rejected'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."audit_logs_action_enum" AS ENUM(
        'create', 'update', 'delete', 'view', 'calculate', 'submit', 
        'approve', 'reject', 'verify', 'upload', 'download', 'login', 'logout'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."audit_logs_entitytype_enum" AS ENUM(
        'user', 'business', 'income_record', 'tax_calculation', 'tax_return', 
        'document', 'capital_expenditure', 'donation', 'tax_config'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."tax_configurations_valuetype_enum" AS ENUM(
        'number', 'string', 'boolean', 'json'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."businesses_businesstype_enum" AS ENUM(
        'for_profit', 'ngo', 'charity', 'religious', 'educational'
      )
    `);

    // Add new columns to businesses table
    await queryRunner.query(`
      ALTER TABLE "businesses" 
      ADD COLUMN "businessType" "public"."businesses_businesstype_enum" NOT NULL DEFAULT 'for_profit'
    `);

    await queryRunner.query(`
      ALTER TABLE "businesses" 
      ADD COLUMN "taxExemptStatus" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "businesses" 
      ADD COLUMN "exemptionCertificateUrl" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "businesses" 
      ADD COLUMN "isAgriculturalBusiness" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "businesses"
      ADD COLUMN "agriculturalBusinessStartDate" date
    `);

    // Create documents table
    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "documentType" "public"."documents_documenttype_enum" NOT NULL,
        "fileName" character varying NOT NULL,
        "fileUrl" character varying NOT NULL,
        "fileSizeBytes" bigint NOT NULL,
        "mimeType" character varying NOT NULL,
        "uploadDate" date NOT NULL,
        "userId" uuid,
        "businessId" uuid,
        "taxYear" integer NOT NULL,
        "ocrData" jsonb,
        "status" "public"."documents_status_enum" NOT NULL DEFAULT 'pending',
        "notes" text,
        "rejectionReason" text,
        "verifiedBy" character varying,
        "verifiedAt" TIMESTAMP,
        "description" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents" PRIMARY KEY ("id")
      )
    `);

    // Create tax_returns table
    await queryRunner.query(`
      CREATE TABLE "tax_returns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "businessId" uuid,
        "taxYear" integer NOT NULL,
        "taxType" "public"."tax_calculations_taxtype_enum" NOT NULL,
        "totalIncome" numeric(15,2) NOT NULL,
        "totalDeductions" numeric(15,2) NOT NULL DEFAULT 0,
        "totalReliefs" numeric(15,2) NOT NULL DEFAULT 0,
        "taxableIncome" numeric(15,2) NOT NULL,
        "taxLiability" numeric(15,2) NOT NULL,
        "taxPaid" numeric(15,2) NOT NULL DEFAULT 0,
        "taxDue" numeric(15,2) NOT NULL DEFAULT 0,
        "status" "public"."tax_returns_status_enum" NOT NULL DEFAULT 'draft',
        "supportingDocuments" jsonb,
        "calculationBreakdown" jsonb,
        "generatedPdfUrl" character varying,
        "submitted" boolean NOT NULL DEFAULT false,
        "submissionDate" TIMESTAMP,
        "firsReferenceNumber" character varying,
        "notes" text,
        "rejectionReason" text,
        "documentationComplete" boolean NOT NULL DEFAULT false,
        "missingDocuments" jsonb,
        "validationErrors" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tax_returns" PRIMARY KEY ("id")
      )
    `);

    // Create capital_expenditures table
    await queryRunner.query(`
      CREATE TABLE "capital_expenditures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "businessId" uuid NOT NULL,
        "amount" numeric(15,2) NOT NULL,
        "expenditureDate" date NOT NULL,
        "description" text NOT NULL,
        "invoiceUrl" character varying,
        "supplierName" character varying,
        "supplierTIN" character varying,
        "taxYear" integer NOT NULL,
        "creditClaimed" numeric(15,2) NOT NULL DEFAULT 0,
        "creditRemaining" numeric(15,2) NOT NULL DEFAULT 0,
        "fullyUtilized" boolean NOT NULL DEFAULT false,
        "expiryYear" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_capital_expenditures" PRIMARY KEY ("id")
      )
    `);

    // Create tax_credit_carryforwards table
    await queryRunner.query(`
      CREATE TABLE "tax_credit_carryforwards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "businessId" uuid NOT NULL,
        "capitalExpenditureId" uuid,
        "originYear" integer NOT NULL,
        "originalAmount" numeric(15,2) NOT NULL,
        "remainingAmount" numeric(15,2) NOT NULL,
        "expiryYear" integer NOT NULL,
        "fullyUtilized" boolean NOT NULL DEFAULT false,
        "lastAppliedYear" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tax_credit_carryforwards" PRIMARY KEY ("id")
      )
    `);

    // Create corporate_donations table
    await queryRunner.query(`
      CREATE TABLE "corporate_donations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "businessId" uuid NOT NULL,
        "amount" numeric(15,2) NOT NULL,
        "donationDate" date NOT NULL,
        "recipientName" character varying NOT NULL,
        "recipientTIN" character varying,
        "recipientVerified" boolean NOT NULL DEFAULT false,
        "receiptUrl" character varying,
        "taxYear" integer NOT NULL,
        "deductionClaimed" numeric(15,2) NOT NULL DEFAULT 0,
        "description" text,
        "approved" boolean NOT NULL DEFAULT false,
        "rejectionReason" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_corporate_donations" PRIMARY KEY ("id")
      )
    `);

    // Create tax_configurations table
    await queryRunner.query(`
      CREATE TABLE "tax_configurations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taxYear" integer NOT NULL,
        "configKey" character varying NOT NULL,
        "configValue" text NOT NULL,
        "valueType" "public"."tax_configurations_valuetype_enum" NOT NULL DEFAULT 'string',
        "description" text,
        "effectiveDate" date NOT NULL,
        "expiryDate" date,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tax_configurations" PRIMARY KEY ("id")
      )
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "action" "public"."audit_logs_action_enum" NOT NULL,
        "entityType" "public"."audit_logs_entitytype_enum" NOT NULL,
        "entityId" character varying,
        "description" text,
        "oldValue" jsonb,
        "newValue" jsonb,
        "metadata" jsonb,
        "ipAddress" character varying,
        "userAgent" text,
        "isSensitive" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_userId_createdAt" ON "audit_logs" ("userId", "createdAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entityType_entityId" ON "audit_logs" ("entityType", "entityId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_action_createdAt" ON "audit_logs" ("action", "createdAt")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tax_configurations_taxYear_configKey" ON "tax_configurations" ("taxYear", "configKey")`
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "documents" 
      ADD CONSTRAINT "FK_documents_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "documents" 
      ADD CONSTRAINT "FK_documents_businessId" 
      FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tax_returns" 
      ADD CONSTRAINT "FK_tax_returns_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tax_returns"
      ADD CONSTRAINT "FK_tax_returns_businessId"
      FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "capital_expenditures"
      ADD CONSTRAINT "FK_capital_expenditures_businessId"
      FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tax_credit_carryforwards"
      ADD CONSTRAINT "FK_tax_credit_carryforwards_businessId"
      FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tax_credit_carryforwards"
      ADD CONSTRAINT "FK_tax_credit_carryforwards_capitalExpenditureId"
      FOREIGN KEY ("capitalExpenditureId") REFERENCES "capital_expenditures"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "corporate_donations"
      ADD CONSTRAINT "FK_corporate_donations_businessId"
      FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_userId"`
    );
    await queryRunner.query(
      `ALTER TABLE "corporate_donations" DROP CONSTRAINT "FK_corporate_donations_businessId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tax_credit_carryforwards" DROP CONSTRAINT "FK_tax_credit_carryforwards_capitalExpenditureId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tax_credit_carryforwards" DROP CONSTRAINT "FK_tax_credit_carryforwards_businessId"`
    );
    await queryRunner.query(
      `ALTER TABLE "capital_expenditures" DROP CONSTRAINT "FK_capital_expenditures_businessId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tax_returns" DROP CONSTRAINT "FK_tax_returns_businessId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tax_returns" DROP CONSTRAINT "FK_tax_returns_userId"`
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_documents_businessId"`
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_documents_userId"`
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "IDX_tax_configurations_taxYear_configKey"`
    );
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_action_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_entityType_entityId"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_userId_createdAt"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "tax_configurations"`);
    await queryRunner.query(`DROP TABLE "corporate_donations"`);
    await queryRunner.query(`DROP TABLE "tax_credit_carryforwards"`);
    await queryRunner.query(`DROP TABLE "capital_expenditures"`);
    await queryRunner.query(`DROP TABLE "tax_returns"`);
    await queryRunner.query(`DROP TABLE "documents"`);

    // Revert businesses table changes
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "agriculturalBusinessStartDate"`
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "isAgriculturalBusiness"`
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "exemptionCertificateUrl"`
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "taxExemptStatus"`
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "businessType"`
    );

    // Drop enum types
    await queryRunner.query(
      `DROP TYPE "public"."businesses_businesstype_enum"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."tax_configurations_valuetype_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."audit_logs_entitytype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tax_returns_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."documents_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."documents_documenttype_enum"`);
  }
}
