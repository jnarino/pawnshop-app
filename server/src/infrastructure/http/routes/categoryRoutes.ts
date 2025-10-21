import { Router } from 'express';
import { CategoryRepository } from '../../persistence/CategoryRepository';
import { CategoryCacheService } from '../../cache/CategoryCacheService';
import { ListCategoriesTreeUseCase } from '../../../application/useCase/category/ListCategoriesTreeUseCase';
import { CreateCategoryUseCase } from '../../../application/useCase/category/CreateCategoryUseCase';
import { pool } from '../../db';


const router = Router();
const categoryRepo = new CategoryRepository(pool);
const categoryCache = new CategoryCacheService(categoryRepo);

// Initialize cache on server startup with better error handling
categoryCache.refreshCache().catch(err => {
    console.error('[CategoryCache] Failed to initialize cache:', err.message);
    console.error('[CategoryCache] Cache will be loaded on first request');
});

// GET /api/categories/tree - Get hierarchical categories (cached)
router.get('/tree', async (req, res, next) => {
    try {
        const useCase = new ListCategoriesTreeUseCase(categoryCache);
        const tree = await useCase.execute();
        res.json(tree);
    } catch (err) {
        next(err);
    }
});

// POST /api/categories - Create new category (invalidates cache)
router.post('/', async (req, res, next) => {
    try {
        const { name, code, parentId } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'name and code are required' });
        }

        const useCase = new CreateCategoryUseCase(categoryRepo, categoryCache);
        const result = await useCase.execute({ name, code, parentId });

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

// GET /api/categories/cache/stats - Get cache statistics (for debugging)
router.get('/cache/stats', async (req, res, next) => {
    try {
        const stats = await categoryCache.getStats();
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

// POST /api/categories/cache/refresh - Manually refresh cache (for admin)
router.post('/cache/refresh', async (req, res, next) => {
    try {
        await categoryCache.refreshCache();
        const stats = await categoryCache.getStats();
        res.json({ message: 'Cache refreshed successfully', stats });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/categories/cache - Clear cache (for admin)
router.delete('/cache', async (req, res, next) => {
    try {
        await categoryCache.invalidate();
        res.json({ message: 'Cache cleared successfully' });
    } catch (err) {
        next(err);
    }
});

// Export categoryCache for graceful shutdown
export { categoryCache };
export default router;
