"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPawnTickets = getAllPawnTickets;
exports.getPawnTicketById = getPawnTicketById;
exports.createPawnTicket = createPawnTicket;
exports.updatePawnTicket = updatePawnTicket;
exports.deletePawnTicket = deletePawnTicket;
// GET /api/pawnTicket/
async function getAllPawnTickets(req, res, next) {
    try {
        // const tickets = await pawnService.listPawnTickets();
        //  res.json(tickets);
    }
    catch (err) {
        next(err);
    }
}
// GET /api/pawnTicket/:id
async function getPawnTicketById(req, res, next) {
    try {
        const id = req.params.id;
        //  const ticket = await pawnService.getPawnTicketById(id);
        //  res.json(ticket);
    }
    catch (err) {
        next(err);
    }
}
// POST /api/pawnTicket/
async function createPawnTicket(req, res, next) {
    try {
        const dto = req.body;
        // const newId = await pawnCommands.createPawnTicket(dto);
        //  res.status(201).json({ id: newId });
    }
    catch (err) {
        next(err);
    }
}
// PUT /api/pawnTicket/:id
async function updatePawnTicket(req, res, next) {
    try {
        const id = req.params.id;
        const updates = req.body;
        //  await pawnCommands.updatePawnTicket(id, updates);
        res.sendStatus(204);
    }
    catch (err) {
        next(err);
    }
}
// DELETE /api/pawnTicket/:id
async function deletePawnTicket(req, res, next) {
    try {
        const id = req.params.id;
        //  await pawnCommands.deletePawnTicket(id);
        res.sendStatus(204);
    }
    catch (err) {
        next(err);
    }
}
