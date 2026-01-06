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
     * /api/store-transaction/remove-cash-from-main-drawer:
     *   post:
     *     tags:
     *       - Store Transactions
     *     summary: Remove cash from main drawer
     *     description: Records a cash-out movement from the store drawer to the main drawer using store_transaction_type 25 and CASH tender.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               amount:
     *                 type: number
     *                 description: Positive amount to remove from the main drawer
     *               note:
     *                 type: string
     *                 description: Optional note for the cash-out
     *               occurredAt:
     *                 type: string
     *                 format: date-time
     *                 description: Optional timestamp; defaults to current time
     *             required:
     *               - amount
     *     responses:
     *       201:
     *         description: Cash removal recorded
     *       400:
     *         description: Invalid input
     *       401:
     *         description: Unauthorized
     */
    router.post('/remove-cash-from-main-drawer', auth, controller.removeCashFromMainDrawer);

    /**
     * @openapi
     * /api/store-transaction/add-money-to-main-drawer:
     *   post:
     *     tags:
     *       - Store Transactions
     *     summary: Add money to main drawer
     *     description: Records adding money to the main drawer, either from bank (type 26) or other sources (type 24). If from bank, only CASH tender is allowed.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               amount:
     *                 type: number
     *                 description: Positive amount to add to the main drawer
     *               transactionTenderName:
     *                 type: string
     *                 description: Tender type name (e.g., CASH, CHECK)
     *               isFromBank:
     *                 type: boolean
     *                 description: Whether the money is from bank (if true, only CASH allowed)
     *               note:
     *                 type: string
     *                 description: Optional note
     *               occurredAt:
     *                 type: string
     *                 format: date-time
     *                 description: Optional timestamp; defaults to current time
     *             required:
     *               - amount
     *               - transactionTenderName
     *               - isFromBank
     *     responses:
     *       201:
     *         description: Money added successfully
     *       400:
     *         description: Invalid input or non-CASH tender for bank withdrawal
     *       401:
     *         description: Unauthorized
     */
    router.post('/add-money-to-main-drawer', auth, controller.addMoneyToMainDrawer);

    /**
     * @openapi
     * /api/store-transaction/balance:
     *   get:
     *     tags:
     *       - Store Transactions
     *     summary: Get cash drawer balance
     *     description: Returns current cash drawer balance with last close information and tender type breakdown
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Cash drawer balance summary
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 lastCloseOccurredAt:
     *                   type: string
     *                   format: date-time
     *                   description: Timestamp of last drawer close
     *                 lastCloseBalance:
     *                   type: number
     *                   description: Balance at last close
     *                 currentBalance:
     *                   type: number
     *                   description: Current accumulated balance
     *                 tenderBreakdown:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       tenderTypeId:
     *                         type: number
     *                       tenderTypeName:
     *                         type: string
     *                       totalSinceLastClose:
     *                         type: number
     *                 asOf:
     *                   type: string
     *                   format: date-time
     *       401:
     *         description: Unauthorized
     */
    router.get('/balance', auth, controller.listBalanceCashDrawer);

    /**
     * @openapi
     * /api/store-transaction/close-balance:
     *   put:
     *     tags:
     *       - Store Transactions
     *     summary: Close cash drawer balance
     *     description: |
     *       Records the closing balance for the cash drawer.
     *       Creates DEPOSIT FROM MAIN transactions (type 22) for each tender deposited,
     *       and a MAIN BALANCE transaction (type 23) with the final cash balance.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - mainDrawerBalance
     *             properties:
     *               mainDrawerBalance:
     *                 type: object
     *                 description: Amount for each tender type in the main drawer
     *                 properties:
     *                   CASH:
     *                     type: number
     *                     example: 15508.35
     *                   AMERICAN EXPRESS:
     *                     type: number
     *                     example: 0
     *                   DEBIT:
     *                     type: number
     *                     example: 0
     *                   DISCOVER:
     *                     type: number
     *                     example: 0
     *                   MASTER CARD:
     *                     type: number
     *                     example: 0
     *                   VISA:
     *                     type: number
     *                     example: 0
     *                   CHECK:
     *                     type: number
     *                     example: 0
     *                   CASH PASS:
     *                     type: number
     *                     example: 0
     *               occurredAt:
     *                 type: string
     *                 format: date-time
     *                 description: When the close occurred (defaults to now)
     *               note:
     *                 type: string
     *                 description: Optional note for the close
     *     responses:
     *       201:
     *         description: Balance closed successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 description: Created store transactions
     *       400:
     *         description: Invalid input
     *       401:
     *         description: Unauthorized
     */
    router.put('/close-balance', auth, controller.closeBalanceCashDrawer);

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
