import { Router } from 'express';
import { PawnTicketController } from '../../controller/pawnTicket/PawnTicketController';
import { authenticate } from '../../middleware/authMiddleware';

export function createPawnTicketPaymentRouter(controller: PawnTicketController, jwtSecret: string): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
  * /api/pawn-tickets/payment:
   *   post:
   *     tags:
   *       - PawnTickets
   *     summary: Make a payment or redeem a pawn ticket
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               $ref: '#/components/schemas/PawnTicketPaymentRequestDto'
   *     responses:
   *       200:
   *         description: Payment processed
   *       400:
   *         description: Invalid input
   *       404:
   *         description: Pawn ticket not found
   *       401:
   *         description: Unauthorized
   */
  router.post('/payment', auth, controller.payOnTicket); 

  return router;
}
