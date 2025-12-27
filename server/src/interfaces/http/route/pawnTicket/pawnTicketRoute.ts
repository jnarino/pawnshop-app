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

    return router;
}
