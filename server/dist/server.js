"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
// Lean offline server for PawnExpress (enhanced)
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoute_1 = __importDefault(require("./route/authRoute"));
const customerRoute_1 = __importDefault(require("./route/customerRoute"));
const pawnTicketRoute_1 = __importDefault(require("./route/pawnTicketRoute"));
const inventoryRoute_1 = __importDefault(require("./route/inventoryRoute"));
const inventoryStatusRoute_1 = __importDefault(require("./route/inventoryStatusRoute"));
const runMigrations_1 = require("./infrastructure/db/migrations/runMigrations");
const db_1 = require("./infrastructure/db");
const errorHandler_1 = require("./infrastructure/http/errorHandler");
const config_1 = require("./config");
const logger_1 = require("./infrastructure/log/logger");
const requestId_1 = require("./infrastructure/http/requestId");
const accessLog_1 = require("./infrastructure/http/accessLog");
const securityHeaders_1 = require("./infrastructure/http/securityHeaders");
const SKIP_MIGRATIONS = process.env.SKIP_MIGRATIONS === 'true';
let activeRequests = 0;
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: true, credentials: true }));
    app.use((0, cookie_parser_1.default)());
    app.use(express_1.default.json({ limit: config_1.config.jsonLimit }));
    app.use(requestId_1.requestIdMiddleware);
    app.use((req, res, next) => { activeRequests++; res.on('finish', () => { activeRequests--; }); next(); });
    app.use(accessLog_1.accessLog);
    app.use(securityHeaders_1.securityHeaders);
    app.use('/api/auth', authRoute_1.default);
    app.use('/api/customer', customerRoute_1.default);
    app.use('/api/pawnTicket', pawnTicketRoute_1.default);
    app.use('/api/inventory', inventoryRoute_1.default);
    app.use('/api/inventory-status', inventoryStatusRoute_1.default);
    app.get('/api/health', (_req, res) => res.json({ ok: true }));
    app.get('/api/ready', async (_req, res) => { try {
        await db_1.pool.query('SELECT 1');
        res.json({ ready: true });
    }
    catch {
        res.status(503).json({ ready: false });
    } });
    app.use(errorHandler_1.notFound);
    app.use(errorHandler_1.errorHandler);
    return app;
}
async function ensureDbReady() {
    const { retries, backoffMs } = config_1.config.dbConnect;
    let attempt = 0;
    // simple linear backoff (could add jitter later)
    while (true) {
        try {
            await db_1.pool.query('SELECT 1');
            if (!SKIP_MIGRATIONS) {
                logger_1.logger.info('startup_migrations');
                await (0, runMigrations_1.runMigrations)();
            }
            return;
        }
        catch (e) {
            attempt++;
            if (attempt > retries) {
                logger_1.logger.error('startup_db_failed', { attempts: attempt, error: e?.message });
                throw e;
            }
            logger_1.logger.warn('startup_db_retry', { attempt, remaining: retries - attempt, backoffMs });
            await new Promise(r => setTimeout(r, backoffMs));
        }
    }
}
async function start() {
    logger_1.logger.info('startup_begin', { env: config_1.config.nodeEnv, port: config_1.config.port, build: config_1.config.buildId, dbRetries: config_1.config.dbConnect.retries });
    await ensureDbReady();
    const app = createApp();
    const server = app.listen(config_1.config.port, () => logger_1.logger.info('startup_listening', { url: `http://localhost:${config_1.config.port}` }));
    const shutdown = (signal) => {
        logger_1.logger.warn('shutdown_initiated', { signal });
        const timer = setTimeout(() => { logger_1.logger.error('shutdown_force_exit', { activeRequests }); process.exit(1); }, config_1.config.shutdownTimeoutMs);
        server.close(() => {
            const check = () => {
                if (activeRequests > 0) {
                    logger_1.logger.warn('shutdown_waiting', { activeRequests });
                    setTimeout(check, 250);
                    return;
                }
                db_1.pool.end().finally(() => { clearTimeout(timer); logger_1.logger.info('shutdown_complete'); process.exit(0); });
            };
            check();
        });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (r) => logger_1.logger.error('unhandled_rejection', { reason: String(r) }));
    process.on('uncaughtException', (e) => { logger_1.logger.error('uncaught_exception', { message: e.message, stack: e.stack }); shutdown('uncaughtException'); });
}
if (require.main === module)
    start();
