import { Request, Response, NextFunction } from 'express';
import * as pawnService from '../application/query';
import * as pawnCommands from '../application/command';

// GET /api/pawnTicket/
export async function getAllPawnTickets(req: Request, res: Response, next: NextFunction) {
    try {
        const tickets = await pawnService.listPawnTickets();
        res.json(tickets);
    } catch (err) {
        next(err);
    }
}

// GET /api/pawnTicket/:id
export async function getPawnTicketById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        const ticket = await pawnService.getPawnTicketById(id);
        res.json(ticket);
    } catch (err) {
        next(err);
    }
}

// POST /api/pawnTicket/
export async function createPawnTicket(req: Request, res: Response, next: NextFunction) {
    try {
        const dto = req.body;
        const newId = await pawnCommands.createPawnTicket(dto);
        res.status(201).json({ id: newId });
    } catch (err) {
        next(err);
    }
}

// PUT /api/pawnTicket/:id
export async function updatePawnTicket(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        const updates = req.body;
        await pawnCommands.updatePawnTicket(id, updates);
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
}

// DELETE /api/pawnTicket/:id
export async function deletePawnTicket(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        await pawnCommands.deletePawnTicket(id);
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
}
