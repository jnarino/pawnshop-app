import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

import { CreatePawnTicketWithItemsUseCase } from '../../../../application/use-case/pawnTicket/command/CreatePawnTicketWithItemsUseCase';
import { ListPawnTicketsByControlNumberUseCase } from '../../../../application/use-case/pawnTicket/query/ListPawnTicketsByControlNumberUseCase';
import { ListPawnTicketsByCustomerUseCase } from '../../../../application/use-case/pawnTicket/query/ListPawnTicketsByCustomerUseCase';
import { ListActivePawnTicketsByCustomerUseCase } from '../../../../application/use-case/pawnTicket/query/ListActivePawnTicketsByCustomerUseCase';

export class PawnTicketController {
    constructor(
        private readonly createPawnTicketWithItemsUseCase: CreatePawnTicketWithItemsUseCase,
        private readonly listByControlNumberUseCase: ListPawnTicketsByControlNumberUseCase,
        private readonly listByCustomerUseCase: ListPawnTicketsByCustomerUseCase,
        private readonly listActiveByCustomerUseCase: ListActivePawnTicketsByCustomerUseCase
    ) { }

    /**
     * Create a pawn ticket + items in a single transaction.
     * POST /api/pawn-ticket
     *
     * Body:
     * {
     *   "pawn": { ...pawn fields, without itemIds },
     *   "items": [ { ...inventory item create DTO } ],   // optional
     *   "itemIds": [ "existing-item-uuid" ]              // optional
     * }
     * At least one of items[] or itemIds[] is required.
     */
    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.createPawnTicketWithItemsUseCase.execute(req.body);
            return res.status(201).json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * List tickets by control number (usually one result, but kept as list).
     * GET /api/pawn-ticket/control/:controlNumber
     */
    listByControlNumber = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const controlNumber = req.params.controlNumber;
            const result = await this.listByControlNumberUseCase.execute({ controlNumber });
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * List ALL tickets for a customer.
     * GET /api/pawn-ticket/customer/:customerId
     */
    listByCustomer = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const customerId = req.params.customerId;
            const result = await this.listByCustomerUseCase.execute({ customerId });
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * List only ACTIVE tickets for a customer.
     * GET /api/pawn-ticket/customer/:customerId/active
     */
    listActiveByCustomer = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const customerId = req.params.customerId;
            const result = await this.listActiveByCustomerUseCase.execute({ customerId });
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };
}
