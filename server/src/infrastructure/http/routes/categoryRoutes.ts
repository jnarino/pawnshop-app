import express from 'express';
import { validateJwt } from '../middleware/auth';
import { logger } from '../../log/logger';

const router = express.Router();

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

// Get categories tree from cache
router.get('/', validateJwt, async (req, res, next) => {
  try {
    const { categoryController } = getContainer();
    if (!categoryController.tree || typeof categoryController.tree !== 'function') {
      throw new Error('categoryController.tree is not a function');
    }
    return categoryController.tree(req, res, next);
  } catch (error) {
    logger.error('category_tree_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to load categories' });
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
