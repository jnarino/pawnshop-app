import { Router } from 'express';
import { InventoryCategoryController } from '../../controller/inventory/InventoryCategoryController';
import { authenticate } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';

export function createInventoryCategoryRouter(
    controller: InventoryCategoryController,
    jwtSecret: string
): Router {
    const router = Router();
    const auth = authenticate(jwtSecret);

    //List root categories
    router.get('/root', auth, controller.getRootCategories);

    //List all subcategories by  Category ID    
    router.get('/:id/subcategories', auth, controller.getSubCategories);

    //Get brands by Category ID
    router.get('/:id/brands', auth, controller.getBrandsByCategoryRoot);

    return router;
}
