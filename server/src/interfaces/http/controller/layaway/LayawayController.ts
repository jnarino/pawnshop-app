import { Request, Response, NextFunction } from 'express';
import { GetLayawaysUseCase } from '../../../../application/use-case/layaway/query/GetLayawaysUseCase';

export class LayawayController {
  constructor(private readonly getLayawaysUseCase: GetLayawaysUseCase) {}

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
}
