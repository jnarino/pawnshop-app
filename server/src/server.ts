// Lean offline server for PawnExpress (enhanced)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoute from './route/authRoute';
import customerRoute from './route/customerRoute';
import pawnTicketRoute from './route/pawnTicketRoute';
import inventoryRoute from './route/inventoryRoute';
import { runMigrations } from './infrastructure/db/migrations/runMigrations';
import { pool } from './infrastructure/db';
import { notFound, errorHandler } from './infrastructure/http/errorHandler';
import { config } from './config';
import { logger } from './infrastructure/log/logger';
import { requestIdMiddleware } from './infrastructure/http/requestId';
import { accessLog } from './infrastructure/http/accessLog';
import { securityHeaders } from './infrastructure/http/securityHeaders';

const SKIP_MIGRATIONS = process.env.SKIP_MIGRATIONS === 'true';
let activeRequests = 0;

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: config.jsonLimit }));
  app.use(requestIdMiddleware);
  app.use((req, res, next) => { activeRequests++; res.on('finish', () => { activeRequests--; }); next(); });
  app.use(accessLog);
  app.use(securityHeaders);

  app.use('/api/auth', authRoute);
  app.use('/api/customer', customerRoute);
  app.use('/api/pawnTicket', pawnTicketRoute);
  app.use('/api/inventory', inventoryRoute);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/ready', async (_req, res) => { try { await pool.query('SELECT 1'); res.json({ ready: true }); } catch { res.status(503).json({ ready: false }); } });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

async function start() {
  logger.info('startup_begin', { env: config.nodeEnv, port: config.port, build: config.buildId });
  if (!SKIP_MIGRATIONS) { logger.info('startup_migrations'); await runMigrations(); }
  const app = createApp();
  const server = app.listen(config.port, () => logger.info('startup_listening', { url: `http://localhost:${config.port}` }));
  const shutdown = (signal: string) => {
    logger.warn('shutdown_initiated', { signal });
    const timer = setTimeout(() => { logger.error('shutdown_force_exit', { activeRequests }); process.exit(1); }, config.shutdownTimeoutMs);
    server.close(() => {
      const check = () => {
        if (activeRequests > 0) { logger.warn('shutdown_waiting', { activeRequests }); setTimeout(check, 250); return; }
        pool.end().finally(() => { clearTimeout(timer); logger.info('shutdown_complete'); process.exit(0); });
      };
      check();
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (r) => logger.error('unhandled_rejection', { reason: String(r) }));
  process.on('uncaughtException', (e) => { logger.error('uncaught_exception', { message: e.message, stack: e.stack }); shutdown('uncaughtException'); });
}

if (require.main === module) start();

