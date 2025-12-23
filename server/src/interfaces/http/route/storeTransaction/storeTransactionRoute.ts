import { Router } from 'express';
import { StoreTransactionController } from '../../controller/storeTransaction/StoreTransactionController';
import { authenticate } from '../../middleware/authMiddleware';

export function createStoreTransactionRouter(
    controller: StoreTransactionController,
    jwtSecret: string
): Router {
    const router = Router();
    const auth = authenticate(jwtSecret);

    /**
     * @openapi
     * /api/store-transaction/by-customer/{customerId}:
     *   get:
     *     tags:
     *       - Store Transactions
     *     summary: List transactions by customer
     *     description: Retrieve all store transactions for a specific customer
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: customerId
     *         required: true
     *         schema:
     *           type: string
     *         description: Customer ID
     *     responses:
     *       200:
     *         description: List of customer transactions
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 description: Store transaction details
     *       401:
     *         description: Unauthorized
     */
    router.get('/by-customer/:customerId', auth, controller.listByCustomer);

    /**
     * @openapi
     * /api/store-transaction/by-date:
     *   get:
     *     tags:
     *       - Store Transactions
     *     summary: List transactions by date range
     *     description: Retrieve store transactions within a date range (for daily reports)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: from
     *         required: true
     *         schema:
     *           type: string
     *           format: date
     *         description: Start date (YYYY-MM-DD)
     *       - in: query
     *         name: to
     *         required: true
     *         schema:
     *           type: string
     *           format: date
     *         description: End date (YYYY-MM-DD)
     *     responses:
     *       200:
     *         description: List of transactions in date range
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 description: Store transaction details
     *       400:
     *         description: Invalid date parameters
     *       401:
     *         description: Unauthorized
     */
    router.get('/by-date', auth, controller.listByDateRange);

    /**
     * @openapi
     * /api/store-transaction:
     *   post:
     *     tags:
     *       - Store Transactions
     *     summary: Create a new store transaction (Sale)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateStoreTransactionDto'
     *     responses:
     *       201:
     *         description: Transaction created
     *       401:
     *         description: Unauthorized
     */
    router.post('/', auth, controller.create);

    return router;
}
