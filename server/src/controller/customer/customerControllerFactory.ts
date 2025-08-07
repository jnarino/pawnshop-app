import { Request, Response, NextFunction } from 'express';
import { DeleteCustomerUseCase } from '../../application/useCase/customer/DeleteCustomerUseCase';
import { GetCustomerUseCase } from '../../application/useCase/customer/GetCustomerUseCase';
import { CreateCustomerUseCase } from '../../application/useCase/customer/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from '../../application/useCase/customer/UpdateCustomerUseCase';
import { ListCustomersUseCase } from '../../application/useCase/customer/ListCustomersUseCase';

export function makeCustomerController(deps: {
    list: ListCustomersUseCase;
    get: GetCustomerUseCase;
    create: CreateCustomerUseCase;
    update: UpdateCustomerUseCase;
    delete: DeleteCustomerUseCase;
}) {
    return {
        getAll: async (req: Request, res: Response, next: NextFunction) => {
            try { const data = await deps.list.execute(); res.json(data); } catch (e) { next(e); }
        },
        getById: async (req: Request, res: Response, next: NextFunction) => {
            try { const data = await deps.get.execute(req.params.id); res.json(data); } catch (e) { next(e); }
        },
        create: async (req: Request, res: Response, next: NextFunction) => {
            try { const id = await deps.create.execute(req.body); res.status(201).json({ id }); } catch (e) { next(e); }
        },
        update: async (req: Request, res: Response, next: NextFunction) => {
            try { await deps.update.execute(req.params.id, req.body); res.sendStatus(204); } catch (e) { next(e); }
        },
        delete: async (req: Request, res: Response, next: NextFunction) => {
            try { await deps.delete.execute(req.params.id); res.sendStatus(204); } catch (e) { next(e); }
        }
    };
}