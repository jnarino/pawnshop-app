import { Request, Response, NextFunction } from 'express';
import { CreatePawnTicketUseCase } from '../../application/useCase/pawnTicket/CreatePawnTicketUseCase';
import { GetPawnTicketUseCase } from '../../application/useCase/pawnTicket/GetPawnTicketUseCase';
import { UpdatePawnTicketDatesUseCase } from '../../application/useCase/pawnTicket/UpdatePawnTicketDatesUseCase';
import { DeletePawnTicketUseCase } from '../../application/useCase/pawnTicket/DeletePawnTicketUseCase';
import { SearchPawnTicketsUseCase } from '../../application/useCase/pawnTicket/SearchPawnTicketsUseCase';
import { FindAllPawnTicketsUseCase } from '../../application/useCase/pawnTicket/FindAllPawnTicketsUseCase';
import { NotFoundError } from '../../application/errors';
import { validateJwt } from '../../infrastructure/http/middleware/auth';
import router from '../../infrastructure/http/routes/categoryRoutes';
import { logger } from '../../infrastructure/log/logger';
import { PawnTicketRepository } from '../../infrastructure/persistence/PawnTicketRepository';

interface Dependencies {
  findAll: FindAllPawnTicketsUseCase;
  create: CreatePawnTicketUseCase;
  get: GetPawnTicketUseCase;
  updateDates: UpdatePawnTicketDatesUseCase;
  delete: DeletePawnTicketUseCase;
  search: SearchPawnTicketsUseCase;
}

export function makePawnTicketController(deps: Dependencies) {
    return {
        findAll: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { limit, offset, customerId, pawnStatus } = req.query as any;
                const data = await deps.findAll.execute(
                    limit ? Number(limit) : undefined,
                    offset ? Number(offset) : undefined,
                    { customerId, pawnStatus }
                );
                res.json(data);
            } catch (e) { next(e); }
        },

        create: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const result = await deps.create.execute(req.body);
                res.status(201).json(result);
            } catch (e) { next(e); }
        },

        search: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const results = await deps.search.execute({
                    customerId: req.query.customerId as string | undefined,
                    type: req.query.type as any,
                    startDate: req.query.startDate as string | undefined,
                    endDate: req.query.endDate as string | undefined,
                    limit: req.query.limit ? Number(req.query.limit) : undefined,
                    offset: req.query.offset ? Number(req.query.offset) : undefined,
                });
                res.json(results);
            } catch (e) { next(e); }
        },

        get: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const ticket = await deps.get.execute(req.params.id);
                if (!ticket) throw new NotFoundError('Pawn ticket not found');
                res.json(ticket);
            } catch (e) { next(e); }
        },

        updateDates: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const ok = await deps.updateDates.execute(req.params.id, req.body.maturityDate, req.body.defaultDate);
                if (!ok) throw new NotFoundError('Pawn ticket not found');
                res.sendStatus(204);
            } catch (e) { next(e); }
        },

        delete: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const ok = await deps.delete.execute(req.params.id);
                if (!ok) throw new NotFoundError('Pawn ticket not found');
                res.sendStatus(204);
            } catch (e) { next(e); }
        },

        // ✅ Add remove as an alias for delete (for route compatibility)
        remove: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const ok = await deps.delete.execute(req.params.id);
                if (!ok) throw new NotFoundError('Pawn ticket not found');
                res.sendStatus(204);
            } catch (e) { next(e); }
        },

        // ✅ Keep only the query method for payment history
        findByControlNumberWithPayments: async (req: Request, res: Response) => {
            try {
                const { controlNumber } = req.params;
                
                if (!controlNumber) {
                    return res.status(400).json({
                        error: 'validation_error',
                        message: 'Control number is required'
                    });
                }

                const result = await deps.get.findByControlNumberWithPayments(controlNumber);
                
                if (!result) {
                    return res.status(404).json({
                        error: 'not_found',
                        message: 'Pawn ticket not found'
                    });
                }

                res.json(result);
            } catch (error) {
                console.error('[PawnTicketController] Find with payments failed:', error);
                res.status(500).json({
                    error: 'internal_error',
                    message: error instanceof Error ? error.message : 'Failed to fetch pawn ticket'
                });
            }
        },
    };
}

export type PawnTicketController = ReturnType<typeof makePawnTicketController>;

// GET /api/pawnTicket/:controlNumber/payments - Get pawn ticket with payment history
router.get('/:controlNumber/payments', validateJwt, async (req, res) => {
    try {
        const { controlNumber } = req.params;
        const pawnTicketRepo = new PawnTicketRepository();
        const ticket = await pawnTicketRepo.findByControlNumberWithPayments(controlNumber);

        if (!ticket) {
            return res.status(404).json({ error: 'not_found', message: 'Pawn ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        logger.error('pawn_ticket_get_payments_error', {
            controlNumber: req.params.controlNumber,
            error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ error: 'internal_error', message: 'Failed to get pawn ticket payments' });
    }
});
