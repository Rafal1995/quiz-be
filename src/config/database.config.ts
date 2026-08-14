import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'quiz',
  password: process.env.DB_PASSWORD || 'quiz_secret',
  database: process.env.DB_NAME || 'quiz_db',
}));
