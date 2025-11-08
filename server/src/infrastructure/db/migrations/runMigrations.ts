import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pool } from '..';
import { logger } from '../../log/logger';

// Pick your actual folder name: 'migration' or 'migrations'
const MIGRATIONS_DIR = path.resolve(__dirname); // .../db/migration

// advisory lock keys (two int32s)
const LOCK_KEY_1 = 7777;
const LOCK_KEY_2 = 42;

export async function runMigrations() {
  // find .sql files in this folder (e.g., 0001_init.sql, 0002_users.sql)
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.toLowerCase().endsWith('.sql'))
    .sort();

  logger.info('[migrations] scanning', { dir: MIGRATIONS_DIR, count: files.length });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_lock($1, $2)', [LOCK_KEY_1, LOCK_KEY_2]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        checksum TEXT,
        run_on TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await client.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='migrations' AND column_name='checksum') THEN
        ALTER TABLE migrations ADD COLUMN checksum TEXT;
      END IF; END $$;`);

    for (const file of files) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const existing = await client.query('SELECT checksum FROM migrations WHERE name=$1', [file]);
      if (existing.rowCount) {
        const old = existing.rows[0].checksum;
        if (old && old !== checksum) {
          throw new Error(`Checksum mismatch for migration ${file}. File modified after being run.`);
        }
        continue;
      }

      logger.info('migration_run', { file });
      const started = Date.now();

      // run each file in its own savepoint so one bad file doesn't kill the whole batch
      await client.query('SAVEPOINT before_migration');
      try {
  await client.query(sql);
  await client.query('INSERT INTO migrations (name, checksum) VALUES ($1,$2)', [file, checksum]);
  const elapsed = Date.now() - started;
  logger.info('migration_applied', { file, ms: elapsed });
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT before_migration');
        throw new Error(`Migration failed (${file}): ${(err as Error).message}`);
      }
    }

    await client.query('COMMIT');
  logger.info('migrations_complete');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1, $2)', [LOCK_KEY_1, LOCK_KEY_2]); } catch { }
    client.release();
  }
}
