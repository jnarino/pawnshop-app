import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { GetAllInventoryAttributeTypesUseCase } from '../../../../application/use-case/inventory/query/GetAllInventoryAttributeTypesUseCase';
import { GetInventoryAttributeValuesByTypeUseCase } from '../../../../application/use-case/inventory/query/GetInventoryAttributeValuesByTypeUseCase';

export class InventoryAttributeController {
  constructor(
    private readonly getAllTypesUseCase: GetAllInventoryAttributeTypesUseCase,
    private readonly getValuesByTypeUseCase: GetInventoryAttributeValuesByTypeUseCase
  ) {}

  /**
   * Get all attribute types (HAIR, COLOR, RACE, etc.)
   * GET /api/inventory/attributes/types
   */
  getAllTypes = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.getAllTypesUseCase.execute();
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Get all attribute values for a specific type
   * GET /api/inventory/attributes/values/:attributeTypeId
   */
  getValuesByType = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.getValuesByTypeUseCase.execute({
        attributeTypeId: req.params.attributeTypeId
      });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };
}
