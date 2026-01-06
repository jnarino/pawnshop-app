import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { GenerateDailyPoliceReportUseCase } from '../../../../../application/use-case/reports/police/query/GenerateDailyPoliceReportUseCase';
import { ForbiddenError, NotFoundError } from '../../../../../application/common/errors';

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
            // Minimal mapping for known business errors; defer everything else to global error middleware
            if (err instanceof NotFoundError) return res.status(204).send();
            if (err instanceof ForbiddenError) return res.status(403).json({ message: 'Forbidden' });
            return next(err);
        }
    };
}
