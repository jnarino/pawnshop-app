import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'pawnshop',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

console.log('[Database] Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  passwordSet: !!dbConfig.password
});

export const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
  console.log('[Database] Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client', err);
});

// Test the connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('[Database] Connection test failed:', err.message);
    console.error('[Database] Please verify your database credentials');
  } else {
    console.log('[Database] Connection test successful at', res.rows[0].now);
  }
});

// Graceful shutdown
export const closePool = async () => {
  await pool.end();
  console.log('[Database] Pool has ended');
};
