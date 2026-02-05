import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { ListPoliceHoldUseCase } from '../../../../application/use-case/hold/query/ListPoliceHoldUseCase';

export class PoliceController {
  constructor(
    private readonly listPoliceHoldUseCase: ListPoliceHoldUseCase
  ) {}

  /**
   * GET /api/police/holds
   */
  listPoliceHold = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Collect query params
      const criteria = {
        controlNumber: req.query.controlNumber,
        caseNumber: req.query.caseNumber,
        inventoryNumber: req.query.inventoryNumber,
        jurisdiction: req.query.jurisdiction,
        agency: req.query.agency
      };
      
      const result = await this.listPoliceHoldUseCase.execute(criteria);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };
}
