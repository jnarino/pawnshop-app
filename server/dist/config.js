"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.loadConfig = loadConfig;
// Central configuration loader & validator (offline-safe, no deps)
// Ensure .env is loaded BEFORE we read process.env even if other modules import config first
require("dotenv/config");
const crypto_1 = __importDefault(require("crypto"));
function requireEnv(name, env, allowDefault, relaxed) {
    const raw = env[name];
    if (raw !== undefined && raw !== '')
        return raw; // always prefer explicit value
    if (relaxed && allowDefault !== undefined)
        return allowDefault; // allow fallback when relaxed (e.g., test) and missing
    if (raw === '' || raw === undefined)
        throw new Error(`Missing required environment variable ${name}`);
    return raw;
}
let cached;
function loadConfig(env = process.env) {
    if (cached)
        return cached;
    const nodeEnv = env.NODE_ENV || 'development';
    const port = Number(env.PORT || 3000);
    const jsonLimit = env.JSON_LIMIT || '1mb';
    const shutdownTimeoutMs = Number(env.SHUTDOWN_TIMEOUT_MS || 8000);
    const maxPageSize = Math.min(Number(env.MAX_PAGE_SIZE || 100), 500); // hard cap 500
    const testDefaults = nodeEnv === 'test';
    const db = {
        user: requireEnv('PG_USER', env, 'test_user', testDefaults),
        host: requireEnv('PG_HOST', env, 'localhost', testDefaults),
        database: requireEnv('PG_DATABASE', env, 'test_db', testDefaults),
        password: requireEnv('PG_PASSWORD', env, 'test_pw', testDefaults),
        port: Number(requireEnv('PG_PORT', env, '5432', testDefaults)) || 5432,
    };
    cached = { nodeEnv, port, jsonLimit, db, shutdownTimeoutMs, maxPageSize, buildId: crypto_1.default.randomUUID() };
    return cached;
}
exports.config = loadConfig();
