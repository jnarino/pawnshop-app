import { Request, Response, NextFunction } from 'express';
import type { ListInventoryStatusesUseCase } from '../../application/useCase/inventory/status/ListInventoryStatusesUseCase';
import type { CreateInventoryStatusUseCase } from '../../application/useCase/inventory/status/CreateInventoryStatusUseCase';
import type { DeactivateInventoryStatusUseCase } from '../../application/useCase/inventory/status/DeactivateInventoryStatusUseCase';
import { logger } from '../../infrastructure/log/logger';

// ✅ Async wrapper for controller methods
function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

export function makeInventoryStatusController(useCases: {
    list: ListInventoryStatusesUseCase;
    create: CreateInventoryStatusUseCase;
    deactivate: DeactivateInventoryStatusUseCase;
}) {
    // ✅ Validate use cases are provided
    if (!useCases || !useCases.list || !useCases.create || !useCases.deactivate) {
        throw new Error('InventoryStatusController requires all use cases (list, create, deactivate)');
    }

    const list = wrap(async (req: Request, res: Response) => {
        try {
            logger.info('[InventoryStatusController] Getting inventory statuses');
            const statuses = await useCases.list.execute();
            res.json(statuses);
        } catch (error) {
            // ✅ Fix logger call with proper error object
            logger.error('[InventoryStatusController] Failed to list inventory statuses:', { 
                error: error instanceof Error ? error.message : String(error) 
            });
            res.status(500).json({ 
                error: 'internal_error', 
                message: 'Failed to load inventory statuses' 
            });
        }
    });

    const create = wrap(async (req: Request, res: Response) => {
        try {
            logger.info('[InventoryStatusController] Creating inventory status');
            const result = await useCases.create.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            // ✅ Fix logger call with proper error object
            logger.error('[InventoryStatusController] Failed to create inventory status:', { 
                error: error instanceof Error ? error.message : String(error) 
            });
            res.status(500).json({ 
                error: 'internal_error', 
                message: 'Failed to create inventory status' 
            });
        }
    });

    const deactivate = wrap(async (req: Request, res: Response) => {
        try {
            const { code } = req.params;
            logger.info('[InventoryStatusController] Deactivating inventory status:', { code });
            const success = await useCases.deactivate.execute(code);
            
            // ✅ Fix boolean check - success is a boolean, not void
            if (success) {
                res.status(204).send();
            } else {
                res.status(404).json({ error: 'not_found', message: 'Inventory status not found' });
            }
        } catch (error) {
            // ✅ Fix logger call with proper error object
            logger.error('[InventoryStatusController] Failed to deactivate inventory status:', { 
                error: error instanceof Error ? error.message : String(error) 
            });
            res.status(500).json({ 
                error: 'internal_error', 
                message: 'Failed to deactivate inventory status' 
            });
        }
    });

    const controller = {
        list,
        create,
        deactivate, // ✅ Use 'deactivate' instead of 'remove'
    };

    // ✅ Validate controller methods are functions
    Object.entries(controller).forEach(([method, fn]) => {
        if (typeof fn !== 'function') {
            throw new Error(`InventoryStatus controller ${method} method is not a function`);
        }
    });

    logger.info('[InventoryStatusController] Inventory status controller created successfully');
    return controller;
}

export type InventoryStatusController = ReturnType<typeof makeInventoryStatusController>;
