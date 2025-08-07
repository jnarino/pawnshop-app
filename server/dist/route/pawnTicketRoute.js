"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pawnTicketController_1 = require("../controller/pawnTicket/pawnTicketController");
const router = (0, express_1.Router)();
// GET /api/pawnTicket/        → list all pawn tickets
router.get('/', pawnTicketController_1.getAllPawnTickets);
// GET /api/pawnTicket/:id     → get one pawn ticket by ID
router.get('/:id', pawnTicketController_1.getPawnTicketById);
// POST /api/pawnTicket/       → create a new pawn ticket
router.post('/', pawnTicketController_1.createPawnTicket);
// PUT /api/pawnTicket/:id     → update an existing pawn ticket
router.put('/:id', pawnTicketController_1.updatePawnTicket);
// DELETE /api/pawnTicket/:id  → delete a pawn ticket
router.delete('/:id', pawnTicketController_1.deletePawnTicket);
exports.default = router;
