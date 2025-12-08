import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

import { ListStoreTransactionsByCustomerUseCase } from '../../../../application/use-case/storeTransaction/query/ListStoreTransactionsByCustomerUseCase';
import { ListStoreTransactionsByDateRangeUseCase } from '../../../../application/use-case/storeTransaction/query/ListStoreTransactionsByDateRangeUseCase';

export class StoreTransactionController {
  constructor(
    private readonly listByCustomerUseCase: ListStoreTransactionsByCustomerUseCase,
    private readonly listByDateRangeUseCase: ListStoreTransactionsByDateRangeUseCase
  ) {}

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
}
