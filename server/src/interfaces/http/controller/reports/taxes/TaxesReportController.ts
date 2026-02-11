import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { GetSalesTaxesUseCase } from '../../../../../application/use-case/reports/taxes/query/GetSalesTaxesUseCase';
import { ForbiddenError, NotFoundError } from '../../../../../application/common/errors';

export class TaxesReportController {
  constructor(private readonly getSalesTaxesUseCase: GetSalesTaxesUseCase) { }

  /**
   * GET /api/reports/taxes/sales
   * Return sales tax rows and totals for the given date range
   */
  getSalesTaxes = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.getSalesTaxesUseCase.execute({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        onlyTotals: req.query.onlyTotals,
      });

      return res.json(result);
    } catch (err) {
      if (err instanceof NotFoundError) return res.status(204).send();
      if (err instanceof ForbiddenError) return res.status(403).json({ message: 'Forbidden' });
      return next(err);
    }
  };
}
