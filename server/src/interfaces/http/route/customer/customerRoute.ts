import { Router } from 'express';
import { CustomerController } from '../../controller/customer/CustomerController';
import { authenticate } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';


export function createCustomerRouter(
    controller: CustomerController,
    jwtSecret: string
): Router {
    const router = Router();
    const auth = authenticate(jwtSecret);

    router.get('/', auth, controller.search);

    // Search (grid)
    router.get('/search', auth, controller.search);

    // Get full details (double-click on grid)
    router.get('/:id', auth, controller.getById);

    // Create / Update / Delete
    router.post('/', auth, controller.create);
    router.put('/:id', auth, controller.update);
    router.delete('/:id', auth, requireRole(['admin', 'manager']), controller.remove);

    return router;
}
