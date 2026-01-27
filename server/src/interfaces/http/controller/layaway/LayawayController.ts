import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { GetLayawaysUseCase } from '../../../../application/use-case/layaway/query/GetLayawaysUseCase';
import { CreateLayawayUseCase } from '../../../../application/use-case/layaway/command/CreateLayawayUseCase';
import { GetLayawaysByCustomerUseCase } from '../../../../application/use-case/layaway/query/GetLayawaysByCustomerUseCase';
import { GetLayawayByTicketNumUseCase } from '../../../../application/use-case/layaway/query/GetLayawayByTicketNumUseCase';
import { MakeLayawayPaymentUseCase } from '../../../../application/use-case/layaway/command/MakeLayawayPaymentUseCase';
import { VoidLayawayPaymentUseCase } from '../../../../application/use-case/layaway/command/VoidLayawayPaymentUseCase';
import { GetLayawayHistoryUseCase } from '../../../../application/use-case/layaway/query/GetLayawayHistoryUseCase';
import { GetDefaultedLayawaysUseCase } from '../../../../application/use-case/layaway/query/GetDefaultedLayawaysUseCase';

export class LayawayController {
  constructor(
    private readonly getLayawaysUseCase: GetLayawaysUseCase,
    private readonly createLayawayUseCase: CreateLayawayUseCase,
    private readonly getLayawaysByCustomerUseCase: GetLayawaysByCustomerUseCase,
    private readonly getLayawayByTicketNumUseCase: GetLayawayByTicketNumUseCase,
    private readonly makeLayawayPaymentUseCase: MakeLayawayPaymentUseCase,
    private readonly voidLayawayPaymentUseCase: VoidLayawayPaymentUseCase,
    private readonly getLayawayHistoryUseCase: GetLayawayHistoryUseCase,
    private readonly getDefaultedLayawaysUseCase: GetDefaultedLayawaysUseCase
  ) {}

  /**
   * GET /api/layaway/defaulted
   */
  getDefaulted = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.getDefaultedLayawaysUseCase.execute();
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };

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

  /**
   * GET /api/layaway/ticket/:ticketnum
   */
  findByTicketNum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = {
        ticketnum: req.params.ticketnum
      };
      
      const result = await this.getLayawayByTicketNumUseCase.execute(input);
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

  /**
   * POST /api/layaway/payment/void
   */
  voidPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await this.voidLayawayPaymentUseCase.execute(req.body, userId);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/layaway/history/:customerId/:ticketnum
   */
  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = {
        customerId: req.params.customerId,
        ticketnum: req.params.ticketnum
      };
      
      const result = await this.getLayawayHistoryUseCase.execute(input);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };
}
