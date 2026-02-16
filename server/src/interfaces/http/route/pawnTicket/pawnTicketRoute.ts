import { Router } from 'express';
import { PawnTicketController } from '../../controller/pawnTicket/PawnTicketController';
import { authenticate } from '../../middleware/authMiddleware';
// import { requireRole } from '../../middleware/roleMiddleware'; // for future admin actions

export function createPawnTicketRouter(
    controller: PawnTicketController,
    jwtSecret: string
): Router {
    const router = Router();
    const auth = authenticate(jwtSecret);

    /**
     * @openapi
     * /api/pawn-ticket:
     *   post:
     *     tags:
     *       - Pawn Tickets
     *     summary: Create pawn ticket with items
     *     description: Create a new pawn ticket along with associated inventory items atomically
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/PawnTicket'
     *     responses:
     *       201:
     *         description: Pawn ticket created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PawnTicket'
     *       400:
     *         description: Invalid input
     *       401:
     *         description: Unauthorized
     */
    router.post('/', auth, controller.create);

    /**
     * @openapi
     * /api/pawn-ticket/control/{controlNumber}:
     *   get:
     *     tags:
     *       - Pawn Tickets
     *     summary: List tickets by control number
     *     description: Retrieve pawn tickets by control number
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: controlNumber
     *         required: true
     *         schema:
     *           type: string
     *         description: Control number
     *     responses:
     *       200:
     *         description: List of pawn tickets
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/PawnTicket'
     *       401:
     *         description: Unauthorized
     */
    router.get('/control/:controlNumber', auth, controller.listByControlNumber);

    /**
     * @openapi
     * /api/pawn-ticket/customer/{customerId}:
     *   get:
     *     tags:
     *       - Pawn Tickets
     *     summary: List all tickets by customer
     *     description: Retrieve all pawn tickets for a specific customer
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
     *         description: List of customer pawn tickets
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/PawnTicket'
     *       401:
     *         description: Unauthorized
     */
    router.get('/customer/:customerId', auth, controller.listByCustomer);

    /**
     * @openapi
     * /api/pawn-ticket/customer/{customerId}/active:
     *   get:
     *     tags:
     *       - Pawn Tickets
     *     summary: List active tickets by customer
     *     description: Retrieve only active pawn tickets for a specific customer
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
     *         description: List of active customer pawn tickets
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/PawnTicket'
     *       401:
     *         description: Unauthorized
     */
    router.get('/customer/:customerId/active', auth, controller.listActiveByCustomer);

    /**
     * @openapi
     * /api/pawn-ticket/customer/{customerId}/previous-items:
     *   get:
     *     tags:
     *       - Pawn Tickets
     *     summary: List distinct previous items for a customer
     *     description: Retrieve distinct inventory items from customer's previous pawn tickets, filtered by status in (U, T, V)
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
     *         description: List of distinct previous inventory items
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/InventoryItem'
     *       400:
     *         description: Invalid customer ID format
     *       401:
     *         description: Unauthorized
     */
    router.get('/customer/:customerId/previous-items', auth, controller.listPreviousItemsByCustomer);

    /**
     * @openapi
     * /api/pawn-ticket/customer/{customerId}/history:
     *   get:
     *     tags:
     *       - Pawn Tickets
     *     summary: List pawn history for a customer
     *     description: Retrieve simplified pawn history for a customer with ticket dates, amounts, and item descriptions
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: customerId
     *         required: true
     *         schema:
     *           type: string
     *         description: Customer ID (UUID)
     *     responses:
     *       200:
     *         description: Pawn history with essential information
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: string
     *                   controlNumber:
     *                     type: string
     *                   pawnDate:
     *                     type: string
     *                     format: date-time
     *                   maturityDate:
     *                     type: string
     *                     format: date-time
     *                   pawnAmount:
     *                     type: number
     *                   totalItems:
     *                     type: integer
     *                   itemDescriptions:
     *                     type: string
     *       400:
     *         description: Invalid customer ID format
     *       401:
     *         description: Unauthorized
     */
    router.get('/customer/:customerId/history', auth, controller.listHistoryByCustomer);

    /**
     * @openapi
     * /api/pawn-ticket/{pawnTicketId}/payments:
     *   get:
     *     tags:
     *       - Pawn Tickets
     *     summary: Get all payments for a pawn ticket
     *     description: Retrieve all payment records for a specific pawn ticket
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: pawnTicketId
     *         required: true
     *         schema:
     *           type: string
     *         description: Pawn ticket ID
     *     responses:
     *       200:
     *         description: List of payments for the pawn ticket
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   pawnTicketId:
     *                     type: string
     *                   paymentDate:
     *                     type: string
     *                     format: date-time
     *                   principalPaid:
     *                     type: number
     *                   clerkUserId:
     *                     type: string
     *                     nullable: true
     *       401:
     *         description: Unauthorized
     */
    router.get('/:pawnTicketId/payments', auth, controller.getPayments);

    /**
     * @openapi
     * /api/pawn-ticket/date-range:
     *   get:
     *     tags:
     *       - Pawn Tickets
     *     summary: List tickets by date range
     *     description: Retrieve pawn tickets within a specific date range
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
     *         description: List of pawn tickets
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/PawnTicket'
     *       401:
     *         description: Unauthorized
     *       400:
     *         description: Invalid input
     */
    router.get('/date-range', auth, controller.listByDateRange);

    /**
     * @openapi
     * /api/pawn-ticket/pull-to-inventory:
     *   post:
     *     tags:
     *       - Pawn Tickets
     *     summary: Mark ticket and update items when pulled into inventory
     *     description: Updates the pawn ticket status based on typeTicket (PAWN→D, PURCHASE→I) and item statuses based on scrappedIntoInvItem array presence. Supports scrapping items into existing inventory by increasing their quantity.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               pawnTicketId:
     *                 type: string
     *               controlNumber:
     *                 type: string
     *               typeTicket:
     *                 type: string
     *                 enum: [PAWN, PURCHASE]
     *                 description: PAWN sets ticket status to 'D' (Defaulted), PURCHASE sets to 'I' (Inventory)
     *               clerkUserId:
     *                 type: string
     *                 description: ID of the user performing the pull action (auto-injected from JWT)
     *               transactionDate:
     *                 type: string
     *                 format: date-time
     *               items:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                     itemStatus:
     *                       type: string
     *                       enum: [I, J]
     *                       nullable: true
     *                       description: Optional - ignored by backend, item status determined by scrappedIntoInvItem presence
     *                     scrappedIntoInvItem:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           inventoryNumber:
     *                             type: string
     *                           quantity:
     *                             type: integer
     *                       nullable: true
     *                       description: If present and non-empty, item status set to 'J' (Scrap), otherwise 'I' (Inventory)
     *                     resale:
     *                       type: number
     *                       nullable: true
     *                     minResale:
     *                       type: number
     *                       nullable: true
     *     responses:
     *       200:
     *         description: Items pulled to inventory (scrapped items omitted from response)
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: string
     *                   inventoryNumber:
     *                     type: string
     *                     nullable: true
     *       400:
     *         description: Invalid input or pawn ticket status not found
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Pawn ticket, inventory item, or scrap target not found
     */
    router.post('/pull-to-inventory', auth, controller.pullToInventory);

    /**
     * @openapi
     * /api/pawn-ticket/{controlNumber}/current-charges:
     *   get:
     *     tags:
     *       - Pawn Tickets
     *     summary: Get current charges, pawn amount, periods behind, and redemption amount for a pawn ticket
     *     description: Returns the current charges, pawn amount, periods behind, and redemption amount for a given pawn ticket (by control number)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: controlNumber
     *         required: true
     *         schema:
     *           type: string
     *         description: Pawn Ticket Control Number
     *     responses:
     *       200:
     *         description: Current charges info
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PawnTicketCurrentChargesResponseDto'
     *       404:
     *         description: Pawn ticket not found
     *       401:
     *         description: Unauthorized
     */
    router.get('/:controlNumber/current-charges', auth, controller.getCurrentCharges);

    /**
     * @openapi
     * /api/pawn-ticket/void:
     *   post:
     *     tags:
     *       - Pawn Tickets
     *     summary: Void a pawn ticket
     *     description: Void a pawn ticket and revert items.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               controlNumber:
     *                 type: string
     *               customerId:
     *                 type: string
     *               reason:
     *                 type: string
     *     responses:
     *       200:
     *         description: Void successful
     *       400:
     *         description: Invalid input or mismatch
     *       404:
     *         description: Ticket not found
     */
    router.post('/void', auth, controller.voidTicket);

    /**
     * @openapi
     * /api/pawn-ticket/increase:
     *   post:
     *     tags:
     *       - Pawn Tickets
     *     summary: Increase pawn ticket loan amount
     *     description: Increases the amount financed on an existing pawn ticket and updates item prices
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: string
     *               customerId:
     *                 type: string
     *               controlNumber:
     *                 type: string
     *               clerkUserId:
     *                 type: string
     *               amountFinanced:
     *                 type: number
     *               items:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                     priceAmount:
     *                       type: number
     *     responses:
     *       200:
     *         description: Pawn ticket increased successfully
     *       400:
     *         description: Invalid input
     *       401:
     *         description: Unauthorized
     */
    router.post('/increase', auth, controller.increaseTicket);

    /**
     * @openapi
     * /api/pawn-ticket/undo-payment:
     *   post:
     *     tags:
     *       - Pawn Tickets
     *     summary: Undo last payment for a pawn ticket
     *     description: Reverts the last payment by creating a negative store transaction
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UndoPawnTicketPaymentRequest'
     *     responses:
     *       200:
     *         description: Payment undone successfully
     *       400:
     *         description: Invalid input or amount mismatch
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Pawn ticket or payment not found
     */
    router.post('/undo-payment', auth, controller.undoPayment);

    /**
     * @openapi
     * /api/pawn-ticket/items:
     *   put:
     *     tags:
     *       - Pawn Tickets
     *     summary: Update items in a pawn ticket
     *     description: Updates descriptive fields of items belonging to a pawn ticket. request must include pawnTicketId.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - pawnTicketId
     *               - items
     *             properties:
     *               pawnTicketId:
     *                 type: string
     *                 format: uuid
     *               items:
     *                 type: array
     *                 minItems: 1
     *                 items:
     *                   type: object
     *                   required:
     *                     - itemId
     *                   properties:
     *                     itemId:
     *                       type: string
     *                       format: uuid
     *                     inventorySubcategoryId:
     *                       type: string
     *                       format: uuid
     *                     brand:
     *                       type: string
     *                     model:
     *                       type: string
     *                     serialNumber:
     *                       type: string
     *                     colorId:
     *                       type: string
     *                     itemCondition:
     *                       type: string
     *                     ownerMark:
     *                       type: string
     *                     itemDescription:
     *                       type: string
     *                     attributes:
     *                       type: object
     *           example:
     *             pawnTicketId: "a1b2c3d4-e5f6-7890-1234-56789abcdef0"
     *             items:
     *               - itemId: "f1e2d3c4-b5a6-0987-6543-210fedcba987"
     *                 inventorySubcategoryId: "d290f1ee-6c54-4b01-90e6-d701748f0851"
     *                 brand: "Makita"
     *                 model: "XPH07"
     *                 serialNumber: "SN-998877"
     *                 itemDescription: "18V Hammer Drill with generic charger"
     *                 itemCondition: "Used - Good"
     *                 attributes:
     *                   weight: "6.4"
     *                   weightUnit: "GRMS"
     *     responses:
     *       200:
     *         description: Items updated successfully
     *       400:
     *         description: Invalid input
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden (Item does not belong to ticket)
     *       404:
     *         description: Ticket or Item not found
     */
    router.put('/items', auth, controller.updateItems);

    return router;
}
