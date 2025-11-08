import type { Request, Response } from 'express';
import { ListCategoriesTreeUseCase } from '../../application/useCase/category/ListCategoriesTreeUseCase';

export interface CategoryController {
  getTree(req: Request, res: Response): Promise<void>;
}

export function makeCategoryController(deps: { tree: ListCategoriesTreeUseCase }): CategoryController {
  return {
    async getTree(_req, res) {
      try {
        const data = await deps.tree.execute();
        res.json(data);
      } catch (e) {
        res.status(500).json({ error: 'failed_to_load_categories' });
      }
    }
  };
}