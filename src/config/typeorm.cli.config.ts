import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'node:path';

config();

// Resolve globs relative to THIS file so they work both when run from source
// (ts-node, files end in .ts) and from the compiled build (files end in .js).
// The compiled output is CommonJS, so __dirname is available here.
const currentDir = __dirname;
const isCompiled = currentDir.includes('dist');
const ext = isCompiled ? 'js' : 'ts';

// currentDir is <root>/src/config or <root>/dist/config; go up one to reach
// the src/ or dist/ root, then match entities and migrations there.
const rootDir = join(currentDir, '..');

/**
 * TypeORM CLI DataSource — used by the `typeorm` CLI for generating and
 * running migrations. The app itself runs migrations at startup via a
 * dedicated entrypoint step (see docker-entrypoint.sh) using the compiled
 * output in dist/ (the `migration:run:prod` script).
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'quiz',
  password: process.env.DB_PASSWORD || 'quiz_secret',
  database: process.env.DB_NAME || 'quiz_db',
  entities: [join(rootDir, `**/*.entity.${ext}`)],
  migrations: [join(rootDir, `migrations/*.${ext}`)],
});
