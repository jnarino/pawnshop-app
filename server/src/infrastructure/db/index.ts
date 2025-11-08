import { Pool } from 'pg';
import { config } from '../../config';
import { logger } from '../log/logger';

export const pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,
    password: config.db.password,
    port: config.db.port,
});

pool.on('error', (err) => {
    logger.error('db_pool_error', { message: err.message });
});
