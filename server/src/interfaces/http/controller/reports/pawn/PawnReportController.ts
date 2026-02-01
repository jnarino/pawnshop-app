import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { GetActivePawnsUseCase } from '../../../../../application/use-case/reports/pawn/query/GetActivePawnsUseCase';

export class PawnReportController {
  constructor(private readonly getActivePawnsUseCase: GetActivePawnsUseCase) {}

  getActivePawns = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const excludeParam = req.query.excludeJewelryAndFirearm;
      const excludeJewelryAndFirearm =
        typeof excludeParam === 'string' ? excludeParam.toLowerCase() === 'true' : Boolean(excludeParam);

      const input = {
        categoryId: req.query.categoryId as string | undefined,
        subcategoryId: req.query.subcategoryId as string | undefined,
        excludeJewelryAndFirearm,
      };
      const result = await this.getActivePawnsUseCase.execute(input);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };
}
