"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryCache = void 0;
const express_1 = require("express");
const CategoryRepository_1 = require("../../persistence/CategoryRepository");
const CategoryCacheService_1 = require("../../cache/CategoryCacheService");
const ListCategoriesTreeUseCase_1 = require("../../../application/useCase/category/ListCategoriesTreeUseCase");
const CreateCategoryUseCase_1 = require("../../../application/useCase/category/CreateCategoryUseCase");
const db_1 = require("../../persistence/db");
console.log('[CategoryRoutes] Module loading...');
const router = (0, express_1.Router)();
const categoryRepo = new CategoryRepository_1.CategoryRepository(db_1.pool);
exports.categoryCache = new CategoryCacheService_1.CategoryCacheService(categoryRepo);
// GET /tree
router.get('/tree', async (req, res, next) => {
    console.log('[CategoryRoutes] GET /tree endpoint hit');
    try {
        const useCase = new ListCategoriesTreeUseCase_1.ListCategoriesTreeUseCase(exports.categoryCache);
        const tree = await useCase.execute();
        console.log(`[CategoryRoutes] Returning ${tree.length} root categories`);
        res.json(tree);
    }
    catch (err) {
        console.error('[CategoryRoutes] Error:', err);
        next(err);
    }
});
// POST /
router.post('/', async (req, res, next) => {
    try {
        const { name, code, parentId } = req.body;
        if (!name || !code) {
            return res.status(400).json({ error: 'name and code are required' });
        }
        const useCase = new CreateCategoryUseCase_1.CreateCategoryUseCase(categoryRepo, exports.categoryCache);
        const result = await useCase.execute({ name, code, parentId });
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
});
// GET /cache/stats
router.get('/cache/stats', async (req, res, next) => {
    try {
        const stats = await exports.categoryCache.getStats();
        res.json(stats);
    }
    catch (err) {
        next(err);
    }
});
console.log('[CategoryRoutes] Routes configured');
exports.default = router;
