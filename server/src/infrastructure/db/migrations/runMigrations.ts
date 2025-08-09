import fs from 'fs';
import path from 'path';
import { pool } from '..';

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

  console.log(`[migrations] dir: ${MIGRATIONS_DIR}`);
  console.log(`[migrations] files: ${files.length ? files.join(', ') : '(none found)'}`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_lock($1, $2)', [LOCK_KEY_1, LOCK_KEY_2]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        run_on TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    for (const file of files) {
      const { rowCount } = await client.query(
        'SELECT 1 FROM migrations WHERE name = $1',
        [file]
      );
      if (rowCount) continue;

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`🔄 Running migration: ${file}`);

      // run each file in its own savepoint so one bad file doesn't kill the whole batch
      await client.query('SAVEPOINT before_migration');
      try {
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT before_migration');
        throw new Error(`Migration failed (${file}): ${(err as Error).message}`);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Migrations complete');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1, $2)', [LOCK_KEY_1, LOCK_KEY_2]); } catch { }
    client.release();
  }
}
