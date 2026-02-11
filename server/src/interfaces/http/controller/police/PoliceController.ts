import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { CreatePoliceHoldUseCase } from '../../../../application/use-case/hold/command/CreatePoliceHoldUseCase';
import { UpdatePoliceHoldUseCase } from '../../../../application/use-case/hold/command/UpdatePoliceHoldUseCase';
import { ListPoliceHoldUseCase } from '../../../../application/use-case/hold/query/ListPoliceHoldUseCase';

export class PoliceController {
  constructor(
    private readonly listPoliceHoldUseCase: ListPoliceHoldUseCase,
    private readonly createPoliceHoldUseCase: CreatePoliceHoldUseCase,
    private readonly updatePoliceHoldUseCase: UpdatePoliceHoldUseCase
  ) {}

  /**
   * POST /api/police/holds
   */
  createPoliceHold = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.createPoliceHoldUseCase.execute(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * PUT /api/police/holds/:id
   */
  updatePoliceHold = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = { ...req.body, id: req.params.id };
      const result = await this.updatePoliceHoldUseCase.execute(payload);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };

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
