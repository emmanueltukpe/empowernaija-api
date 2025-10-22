import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

/**
 * TypeORM DataSource configuration for migrations
 * This file is used by TypeORM CLI for running migrations
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'empowernaija',
  
  entities: [
    join(__dirname, '..', '**', '*.entity{.ts,.js}'),
  ],
  
  migrations: [
    join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}'),
  ],
  
  migrationsTableName: 'migrations',
  migrationsRun: false,
  
  synchronize: process.env.DATABASE_SYNC === 'false',
  logging: process.env.DATABASE_LOGGING === 'true',
  
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
  },
};

/**
 * DataSource instance for TypeORM CLI
 * This is what the migration commands will use
 */
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;

