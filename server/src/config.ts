// Central configuration loader & validator (offline-safe, no deps)
// Ensure .env is loaded BEFORE we read process.env even if other modules import config first
import 'dotenv/config';
import crypto from 'crypto';

interface RawEnv {
  NODE_ENV?: string;
  PORT?: string;
  JSON_LIMIT?: string;
  PG_USER?: string; PG_HOST?: string; PG_DATABASE?: string; PG_PASSWORD?: string; PG_PORT?: string;
  SHUTDOWN_TIMEOUT_MS?: string;
  MAX_PAGE_SIZE?: string;
  DB_CONNECT_RETRIES?: string;
  DB_CONNECT_BACKOFF_MS?: string;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  jsonLimit: string;
  db: { user: string; host: string; database: string; password: string; port: number; };
  shutdownTimeoutMs: number;
  maxPageSize: number;
  buildId: string; // random id per boot to trace logs offline
  dbConnect: { retries: number; backoffMs: number; };
}

function requireEnv(name: keyof RawEnv, env: RawEnv, allowDefault?: string, relaxed?: boolean): string {
  const raw = env[name];
  if (raw !== undefined && raw !== '') return raw; // always prefer explicit value
  if (relaxed && allowDefault !== undefined) return allowDefault; // allow fallback when relaxed (e.g., test) and missing
  if (raw === '' || raw === undefined) throw new Error(`Missing required environment variable ${name}`);
  return raw as string;
}

let cached: AppConfig | undefined;
export function loadConfig(env: Partial<RawEnv> = process.env as any): AppConfig {
  if (cached) return cached;
  const nodeEnv = env.NODE_ENV || 'development';
  const port = Number(env.PORT || 3000);
  const jsonLimit = env.JSON_LIMIT || '1mb';
  const shutdownTimeoutMs = Number(env.SHUTDOWN_TIMEOUT_MS || 8000);
  const maxPageSize = Math.min(Number(env.MAX_PAGE_SIZE || 100), 500); // hard cap 500
  const dbConnect = {
    retries: Math.max(0, Number(env.DB_CONNECT_RETRIES ?? 5)),
    backoffMs: Math.max(100, Number(env.DB_CONNECT_BACKOFF_MS ?? 1000)),
  };
  const testDefaults = nodeEnv === 'test';
  const db = {
    user: requireEnv('PG_USER', env, 'test_user', testDefaults),
    host: requireEnv('PG_HOST', env, 'localhost', testDefaults),
    database: requireEnv('PG_DATABASE', env, 'test_db', testDefaults),
    password: requireEnv('PG_PASSWORD', env, 'test_pw', testDefaults),
    port: Number(requireEnv('PG_PORT', env, '5432', testDefaults)) || 5432,
  };
  cached = { nodeEnv, port, jsonLimit, db, shutdownTimeoutMs, maxPageSize, buildId: crypto.randomUUID(), dbConnect };
  return cached;
}

export const config = loadConfig();
