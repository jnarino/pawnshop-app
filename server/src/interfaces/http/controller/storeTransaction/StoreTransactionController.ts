import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { CreateStoreTransactionUseCase } from '../../../../application/use-case/storeTransaction/command/CreateStoreTransactionUseCase';
import { CreateStoreTransactionDto } from '../../../../application/dto/storeTransaction/CreateStoreTransactionDto';
import { Actor } from '../../../../application/common/Actor';
import { ListStoreTransactionsByCustomerUseCase } from '../../../../application/use-case/storeTransaction/query/ListStoreTransactionsByCustomerUseCase';
import { ListStoreTransactionsByDateRangeUseCase } from '../../../../application/use-case/storeTransaction/query/ListStoreTransactionsByDateRangeUseCase';
import { RemoveCashFromMainDrawerUseCase } from '../../../../application/use-case/storeTransaction/command/RemoveCashFromMainDrawerUseCase';
import { AddMoneyToMainDrawerUseCase } from '../../../../application/use-case/storeTransaction/command/AddMoneyToMainDrawerUseCase';
import { ListBalanceCashDrawerUseCase } from '../../../../application/use-case/storeTransaction/query/ListBalanceCashDrawerUseCase';
import { CloseBalanceCashDrawerUseCase } from '../../../../application/use-case/storeTransaction/command/CloseBalanceCashDrawerUseCase';

export class StoreTransactionController {
  constructor(
    private readonly listByCustomerUseCase: ListStoreTransactionsByCustomerUseCase,
    private readonly listByDateRangeUseCase: ListStoreTransactionsByDateRangeUseCase,
    private readonly createStoreTransactionUseCase: CreateStoreTransactionUseCase,
    private readonly removeCashFromMainDrawerUseCase: RemoveCashFromMainDrawerUseCase,
    private readonly addMoneyToMainDrawerUseCase: AddMoneyToMainDrawerUseCase,
    private readonly listBalanceCashDrawerUseCase: ListBalanceCashDrawerUseCase,
    private readonly closeBalanceCashDrawerUseCase: CloseBalanceCashDrawerUseCase
  ) { }

  /**
   * GET /api/store-transaction/by-customer/:customerId
   * Return all store transactions for a given customer, newest first.
   */
  listByCustomer = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { customerId } = req.params;

      const result = await this.listByCustomerUseCase.execute({
        customerId,
      });

      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/store-transaction/by-date?from=MM/DD/YYYY&to=MM/DD/YYYY
   * or with time:
   *   /by-date?from=2025-12-02T10:00:00&to=2025-12-02T18:00:00
   */
  listByDateRange = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { from, to } = req.query;

      const input = {
        from: typeof from === 'string' ? from : '',
        to: typeof to === 'string' ? to : '',
      };

      const result = await this.listByDateRangeUseCase.execute(input);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const dto = req.body as CreateStoreTransactionDto;
      const result = await this.createStoreTransactionUseCase.execute(dto, actor.id);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  removeCashFromMainDrawer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const result = await this.removeCashFromMainDrawerUseCase.execute(req.body, actor.id);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  addMoneyToMainDrawer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const result = await this.addMoneyToMainDrawerUseCase.execute(req.body, actor.id);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  listBalanceCashDrawer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.listBalanceCashDrawerUseCase.execute(req.query);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  closeBalanceCashDrawer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const result = await this.closeBalanceCashDrawerUseCase.execute(req.body, actor.id);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  private getActor(req: AuthenticatedRequest): Actor {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };
  }
}
