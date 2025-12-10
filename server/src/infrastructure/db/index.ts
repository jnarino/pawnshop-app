import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';
import { logger } from '../logger';

export const pool = new Pool({
  connectionString: env.databaseUrl
});

export async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    logger.info('Running migration', file);
    await pool.query(sql);
  }
}
