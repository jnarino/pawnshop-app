import { Router } from 'express';
import { LayawayController } from '../../controller/layaway/LayawayController';
import { authenticate } from '../../middleware/authMiddleware';

export function createLayawayRouter(
  controller: LayawayController,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/layaway/defaulted:
   *   get:
   *     tags:
   *       - Layaways
   *     summary: Get defaulted layaways
   *     description: Retrieve defaulted or future defaulted layaways. If ticketNumber is provided, it searches by ticket. If dates are provided, it searches by default_date range. Otherwise, returns currently defaulted items.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: ticketNumber
   *         schema:
   *           type: string
   *         description: Filter by specific layaway ticket number (takes precedence over dates)
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by default Date range start (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by default Date range end (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: List of defaulted layaways
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/LayawayResponse'
   *       401:
   *         description: Unauthorized
   */
  router.get('/defaulted', auth, controller.getDefaulted);

  /**
   * @openapi
   * /api/layaway:
   *   get:
   *     tags:
   *       - Layaways
   *     summary: List layaways
   *     description: List layaways filtering by status or date range
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by status
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by start date (ISO date)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by end date (ISO date)
   *     responses:
   *       200:
   *         description: List of layaways
   */
  router.get('/', auth, controller.findByCriteria);

  /**
   * @openapi
   * /api/layaway/customer/{customerId}:
   *   get:
   *     tags:
   *       - Layaways
   *     summary: List layaways by customer
   *     description: List layaways for a specific customer, optionally filtering by status
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Customer ID
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by status
   *     responses:
   *       200:
   *         description: List of customer's layaways
   */
  router.get('/customer/:customerId', auth, controller.findByCustomer);

  /**
   * @openapi
   * /api/layaway:
   *   post:
   *     tags:
   *       - Layaways
   *     summary: Create new layaway
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateLayawayRequest'
   *     responses:
   *       201:
   *         description: Layaway created successfully
   */
  router.post('/', auth, controller.create);

  /**
   * @openapi
   * /api/layaway/payment:
   *   post:
   *     tags:
   *       - Layaways
   *     summary: Make layaway payment
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - ticketnum
   *               - amount
   *               - tenderTypeId
   *               - customerId
   *             properties:
   *               customerId:
   *                 type: string
   *                 format: uuid
   *               ticketnum:
   *                 type: string
   *               amount:
   *                 type: number
   *               tenderTypeId:
   *                 type: integer
   *               note:
   *                 type: string
   *     responses:
   *       200:
   *         description: Payment processed
   */
  router.post('/payment', auth, controller.makePayment);

  /**
   * @openapi
   * /api/layaway/void:
   *   post:
   *     tags:
   *       - Layaways
   *     summary: Void a layaway agreement request
   *     description: Voids the layaway, returns items to inventory, and creates a negative transaction (refund).
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               ticketnum:
   *                 type: string
   *                 description: The ticket number of the layaway to void
   *               amountToReturn:
   *                 type: number
   *                 description: The amount to be returned to the customer
   *               tenderTypeId:
   *                 type: integer
   *                 description: The ID of the tender type used for the refund
   *               note:
   *                 type: string
   *                 description: Reason for voiding
   *     responses:
   *       200:
   *         description: Layaway voided successfully
   *       400:
   *         description: Invalid input or business rule violation
   *       404:
   *         description: Layaway not found
   */
  router.post('/void', auth, controller.voidLayaway);

  /**
   * @openapi
   * /api/layaway/pull:
   *   post:
   *     tags:
   *       - Layaways
   *     summary: Pull layaway (mark as defaulted)
   *     description: Moves layaway items back to inventory (Active) and sets layaway status to Defaulted.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               ticketnum:
   *                 type: string
   *                 description: The ticket number of the layaway to pull
   *               customerId:
   *                 type: string
   *                 format: uuid
   *                 description: Customer ID verification
   *     responses:
   *       200:
   *         description: Layaway pulled successfully
   *       400:
   *         description: Invalid input or business rule violation
   *       404:
   *         description: Layaway not found
   */
  router.post('/pull', auth, controller.pullLayaway);

  /**
   * @openapi
   * /api/layaway/unpull:
   *   post:
   *     tags:
   *       - Layaways
   *     summary: Unpull layaway (revert default)
   *     description: Reverts a defaulted layaway to Active, removing items from inventory availability.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               ticketnum:
   *                 type: string
   *                 description: The ticket number of the layaway to unpull
   *               customerId:
   *                 type: string
   *                 format: uuid
   *                 description: Customer ID verification
   *     responses:
   *       200:
   *         description: Layaway unpulled successfully
   *       400:
   *         description: Invalid input or business rule violation (e.g., items sold)
   *       404:
   *         description: Layaway not found
   */
  router.post('/unpull', auth, controller.unpullLayaway);

  /**
   * @openapi
   * /api/layaway/payment/void:
   *   post:
   *     tags:
   *       - Layaways
   *     summary: Void layaway payment
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - ticketnum
   *               - amount
   *               - customerId
   *             properties:
   *               customerId:
   *                 type: string
   *                 format: uuid
   *               ticketnum:
   *                 type: string
   *               amount:
   *                 type: number
   *               note:
   *                 type: string
   *     responses:
   *       200:
   *         description: Payment voided
   */
  router.post('/payment/void', auth, controller.voidPayment);

  /**
   * @openapi
   * /api/layaway/{ticketnum}:
   *   get:
   *     tags:
   *       - Layaways
   *     summary: Get layaway ticket details
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: ticketnum
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Layaway details
   *       404:
   *         description: Ticket not found
   */
  router.get('/:ticketnum', auth, controller.findByTicketNum);

  /**
   * @openapi
   * /api/layaway/history/{customerId}/{ticketnum}:
   *   get:
   *     tags:
   *       - Layaways
   *     summary: Get transaction history for a layaway
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: ticketnum
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Layaway history
   */
  router.get('/history/:customerId/:ticketnum', auth, controller.getHistory);

  return router;
}
