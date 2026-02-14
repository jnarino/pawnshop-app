import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { GetAllItemsInventoryUseCase } from '../../../../../application/use-case/reports/inventory/query/GetAllItemsInventoryUseCase';

export class InventoryReportController {
  constructor(private readonly getAllItemsInventoryUseCase: GetAllItemsInventoryUseCase) {}

  getAllItemsInventory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.getAllItemsInventoryUseCase.execute({});
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };
}
