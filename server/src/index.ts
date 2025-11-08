import express from 'express';
import cors from 'cors';
import { closePool } from './infrastructure/persistence/db';

// Import category routes FIRST before using
import categoryRoutes, { categoryCache } from './infrastructure/http/routes/categoryRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check (this works, so we know Express is running)
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Register category routes - THIS IS THE CRITICAL LINE
console.log('[Server] About to register category routes...');
app.use('/api/categories', categoryRoutes);
console.log('[Server] Category routes registered');

// List all registered routes for debugging
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    console.log('[Server] Route:', middleware.route.path);
  } else if (middleware.name === 'router') {
    console.log('[Server] Router middleware at:', middleware.regexp);
  }
});

// Start server
async function startServer() {
  try {
    console.log('[Server] Warming up category cache...');
    await categoryCache.refreshCache();
    console.log('[Server] Category cache ready');
    
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`[Server] ✓ Running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal: string) => {
      console.log(`\n[Server] ${signal} received`);
      try {
        await categoryCache.disconnect();
        await closePool();
      } catch (err) {
        console.error('[Server] Shutdown error:', err);
      }
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();