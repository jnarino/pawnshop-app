import express from 'express';
import { validateJwt } from '../middleware/auth';
import { paymentController } from '../../../container';

const router = express.Router();

// Create payment for pawn tickets
router.post('/pawn-ticket', validateJwt, async (req, res) => {
  await paymentController.createPawnTicketPayment(req, res);
});

export default router;
