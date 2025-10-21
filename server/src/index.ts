import express from 'express';
import cors from 'cors';
import { closePool } from './infrastructure/persistence/db';
import categoryRoutes, { categoryCache } from './infrastructure/http/routes/categoryRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/categories', categoryRoutes);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} signal received: shutting down gracefully`);

  try {
    // Close Redis connection
    await categoryCache.disconnect();
    console.log('Redis connection closed');
  } catch (err) {
    console.error('Error closing Redis connection:', err);
  }

  try {
    // Close database pool
    await closePool();
    console.log('Database pool closed');
  } catch (err) {
    console.error('Error closing database pool:', err);
  }

  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

console.log('[Server] Category cache will be initialized on server startup');