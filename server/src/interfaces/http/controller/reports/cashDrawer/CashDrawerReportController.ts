import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { GenerateCashDrawerDetailUseCase } from '../../../../../application/use-case/reports/cashDrawer/query/GenerateCashDrawerDetailUseCase';
import { NotFoundError, ForbiddenError } from '../../../../../application/common/errors';

export class CashDrawerReportController {
  constructor(private readonly generateCashDrawerDetailUseCase: GenerateCashDrawerDetailUseCase) { }

  /**
   * GET /api/reports/cash-drawer/detail
   * Return cash drawer detail rows with running balance for the given date range
   */
  getCashDrawerDetail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.generateCashDrawerDetailUseCase.execute({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });

      return res.json(result);
    } catch (err) {
      if (err instanceof NotFoundError) return res.status(204).send();
      if (err instanceof ForbiddenError) return res.status(403).json({ message: 'Forbidden' });
      return next(err);
    }
  };
}
