import express from 'express';
import { validateJwt } from '../middleware/auth';
import { logger } from '../../log/logger';

const router = express.Router();

// ✅ Add request logging to debug the issue
router.use((req, res, next) => {
  console.log(`[CategoryRoutes] ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Lazy load container to avoid circular dependencies
const getContainer = () => {
  try {
    const { categoryController, categoryCache } = require('../../../container');
    if (!categoryController || !categoryCache) {
      throw new Error('Controllers not initialized');
    }
    return { categoryController, categoryCache };
  } catch (error) {
    logger.error('Failed to get container', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

// ✅ Add both routes to handle different client expectations
router.get('/', validateJwt, async (req, res, next) => {
  try {
    console.log('[CategoryRoutes] GET / - Getting categories tree');
    const { categoryController } = getContainer();
    
    if (!categoryController.tree || typeof categoryController.tree !== 'function') {
      throw new Error('categoryController.tree is not a function');
    }
    
    return categoryController.tree(req, res, next);
  } catch (error) {
    console.error('[CategoryRoutes] Error getting categories:', error);
    logger.error('category_tree_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ 
      error: 'Failed to load categories',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ✅ Add explicit /tree route to match client expectations
router.get('/tree', validateJwt, async (req, res, next) => {
  try {
    console.log('[CategoryRoutes] GET /tree - Getting categories tree');
    const { categoryController } = getContainer();
    
    if (!categoryController.tree || typeof categoryController.tree !== 'function') {
      throw new Error('categoryController.tree is not a function');
    }
    
    return categoryController.tree(req, res, next);
  } catch (error) {
    console.error('[CategoryRoutes] Error getting categories tree:', error);
    logger.error('category_tree_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ 
      error: 'Failed to load categories',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cache management endpoints (admin only)
router.post('/cache/refresh', validateJwt, async (req, res) => {
    try {
        const { categoryCache } = getContainer();
        await categoryCache.refreshCache();
        res.json({ success: true, message: 'Cache refreshed successfully' });
    } catch (error) {
        logger.error('category_cache_refresh_failed', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Cache refresh failed' });
    }
});

router.delete('/cache', validateJwt, async (req, res) => {
    try {
        const { categoryCache } = getContainer();
        categoryCache.clearCache();
        res.json({ success: true, message: 'Cache cleared successfully' });
    } catch (error) {
        logger.error('category_cache_clear_failed', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Cache clear failed' });
    }
});

router.get('/cache/stats', validateJwt, async (req, res) => {
    try {
        const { categoryCache } = getContainer();
        const stats = categoryCache.getCacheStats();
        res.json(stats);
    } catch (error) {
        logger.error('category_cache_stats_failed', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Failed to get cache stats' });
    }
});

export default router;
