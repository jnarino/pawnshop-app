"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const __1 = require("..");
const logger_1 = require("../../log/logger");
// Pick your actual folder name: 'migration' or 'migrations'
const MIGRATIONS_DIR = path_1.default.resolve(__dirname); // .../db/migration
// advisory lock keys (two int32s)
const LOCK_KEY_1 = 7777;
const LOCK_KEY_2 = 42;
async function runMigrations() {
    // find .sql files in this folder (e.g., 0001_init.sql, 0002_users.sql)
    const files = fs_1.default.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.toLowerCase().endsWith('.sql'))
        .sort();
    logger_1.logger.info('[migrations] scanning', { dir: MIGRATIONS_DIR, count: files.length });
    const client = await __1.pool.connect();
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
            const fullPath = path_1.default.join(MIGRATIONS_DIR, file);
            const sql = fs_1.default.readFileSync(fullPath, 'utf8');
            const checksum = crypto_1.default.createHash('sha256').update(sql).digest('hex');
            const existing = await client.query('SELECT checksum FROM migrations WHERE name=$1', [file]);
            if (existing.rowCount) {
                const old = existing.rows[0].checksum;
                if (old && old !== checksum) {
                    throw new Error(`Checksum mismatch for migration ${file}. File modified after being run.`);
                }
                continue;
            }
            logger_1.logger.info('migration_run', { file });
            const started = Date.now();
            // run each file in its own savepoint so one bad file doesn't kill the whole batch
            await client.query('SAVEPOINT before_migration');
            try {
                await client.query(sql);
                await client.query('INSERT INTO migrations (name, checksum) VALUES ($1,$2)', [file, checksum]);
                const elapsed = Date.now() - started;
                logger_1.logger.info('migration_applied', { file, ms: elapsed });
            }
            catch (err) {
                await client.query('ROLLBACK TO SAVEPOINT before_migration');
                throw new Error(`Migration failed (${file}): ${err.message}`);
            }
        }
        await client.query('COMMIT');
        logger_1.logger.info('migrations_complete');
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        try {
            await client.query('SELECT pg_advisory_unlock($1, $2)', [LOCK_KEY_1, LOCK_KEY_2]);
        }
        catch { }
        client.release();
    }
}
