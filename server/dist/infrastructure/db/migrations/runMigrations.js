"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const __1 = require("..");
// Pick your actual folder name: 'migration' or 'migrations'
const MIGRATIONS_DIR = path_1.default.resolve(__dirname); // .../db/migration
// advisory lock keys (two int32s)
const LOCK_KEY_1 = 7777;
const LOCK_KEY_2 = 42;
async function runMigrations() {
    // find .sql files in this folder (e.g., 0001_init.sql, 0002_users.sql)
    const files = fs_1.default.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.toLowerCase().endsWith('.sql'))
        .sort(); // lexicographic order
    const client = await __1.pool.connect();
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
            const { rowCount } = await client.query('SELECT 1 FROM migrations WHERE name = $1', [file]);
            if (rowCount)
                continue;
            const sql = fs_1.default.readFileSync(path_1.default.join(MIGRATIONS_DIR, file), 'utf8');
            console.log(`🔄 Running migration: ${file}`);
            // run each file in its own savepoint so one bad file doesn't kill the whole batch
            await client.query('SAVEPOINT before_migration');
            try {
                await client.query(sql);
                await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
            }
            catch (err) {
                await client.query('ROLLBACK TO SAVEPOINT before_migration');
                throw new Error(`Migration failed (${file}): ${err.message}`);
            }
        }
        await client.query('COMMIT');
        console.log('✅ Migrations complete');
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
