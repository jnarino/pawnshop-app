import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { GetAllItemsInventoryUseCase } from '../../../../../application/use-case/reports/inventory/query/GetAllItemsInventoryUseCase';

export class InventoryReportController {
  constructor(private readonly getAllItemsInventoryUseCase: GetAllItemsInventoryUseCase) {}

  getAllItemsInventory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const excludeParam = req.query.excludeJewelryAndFirearm;
      const excludeJewelryAndFirearm =
        typeof excludeParam === 'string' ? excludeParam.toLowerCase() === 'true' : Boolean(excludeParam);

      const input = {
        categoryId: req.query.categoryId as string | undefined,
        subcategoryId: req.query.subcategoryId as string | undefined,
        excludeJewelryAndFirearm,
      };

      const result = await this.getAllItemsInventoryUseCase.execute(input);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };
}
