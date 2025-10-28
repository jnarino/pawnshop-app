import { Request, Response, NextFunction } from 'express';
import { DeleteCustomerUseCase } from '../../application/useCase/customer/DeleteCustomerUseCase';
import { GetCustomerUseCase } from '../../application/useCase/customer/GetCustomerUseCase';
import { CreateCustomerUseCase } from '../../application/useCase/customer/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from '../../application/useCase/customer/UpdateCustomerUseCase';
import { ListCustomersUseCase } from '../../application/useCase/customer/ListCustomersUseCase';
import { ValidationError } from '../../application/errors';

function parsePagination(req: Request) {
    const limitRaw = req.query.limit as string | undefined;
    const offsetRaw = req.query.offset as string | undefined;
    const toNum = (v?: string) => v == null ? undefined : Number(v);
    const limit = toNum(limitRaw);
    const offset = toNum(offsetRaw);
    if ((limitRaw && Number.isNaN(limit)) || (offsetRaw && Number.isNaN(offset))) throw new ValidationError('limit/offset must be numbers');
    return { limit, offset };
}

function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res, next)).catch(next); };
}

export function makeCustomerController(useCases: {
    list: ListCustomersUseCase;
    get: GetCustomerUseCase;
    create: CreateCustomerUseCase;
    update: UpdateCustomerUseCase;
    delete: DeleteCustomerUseCase;
}) {
    const listCustomers = wrap(async (req, res) => {
        const pg = parsePagination(req);
        const { firstName, lastName, dateOfBirth } = req.query as any;
        const data = await useCases.list.execute({ ...pg, firstName, lastName, dateOfBirth });
        res.json(data);
    });

    const getCustomer = wrap(async (req, res) => {
        const c = await useCases.get.execute(req.params.id);
        if (!c) { res.sendStatus(404); return; }
        res.json(c);
    });

    const createCustomer = wrap(async (req, res) => {
        const id = await useCases.create.execute(req.body);
        res.status(201).json({ id });
    });

    const updateCustomer = wrap(async (req, res) => {
        const ok = await useCases.update.execute(req.params.id, req.body);
        res.sendStatus(ok ? 204 : 404);
    });

    const deleteCustomer = wrap(async (req, res) => {
        const { id } = req.params;
        await useCases.delete.execute(id);
        res.status(204).send();
    });

    return {
        list: listCustomers,
        get: getCustomer,
        create: createCustomer,
        update: updateCustomer,
        delete: deleteCustomer,
    };
}

export type CustomerController = ReturnType<typeof makeCustomerController>;