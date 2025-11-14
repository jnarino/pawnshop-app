// Lean offline server for PawnExpress (enhanced)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import healthRouter from './infrastructure/http/routes/healthRoutes';
import readyRouter from './infrastructure/http/routes/readyRoutes';
import { runMigrations } from './infrastructure/db/migrations/runMigrations';
import { pool } from './infrastructure/db';
import { notFound, errorHandler } from './infrastructure/http/errorHandler';
import { config } from './config';
import { logger } from './infrastructure/log/logger';
import { requestIdMiddleware } from './infrastructure/http/requestId';
import { accessLog } from './infrastructure/http/accessLog';
import { securityHeaders } from './infrastructure/http/securityHeaders';
import authRouter from './infrastructure/http/routes/authRoutes';
import customerRouter from './infrastructure/http/routes/customerRoutes';
import inventoryRouter from './infrastructure/http/routes/inventoryRoute';
import inventoryStatusRouter from './infrastructure/http/routes/inventoryStatusRoute';
import pawnTicketRouter from './infrastructure/http/routes/pawnTicketRoute';
import categoryRouter from './infrastructure/http/routes/categoryRoutes';
import debugRouter from './infrastructure/http/routes/debugRoutes';
import paymentRoutes from './infrastructure/http/routes/paymentRoutes';
import { validateJwt } from './infrastructure/http/middleware/auth';
import { shutdownAuthCache } from './infrastructure/http/routes/authRoutes';
import { categoryCache } from './container';

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

  // Public endpoints (no JWT required)
  app.use('/api/health', healthRouter);
  app.use('/api/ready', readyRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/debug', debugRouter); // Temporary debug endpoint

  // Protect all other /api routes with JWT
  app.use('/api', validateJwt);

  // Protected routes
  app.use('/api/customer', customerRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/inventory-status', inventoryStatusRouter);
  app.use('/api/pawnTicket', pawnTicketRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/payment', paymentRoutes); // ✅ Add payment routes

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

async function ensureDbReady() {
  const { retries, backoffMs } = config.dbConnect;
  let attempt = 0;
  // simple linear backoff (could add jitter later)
  while (true) {
    try {
      await pool.query('SELECT 1');
      if (!SKIP_MIGRATIONS) { logger.info('startup_migrations'); await runMigrations(); }
      return;
    } catch (e) {
      attempt++;
      if (attempt > retries) {
        logger.error('startup_db_failed', { attempts: attempt, error: (e as any)?.message });
        throw e;
      }
      logger.warn('startup_db_retry', { attempt, remaining: retries - attempt, backoffMs });
      await new Promise(r => setTimeout(r, backoffMs));
    }
  }
}

async function start() {
  logger.info('startup_begin', { env: config.nodeEnv, port: config.port, build: config.buildId });
  await ensureDbReady();
  const app = createApp();
  const server = app.listen(config.port, () => logger.info('startup_listening', { url: `http://localhost:${config.port}` }));

  const shutdown = async (signal: string) => {
    logger.warn('shutdown_initiated', { signal });
    const timer = setTimeout(() => { logger.error('shutdown_force_exit'); process.exit(1); }, config.shutdownTimeoutMs);

    server.close(async () => {
      try {
        await categoryCache.disconnect();
        await shutdownAuthCache();
        await pool.end();
        clearTimeout(timer);
        logger.info('shutdown_complete');
        process.exit(0);
      } catch (error) {
        logger.error('shutdown_error', { error });
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

if (require.main === module) start();

