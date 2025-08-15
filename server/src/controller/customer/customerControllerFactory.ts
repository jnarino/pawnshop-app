import { Request, Response, NextFunction } from 'express';
import { DeleteCustomerUseCase } from '../../application/useCase/customer/DeleteCustomerUseCase';
import { GetCustomerUseCase } from '../../application/useCase/customer/GetCustomerUseCase';
import { CreateCustomerUseCase } from '../../application/useCase/customer/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from '../../application/useCase/customer/UpdateCustomerUseCase';
import { ListCustomersUseCase } from '../../application/useCase/customer/ListCustomersUseCase';
import { ValidationError } from '../../application/errors';

export interface CustomerController {
    list(req: Request, res: Response, next: NextFunction): any;
    get(req: Request, res: Response, next: NextFunction): any;
    create(req: Request, res: Response, next: NextFunction): any;
    update(req: Request, res: Response, next: NextFunction): any;
    remove(req: Request, res: Response, next: NextFunction): any;
}

function parsePagination(req: Request) {
    const limitRaw = req.query.limit as string | undefined;
    const offsetRaw = req.query.offset as string | undefined;
    const toNum = (v?: string) => v == null ? undefined : Number(v);
    const limit = toNum(limitRaw);
    const offset = toNum(offsetRaw);
    if ((limitRaw && Number.isNaN(limit)) || (offsetRaw && Number.isNaN(offset))) throw new ValidationError('limit/offset must be numbers');
    return { limit, offset };
}

function wrap(fn: (req: Request, res: Response, next: NextFunction)=>Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req,res,next)).catch(next); };
}

export function makeCustomerController(deps: { list: ListCustomersUseCase; get: GetCustomerUseCase; create: CreateCustomerUseCase; update: UpdateCustomerUseCase; delete: DeleteCustomerUseCase; }): CustomerController {
    return {
        list: wrap(async (req, res) => { const pg = parsePagination(req); const data = await deps.list.execute(pg); res.json(data); }),
        get: wrap(async (req, res) => { const c = await deps.get.execute(req.params.id); if (!c) { res.sendStatus(404); return; } res.json(c); }),
        create: wrap(async (req, res) => { const id = await deps.create.execute(req.body); res.status(201).json({ id }); }),
        update: wrap(async (req, res) => { const ok = await deps.update.execute(req.params.id, req.body); res.sendStatus(ok ? 204 : 404); }),
        remove: wrap(async (req, res) => { const ok = await deps.delete.execute(req.params.id); res.sendStatus(ok ? 204 : 404); }),
    };
}