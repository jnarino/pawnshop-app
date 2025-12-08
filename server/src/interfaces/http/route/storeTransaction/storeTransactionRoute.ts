import { Router } from 'express';
import { StoreTransactionController } from '../../controller/storeTransaction/StoreTransactionController';
import { authenticate } from '../../middleware/authMiddleware';

export function createStoreTransactionRouter(
    controller: StoreTransactionController,
    jwtSecret: string
): Router {
    const router = Router();
    const auth = authenticate(jwtSecret);

    // List by customer (for customer profile)
    // GET /api/store-transaction/by-customer/:customerId
    router.get('/by-customer/:customerId', auth, controller.listByCustomer);

    // List by date range (for daily reports, etc.)
    // GET /api/store-transaction/by-date?from=...&to=...
    router.get('/by-date', auth, controller.listByDateRange);

    return router;
}
