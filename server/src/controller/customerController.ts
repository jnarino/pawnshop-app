// server/src/controller/customerController.ts
import { Request, Response, NextFunction } from 'express';
import * as customerService from '../application/query';
import * as customerCommands from '../application/command';

// GET /api/customer/
export async function getAllCustomers(req: Request, res: Response, next: NextFunction) {
    try {
        const customers = await customerService.listCustomers();
        res.json(customers);
    } catch (err) {
        next(err);
    }
}

// GET /api/customer/:id
export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        const customer = await customerService.getCustomerById(id);
        res.json(customer);
    } catch (err) {
        next(err);
    }
}

// POST /api/customer/
export async function createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
        const dto = req.body;
        const newId = await customerCommands.createCustomer(dto);
        res.status(201).json({ id: newId });
    } catch (err) {
        next(err);
    }
}

// PUT /api/customer/:id
export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        const updates = req.body;
        await customerCommands.updateCustomer(id, updates);
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
}

// DELETE /api/customer/:id
export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        await customerCommands.deleteCustomer(id);
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
}
