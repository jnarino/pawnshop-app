import { Router } from 'express';
import {
    getAllPawnTickets,
    getPawnTicketById,
    createPawnTicket,
    updatePawnTicket,
    deletePawnTicket,
} from '../controller/pawnTicketController';

const router = Router();

// GET /api/pawnTicket/        → list all pawn tickets
router.get('/', getAllPawnTickets);

// GET /api/pawnTicket/:id     → get one pawn ticket by ID
router.get('/:id', getPawnTicketById);

// POST /api/pawnTicket/       → create a new pawn ticket
router.post('/', createPawnTicket);

// PUT /api/pawnTicket/:id     → update an existing pawn ticket
router.put('/:id', updatePawnTicket);

// DELETE /api/pawnTicket/:id  → delete a pawn ticket
router.delete('/:id', deletePawnTicket);

export default router;
