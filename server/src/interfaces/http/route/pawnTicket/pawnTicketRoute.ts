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

    // Create pawn ticket + items atomically
    router.post('/', auth, controller.create);

    // Lookup by control number
    router.get('/control/:controlNumber', auth, controller.listByControlNumber);

    // List all tickets by customer
    router.get('/customer/:customerId', auth, controller.listByCustomer);

    // List ACTIVE tickets by customer
    router.get('/customer/:customerId/active', auth, controller.listActiveByCustomer);

    return router;
}
