# Database Migrations

This directory contains TypeORM database migrations for the EmpowerNaija application.

## Overview

TypeORM migrations provide a way to incrementally update the database schema while preserving existing data. Each migration is a TypeScript file that contains `up` and `down` methods to apply and revert changes.

## Migration Tracking

TypeORM automatically creates and maintains a `migrations` table in your database that tracks:

- **name**: The migration file name (e.g., `1234567890123-InitialSchema`)
- **timestamp**: When the migration was executed
- **id**: Auto-incrementing ID for each migration

This table is automatically created when you run your first migration and ensures that:

- Each migration runs only once
- Migrations run in the correct order (by timestamp)

## Available Commands

### Generate a Migration

Automatically generate a migration by comparing your entities with the current database schema:

```bash
npm run migration:generate
```

This will:

1. Compare your entity definitions with the current database schema
2. Generate a migration file with the necessary changes
3. Save it in `src/database/migrations/` with a timestamp prefix

**Example output:**

```
Migration /path/to/src/database/migrations/1234567890123-Migration.ts has been generated successfully.
```

### Create an Empty Migration

Create a blank migration file that you can manually edit:

```bash
npm run migration:create
```

Use this when you need to write custom SQL or complex data transformations.

### Run Migrations

Execute all pending migrations:

```bash
npm run migration:run
```

This will:

1. Check the `migrations` table to see which migrations have already run
2. Execute any new migrations in chronological order
3. Record each successful migration in the `migrations` table

**Example output:**

```
query: SELECT * FROM "migrations" "migrations"
query: BEGIN TRANSACTION
query: CREATE TABLE "users" (...)
query: INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2)
query: COMMIT
Migration 1234567890123-InitialSchema has been executed successfully.
```

### Revert Last Migration

Undo the most recently executed migration:

```bash
npm run migration:revert
```

This will:

1. Find the last migration that was run
2. Execute its `down` method to revert changes
3. Remove the entry from the `migrations` table

### Show Migration Status

View which migrations have been run and which are pending:

```bash
npm run migration:show
```

**Example output:**

```
[X] 1234567890123-InitialSchema
[X] 1234567890124-AddUserRoles
[ ] 1234567890125-AddBusinessEntities
```

## Migration Workflow

### 1. Initial Setup (First Time)

```bash
# Make sure your database is created
createdb empowernaija

# Configure your .env file with database credentials
cp .env.example .env

# Generate initial migration from your entities
npm run migration:generate

# Run the migration
npm run migration:run
```

### 2. Making Schema Changes

When you modify an entity (add/remove/change columns):

```bash
# 1. Update your entity file (e.g., user.entity.ts)

# 2. Generate migration from the changes
npm run migration:generate

# 3. Review the generated migration file

# 4. Run the migration
npm run migration:run
```

### 3. Production Deployment

```bash
# On your production server, after deploying new code:
npm run migration:run
```

**Important:** Never use `synchronize: true` in production! Always use migrations.

## Migration File Structure

A typical migration file looks like this:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1234567890123 implements MigrationInterface {
  name = "InitialSchema1234567890123";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQL to apply the migration
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "email" varchar NOT NULL UNIQUE,
                "firstName" varchar NOT NULL,
                ...
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQL to revert the migration
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
```

## Best Practices

### 1. Always Review Generated Migrations

Before running a migration, review the generated SQL to ensure it does what you expect:

```bash
# Generate migration
npm run migration:generate

# Review the file in src/database/migrations/
# Check both up() and down() methods
```

### 2. Test Migrations Locally First

```bash
# Run migration
npm run migration:run

# Test your application

# If something is wrong, revert
npm run migration:revert

# Fix the issue and generate a new migration
```

### 3. Never Modify Executed Migrations

Once a migration has been run in any environment (especially production), never modify it. Instead:

- Create a new migration to make additional changes
- This preserves the migration history

### 4. Keep Migrations Small and Focused

- One migration per logical change
- Easier to review and revert if needed
- Better git history

### 5. Handle Data Migrations Carefully

When migrating data, consider:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new column as nullable
    await queryRunner.query(`ALTER TABLE "users" ADD "newColumn" varchar`);

    // 2. Migrate existing data
    await queryRunner.query(`UPDATE "users" SET "newColumn" = 'default_value'`);

    // 3. Make column NOT NULL if needed
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "newColumn" SET NOT NULL`);
}
```

## Troubleshooting

### Migration Already Exists Error

If you see "Migration already exists", check:

1. The `migrations` table in your database
2. Delete the entry if you want to re-run it (development only!)

```sql
DELETE FROM migrations WHERE name = 'YourMigrationName';
```

### Migration Failed Mid-Execution

TypeORM wraps migrations in transactions, so failed migrations are automatically rolled back. Fix the issue and run again.

### Synchronize vs Migrations

- **synchronize: true** - Auto-updates schema (development only)
- **migrations** - Controlled schema updates (production)

Never use both at the same time!

## Configuration

The migration system is configured in `src/config/typeorm.config.ts`:

```typescript
export const dataSourceOptions: DataSourceOptions = {
  // ... database connection settings

  migrations: [join(__dirname, "..", "database", "migrations", "*{.ts,.js}")],

  migrationsTableName: "migrations", // Table name for tracking
  migrationsRun: false, // Don't auto-run on app start
};
```

## Additional Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [TypeORM Migration API](https://typeorm.io/migration-api)
- Project Documentation: `/docs/IMPLEMENTATION_GUIDE.md`
