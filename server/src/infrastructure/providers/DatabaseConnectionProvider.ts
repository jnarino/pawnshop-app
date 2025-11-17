import { pool } from '../db';
import type { Pool } from 'pg';

// ✅ Single Responsibility: Provides database connections
export class DatabaseConnectionProvider {
    private readonly _pool: Pool = pool;

    public getPool(): Pool {
        return this._pool;
    }

    public async shutdown(): Promise<void> {
        await this._pool.end();
        console.log('[DatabaseConnectionProvider] Pool has ended');
    }
}
