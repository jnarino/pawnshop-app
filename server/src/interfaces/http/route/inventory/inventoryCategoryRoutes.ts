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

    // List full tree
    router.get('/tree', auth, controller.getTree);

    // Create (admin/manager only)
    router.post('/', auth, requireRole(['admin', 'manager']), controller.create);

    return router;
}
