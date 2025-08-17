import { Router } from 'express';
import { pawnTicketController } from '../container';
import type { PawnTicketController } from '../controller/pawnTicket/pawnTicketController';

export function buildPawnTicketRoute(controller: PawnTicketController) {
    const router = Router();
    router.get('/', controller.search); // search/list
    router.post('/', controller.create);
    router.get('/:id', controller.get);
    router.put('/:id/dates', controller.updateDates);
    router.delete('/:id', controller.remove);
    return router;
}

export default buildPawnTicketRoute(pawnTicketController);
