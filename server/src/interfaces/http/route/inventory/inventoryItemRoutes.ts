import { Router } from 'express';
import { InventoryItemController } from '../../controller/inventory/InventoryItemController';
import { authenticate } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';

export function createInventoryItemRouter(
    controller: InventoryItemController,
    jwtSecret: string
): Router {
    const router = Router();
    const auth = authenticate(jwtSecret);

    // Read operations
    router.get('/by-inventory-number/:inventoryNumber', auth, controller.getByInventoryNumber);
    router.get('/by-serial-number/:serialNumber', auth, controller.getBySerialNumber);
    router.get('/:id', auth, controller.getById);

    // Create / Update / Delete
    router.post('/', auth, controller.create);
    router.put('/:id', auth, controller.update);
    router.delete('/:id', auth, requireRole(['admin', 'manager']), controller.remove);

    return router;
}
