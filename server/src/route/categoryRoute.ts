import { Router } from 'express';
import { categoryController } from '../container';
import type { CategoryController } from '../controller/category/categoryControllerFactory';

export function buildCategoryRoute(controller: CategoryController) {
  const router = Router();
  router.get('/tree', controller.getTree.bind(controller));
  return router;
}

export default buildCategoryRoute(categoryController);