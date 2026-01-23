import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { GetLayawaysUseCase } from '../../../../application/use-case/layaway/query/GetLayawaysUseCase';
import { CreateLayawayUseCase } from '../../../../application/use-case/layaway/command/CreateLayawayUseCase';
import { GetLayawaysByCustomerUseCase } from '../../../../application/use-case/layaway/query/GetLayawaysByCustomerUseCase';
import { MakeLayawayPaymentUseCase } from '../../../../application/use-case/layaway/command/MakeLayawayPaymentUseCase';

export class LayawayController {
  constructor(
    private readonly getLayawaysUseCase: GetLayawaysUseCase,
    private readonly createLayawayUseCase: CreateLayawayUseCase,
    private readonly getLayawaysByCustomerUseCase: GetLayawaysByCustomerUseCase,
    private readonly makeLayawayPaymentUseCase: MakeLayawayPaymentUseCase
  ) {}

  findByCriteria = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };
      
      const result = await this.getLayawaysUseCase.execute(input);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await this.createLayawayUseCase.execute(req.body, userId);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/layaway/customer/:customerId
   */
  findByCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = {
        customerId: req.params.customerId,
        status: req.query.status,
      };
      
      const result = await this.getLayawaysByCustomerUseCase.execute(input);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * POST /api/layaway/payment
   */
  makePayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await this.makeLayawayPaymentUseCase.execute(req.body, userId);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  };
}
