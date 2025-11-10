import express from 'express';
import { validateJwt } from '../middleware/auth';
import { pawnTicketController } from '../../../container';

const router = express.Router();

// Existing routes
router.get('/', validateJwt, pawnTicketController.findAll);
router.post('/', validateJwt, pawnTicketController.create);
router.get('/search', validateJwt, pawnTicketController.search);
router.get('/:id', validateJwt, pawnTicketController.get);
router.put('/:id/dates', validateJwt, pawnTicketController.updateDates);
router.delete('/:id', validateJwt, pawnTicketController.delete);

// ✅ Add the payments route
router.get('/:controlNumber/payments', validateJwt, pawnTicketController.findByControlNumberWithPayments);

export default router;
