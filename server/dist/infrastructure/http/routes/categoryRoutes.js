"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryCache = void 0;
const express_1 = require("express");
const CategoryRepository_1 = require("../../persistence/CategoryRepository");
const CategoryCacheService_1 = require("../../cache/CategoryCacheService");
const ListCategoriesTreeUseCase_1 = require("../../../application/useCase/category/ListCategoriesTreeUseCase");
const CreateCategoryUseCase_1 = require("../../../application/useCase/category/CreateCategoryUseCase");
const db_1 = require("../../db");
const router = (0, express_1.Router)();
const categoryRepo = new CategoryRepository_1.CategoryRepository(db_1.pool);
const categoryCache = new CategoryCacheService_1.CategoryCacheService(categoryRepo);
exports.categoryCache = categoryCache;
// Initialize cache on server startup with better error handling
categoryCache.refreshCache().catch(err => {
    console.error('[CategoryCache] Failed to initialize cache:', err.message);
    console.error('[CategoryCache] Cache will be loaded on first request');
});
// GET /api/categories/tree - Get hierarchical categories (cached)
router.get('/tree', async (req, res, next) => {
    try {
        const useCase = new ListCategoriesTreeUseCase_1.ListCategoriesTreeUseCase(categoryCache);
        const tree = await useCase.execute();
        res.json(tree);
    }
    catch (err) {
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
        const useCase = new CreateCategoryUseCase_1.CreateCategoryUseCase(categoryRepo, categoryCache);
        const result = await useCase.execute({ name, code, parentId });
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/categories/cache/stats - Get cache statistics (for debugging)
router.get('/cache/stats', async (req, res, next) => {
    try {
        const stats = await categoryCache.getStats();
        res.json(stats);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/categories/cache/refresh - Manually refresh cache (for admin)
router.post('/cache/refresh', async (req, res, next) => {
    try {
        await categoryCache.refreshCache();
        const stats = await categoryCache.getStats();
        res.json({ message: 'Cache refreshed successfully', stats });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/categories/cache - Clear cache (for admin)
router.delete('/cache', async (req, res, next) => {
    try {
        await categoryCache.invalidate();
        res.json({ message: 'Cache cleared successfully' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
