import { Request, Response, NextFunction } from 'express';
import { ListInventoryStatusesUseCase } from '../../application/useCase/inventory/status/ListInventoryStatusesUseCase';
import { CreateInventoryStatusUseCase } from '../../application/useCase/inventory/status/CreateInventoryStatusUseCase';
import { DeactivateInventoryStatusUseCase } from '../../application/useCase/inventory/status/DeactivateInventoryStatusUseCase';
import { ValidationError } from '../../application/errors';

export interface InventoryStatusController {
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  remove: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function makeInventoryStatusController(deps: {
  list: ListInventoryStatusesUseCase;
  create: CreateInventoryStatusUseCase;
  deactivate: DeactivateInventoryStatusUseCase;
}): InventoryStatusController {
  const wrap = (fn: any) => async (req: Request, res: Response, next: NextFunction) => {
    try { await fn(req, res); } catch (err) { next(err); }
  };
  return {
  list: wrap(async (_req: Request, res: Response) => {
      const statuses = await deps.list.execute();
      res.json(statuses);
    }),
  create: wrap(async (req: Request, res: Response) => {
      await deps.create.execute(req.body);
      res.sendStatus(201);
    }),
  remove: wrap(async (req: Request, res: Response) => {
      await deps.deactivate.execute(req.params.code);
      res.sendStatus(204);
    }),
  };
}
