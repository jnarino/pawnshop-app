// Lean offline server for PawnExpress (enhanced)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { logger } from './infrastructure/log/logger';
import { pool } from './infrastructure/db';

const app = express();

// ✅ Enhanced CORS configuration for development
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Potential local dev
    'http://127.0.0.1:5173', // Alternative localhost
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Authorization']
}));

// ✅ Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Improved route initialization with better error handling
async function initializeRoutes() {
  try {
    console.log('[Server] Loading container...');

    // Initialize container first
    const { container, categoryCache } = await import('./container');

    console.log('[Server] Container loaded, initializing cache...');

    // Initialize category cache
    await categoryCache.refreshCache().catch(err => {
      logger.error('[Server] Failed to initialize category cache:', err);
    });

    console.log('[Server] Cache initialized, loading routes...');

    // ✅ Import routes one by one with error handling
    const routeImports = [
      { name: 'auth', path: './infrastructure/http/routes/authRoutes' },
      { name: 'customer', path: './infrastructure/http/routes/customerRoutes' },
      { name: 'pawnTicket', path: './infrastructure/http/routes/pawnTicketRoutes' },
      { name: 'category', path: './infrastructure/http/routes/categoryRoutes' },
      { name: 'payment', path: './infrastructure/http/routes/paymentRoutes' },
      { name: 'inventory', path: './infrastructure/http/routes/inventoryRoutes' },
      { name: 'inventoryStatus', path: './infrastructure/http/routes/inventoryStatusRoutes' }
    ];

    const routes: Record<string, any> = {};

    for (const route of routeImports) {
      try {
        console.log(`[Server] Loading ${route.name} routes...`);
        const module = await import(route.path);
        routes[route.name] = module.default;

        if (!routes[route.name]) {
          throw new Error(`${route.name} routes module has no default export`);
        }

        console.log(`[Server] ✓ ${route.name} routes loaded`);
      } catch (error) {
        logger.error(`[Server] Failed to load ${route.name} routes:`, { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    }

    console.log('[Server] All routes loaded, registering...');

    // Register routes
    app.use('/api/auth', routes.auth);
    app.use('/api/customer', routes.customer);
    app.use('/api/inventory', routes.inventory);
    app.use('/api/inventory-status', routes.inventoryStatus);
    app.use('/api/pawnTicket', routes.pawnTicket);
    app.use('/api/category', routes.category);
    app.use('/api/payment', routes.payment);

    logger.info('[Server] All routes registered successfully');
    return container;
  } catch (error) {
    logger.error('[Server] Failed to initialize routes:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Health check (available before route initialization)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ✅ Add a simple test endpoint to verify server is responding
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('unhandled_route_error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: 'internal_server_error',
    message: 'Something went wrong'
  });
});

// ✅ Initialize routes and setup graceful shutdown
let appContainer: any = null;

initializeRoutes().then((container) => {
  appContainer = container;

  // Setup graceful shutdown after container is ready
  async function gracefulShutdown(signal: string) {
    logger.info('shutdown_signal_received', { signal });

    try {
      if (appContainer) {
        await appContainer.shutdown();
      }
      await pool.end();

      logger.info('graceful_shutdown_complete');
      process.exit(0);
    } catch (error) {
      logger.error('graceful_shutdown_error', { error: error instanceof Error ? error.message : String(error) });
      process.exit(1);
    }
  }

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    logger.error('uncaught_exception', { error: error.message });
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled_rejection', { reason: String(reason) });
    gracefulShutdown('UNHANDLED_REJECTION');
  });

}).catch((error) => {
  logger.error('[Server] Failed to start:', error);
  process.exit(1);
});

export { app };

