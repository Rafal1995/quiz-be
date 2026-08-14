import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

/**
 * TypeORM CLI DataSource — used by `typeorm` CLI for generating
 * and running migrations. NOT used by the app at runtime.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'quiz',
  password: process.env.DB_PASSWORD || 'quiz_secret',
  database: process.env.DB_NAME || 'quiz_db',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
