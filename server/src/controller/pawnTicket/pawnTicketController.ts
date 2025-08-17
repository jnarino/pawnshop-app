import { Request, Response, NextFunction } from 'express';
import { CreatePawnTicketUseCase } from '../../application/useCase/pawnTicket/CreatePawnTicketUseCase';
import { GetPawnTicketUseCase } from '../../application/useCase/pawnTicket/GetPawnTicketUseCase';
import { UpdatePawnTicketDatesUseCase } from '../../application/useCase/pawnTicket/UpdatePawnTicketDatesUseCase';
import { DeletePawnTicketUseCase } from '../../application/useCase/pawnTicket/DeletePawnTicketUseCase';
import { SearchPawnTicketsUseCase } from '../../application/useCase/pawnTicket/SearchPawnTicketsUseCase';
import { ValidationError, NotFoundError } from '../../application/errors';

export interface PawnTicketController {
    search: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateDates: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    remove: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function makePawnTicketController(deps: {
    create: CreatePawnTicketUseCase;
    get: GetPawnTicketUseCase;
    updateDates: UpdatePawnTicketDatesUseCase;
    delete: DeletePawnTicketUseCase;
        search: SearchPawnTicketsUseCase;
}): PawnTicketController {
    const wrap = (fn: any) => async (req: Request, res: Response, next: NextFunction) => { try { await fn(req, res); } catch (e) { next(e); } };
    return {
        create: wrap(async (req: Request, res: Response) => {
            const id = await deps.create.execute(req.body);
            res.status(201).json({ id });
        }),
            search: wrap(async (req: Request, res: Response) => {
                const results = await deps.search.execute({
                    customerId: req.query.customerId as string | undefined,
                    type: req.query.type as any,
                    startDate: req.query.startDate as string | undefined,
                    endDate: req.query.endDate as string | undefined,
                    limit: req.query.limit ? Number(req.query.limit) : undefined,
                    offset: req.query.offset ? Number(req.query.offset) : undefined,
                });
                res.json(results);
            }),
        get: wrap(async (req: Request, res: Response) => {
            const ticket = await deps.get.execute(req.params.id);
            if (!ticket) throw new NotFoundError('pawnTicket not found');
            res.json(ticket);
        }),
        updateDates: wrap(async (req: Request, res: Response) => {
            const ok = await deps.updateDates.execute(req.params.id, req.body.maturityDate, req.body.defaultDate);
            res.sendStatus(ok ? 204 : 404);
        }),
        remove: wrap(async (req: Request, res: Response) => {
            const ok = await deps.delete.execute(req.params.id);
            res.sendStatus(ok ? 204 : 404);
        }),
    };
}
