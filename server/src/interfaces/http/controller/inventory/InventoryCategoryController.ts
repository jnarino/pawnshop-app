import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

import { CreateInventoryCategoryUseCase } from '../../../../application/use-case/inventory/command/CreateInventoryCategoryUseCase';
import { GetInventoryCategoryTreeUseCase } from '../../../../application/use-case/inventory/query/GetInventoryCategoryTreeUseCase';

export class InventoryCategoryController {
    constructor(
        private readonly createInventoryCategoryUseCase: CreateInventoryCategoryUseCase,
        private readonly getInventoryCategoryTreeUseCase: GetInventoryCategoryTreeUseCase
    ) { }

    /**
     * Get the full category tree as a flat list (UI rebuilds hierarchy).
     * GET /api/inventory/categories/tree
     */
    getTree = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.getInventoryCategoryTreeUseCase.execute();
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Create a new category (admin/manager only via route middleware).
     * POST /api/inventory/categories
     */
    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.createInventoryCategoryUseCase.execute(req.body);
            return res.status(201).json(result);
        } catch (err) {
            return next(err);
        }
    };
}
