import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761226118742 implements MigrationInterface {
    name = 'Migration1761226118742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "vatRate" SET DEFAULT '7.5'`);
        await queryRunner.query(`ALTER TABLE "vat_records" ALTER COLUMN "vatRate" SET DEFAULT '7.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vat_records" ALTER COLUMN "vatRate" SET DEFAULT 7.5`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "vatRate" SET DEFAULT 7.5`);
    }

}
