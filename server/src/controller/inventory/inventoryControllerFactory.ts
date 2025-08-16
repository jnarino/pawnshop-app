import { Request, Response, NextFunction } from 'express';
import { CreateInventoryItemUseCase } from '../../application/useCase/inventory/CreateInventoryItemUseCase';
import { GetInventoryItemUseCase } from '../../application/useCase/inventory/GetInventoryItemUseCase';
import { ListInventoryItemsUseCase } from '../../application/useCase/inventory/ListInventoryItemsUseCase';
import { UpdateInventoryItemUseCase } from '../../application/useCase/inventory/UpdateInventoryItemUseCase';
import { DeleteInventoryItemUseCase } from '../../application/useCase/inventory/DeleteInventoryItemUseCase';
import { NotFoundError } from '../../application/errors';

export interface InventoryControllerDeps {
  list: ListInventoryItemsUseCase;
  get: GetInventoryItemUseCase;
  create: CreateInventoryItemUseCase;
  update: UpdateInventoryItemUseCase;
  delete: DeleteInventoryItemUseCase;
}

export function makeInventoryController(deps: InventoryControllerDeps) {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { limit, offset } = req.query;
        const items = await deps.list.execute({
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
        });
        res.json(items);
      } catch (e) { next(e); }
    },
    get: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const item = await deps.get.execute(req.params.id);
        if (!item) throw new NotFoundError('Inventory item not found');
        res.json(item);
      } catch (e) { next(e); }
    },
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = await deps.create.execute(req.body);
        res.status(201).json({ id });
      } catch (e) { next(e); }
    },
    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ok = await deps.update.execute(req.params.id, req.body);
        if (!ok) throw new NotFoundError('Inventory item not found');
        res.sendStatus(204);
      } catch (e) { next(e); }
    },
    delete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ok = await deps.delete.execute(req.params.id);
        if (!ok) throw new NotFoundError('Inventory item not found');
        res.sendStatus(204);
      } catch (e) { next(e); }
    },
  };
}

export type InventoryController = ReturnType<typeof makeInventoryController>;
