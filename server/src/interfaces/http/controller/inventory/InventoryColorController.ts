import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { GetAllInventoryGenericColorsUseCase } from '../../../../application/use-case/inventory/query/GetAllInventoryGenericColorsUseCase';

export class InventoryColorController {
    constructor(
        private readonly getAllInventoryColorsUseCase: GetAllInventoryGenericColorsUseCase
    ) { }

    /**
     * Get all available inventory colors
     * GET /api/inventory/colors
     */
    getAllGenericColors = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.getAllInventoryColorsUseCase.execute();
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };
}
