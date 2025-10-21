"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
exports.pool = new pg_1.Pool(dbConfig);
// Test connection
exports.pool.on('connect', () => {
    console.log('[Database] Connected to PostgreSQL');
});
exports.pool.on('error', (err) => {
    console.error('[Database] Unexpected error on idle client', err);
});
// Test the connection on startup
exports.pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('[Database] Connection test failed:', err.message);
        console.error('[Database] Please verify your database credentials');
    }
    else {
        console.log('[Database] Connection test successful at', res.rows[0].now);
    }
});
// Graceful shutdown
const closePool = async () => {
    await exports.pool.end();
    console.log('[Database] Pool has ended');
};
exports.closePool = closePool;
