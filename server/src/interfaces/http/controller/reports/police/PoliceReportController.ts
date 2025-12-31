import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { GenerateDailyPoliceReportUseCase } from '../../../../../application/use-case/reports/police/query/GenerateDailyPoliceReportUseCase';

export class PoliceReportController {
    constructor(
        private readonly generateDailyPoliceReportUseCase: GenerateDailyPoliceReportUseCase,
    ) { }

    /**
     * GET /api/reports/police/daily
     * Generate fixed-width daily police report for a date range (defaults to today)
     */
    getDailyReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.generateDailyPoliceReportUseCase.execute({
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            });

            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
            return res.send(result.content);
        } catch (err) {
            return next(err);
        }
    };
}
