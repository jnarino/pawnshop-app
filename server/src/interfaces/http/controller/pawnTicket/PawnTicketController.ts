import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

import { CreatePawnTicketWithItemsUseCase } from '../../../../application/use-case/pawnTicket/command/CreatePawnTicketWithItemsUseCase';
import { ListPawnTicketsByControlNumberUseCase } from '../../../../application/use-case/pawnTicket/query/ListPawnTicketsByControlNumberUseCase';
import { ListPawnTicketsByCustomerUseCase } from '../../../../application/use-case/pawnTicket/query/ListPawnTicketsByCustomerUseCase';
import { ListActivePawnTicketsByCustomerUseCase } from '../../../../application/use-case/pawnTicket/query/ListActivePawnTicketsByCustomerUseCase';
import { ListPreviousItemsByCustomerUseCase } from '../../../../application/use-case/pawnTicket/query/ListPreviousItemsByCustomerUseCase';
import { ListHistoryPawnsByCustomerUseCase } from '../../../../application/use-case/pawnTicket/query/ListHistoryPawnsByCustomerUseCase';
import { GetPawnTicketPaymentsUseCase } from '../../../../application/use-case/pawnTicketPayment/query/GetPawnTicketPaymentsUseCase';
import { GetPawnTicketCurrentChargesUseCase } from '../../../../application/use-case/pawnTicket/query/GetPawnTicketCurrentChargesUseCase';
import { PayPawnTicketUseCase } from '../../../../application/use-case/pawnTicket/command/PayPawnTicketUseCase';
import { PullPawnTicketItemsToInventoryUseCase } from '../../../../application/use-case/pawnTicket/command/PullPawnTicketItemsToInventoryUseCase';

import { ListPawnTicketsByDateRangeUseCase } from '../../../../application/use-case/pawnTicket/query/ListPawnTicketsByDateRangeUseCase';

export class PawnTicketController {
    constructor(
        private readonly createPawnTicketWithItemsUseCase: CreatePawnTicketWithItemsUseCase,
        private readonly listByControlNumberUseCase: ListPawnTicketsByControlNumberUseCase,
        private readonly listByCustomerUseCase: ListPawnTicketsByCustomerUseCase,
        private readonly listActiveByCustomerUseCase: ListActivePawnTicketsByCustomerUseCase,
        private readonly listPreviousItemsByCustomerUseCase: ListPreviousItemsByCustomerUseCase,
        private readonly listHistoryPawnsByCustomerUseCase: ListHistoryPawnsByCustomerUseCase,
        private readonly getPawnTicketPaymentsUseCase: GetPawnTicketPaymentsUseCase,
        private readonly getPawnTicketCurrentChargesUseCase: GetPawnTicketCurrentChargesUseCase,
        private readonly payPawnTicketUseCase: PayPawnTicketUseCase,
        private readonly listByDateRangeUseCase: ListPawnTicketsByDateRangeUseCase,
        private readonly pullPawnTicketItemsToInventoryUseCase: PullPawnTicketItemsToInventoryUseCase
    ) { }

    /**
     * GET /api/pawn-ticket/date-range
     */
    listByDateRange = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { from, to } = req.query;
            const result = await this.listByDateRangeUseCase.execute({ from, to });
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * POST /api/pawn-ticket/pull-to-inventory
     * Marks ticket status and updates linked items (including scrap handling) in a single transaction.
     */
    pullToInventory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const payload = {
                ...req.body,
                clerkUserId: req.user?.id,
            };
            const result = await this.pullPawnTicketItemsToInventoryUseCase.execute(payload);
            return res.status(200).json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * POST /api/pawn-ticket/payment
     * Accepts payments or redemptions for pawn tickets.
     */
    payOnTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const payload = {
                ...req.body,
                clerkUserId: req.user?.id,
            };
            await this.payPawnTicketUseCase.execute(payload);
            return res.status(200).json({ message: 'Payment processed' });
        } catch (err) {
            return next(err);
        }
    };


    /**
     * Create a pawn ticket + items in a single transaction.
     * POST /api/pawn-ticket
     *
     * Body:
     * {
     *   "pawn": { ...pawn fields },
     *   "items": [ { ...inventory item create DTO } ]  // required, min 1 item
     * }
     */
    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const payload = {
                ...req.body,
                pawn: {
                    ...req.body.pawn,
                    clerkUserId: req.user?.id,
                },
            };
            const result = await this.createPawnTicketWithItemsUseCase.execute(payload);
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

    /**
     * List distinct previous items for a customer across pawn tickets.
     * GET /api/pawn-ticket/customer/:customerId/previous-items
     */
    listPreviousItemsByCustomer = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const customerId = req.params.customerId;
            const result = await this.listPreviousItemsByCustomerUseCase.execute({ customerId });
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * List pawn history for a customer with ticket dates, amounts, and item descriptions.
     * GET /api/pawn-ticket/customer/:customerId/history
     */
    listHistoryByCustomer = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const customerId = req.params.customerId;
            const result = await this.listHistoryPawnsByCustomerUseCase.execute({ customerId });
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get all payments for a pawn ticket.
     * GET /api/pawn-ticket/:pawnTicketId/payments
     */
    getPayments = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const pawnTicketId = req.params.pawnTicketId;
            const result = await this.getPawnTicketPaymentsUseCase.execute({ pawnTicketId });
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get current charges, pawn amount, periods behind, and redemption amount for a pawn ticket.
     * GET /api/pawn-ticket/:controlNumber/current-charges
     */
    getCurrentCharges = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const controlNumber = req.params.controlNumber;
            const result = await this.getPawnTicketCurrentChargesUseCase.execute({ controlNumber });
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

}
