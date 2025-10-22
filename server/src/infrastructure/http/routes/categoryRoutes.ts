import { Router } from 'express';
import { CategoryRepository } from '../../persistence/CategoryRepository';
import { CategoryCacheService } from '../../cache/CategoryCacheService';
import { ListCategoriesTreeUseCase } from '../../../application/useCase/category/ListCategoriesTreeUseCase';
import { CreateCategoryUseCase } from '../../../application/useCase/category/CreateCategoryUseCase';
import { pool } from '../../persistence/db';

console.log('[CategoryRoutes] Module loading...');

const router = Router();
const categoryRepo = new CategoryRepository(pool);
export const categoryCache = new CategoryCacheService(categoryRepo);

// GET /tree
router.get('/tree', async (req, res, next) => {
  console.log('[CategoryRoutes] GET /tree endpoint hit');
  try {
    const useCase = new ListCategoriesTreeUseCase(categoryCache);
    const tree = await useCase.execute();
    console.log(`[CategoryRoutes] Returning ${tree.length} root categories`);
    res.json(tree);
  } catch (err) {
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
    const useCase = new CreateCategoryUseCase(categoryRepo, categoryCache);
    const result = await useCase.execute({ name, code, parentId });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /cache/stats
router.get('/cache/stats', async (req, res, next) => {
  try {
    const stats = await categoryCache.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

console.log('[CategoryRoutes] Routes configured');

export default router;
