import { Router } from 'express';
import { PoliceReportController } from '../../../controller/reports/police/PoliceReportController';
import { authenticate } from '../../../middleware/authMiddleware';


export function createPoliceReportRouter(
    controller: PoliceReportController,
    jwtSecret: string,
): Router {
    const router = Router();
    const auth = authenticate(jwtSecret);

    /**
     * @openapi
     * /api/reports/police/daily:
     *   get:
     *     tags:
     *       - Police Reports
     *     summary: Generate fixed-width daily police report
     *     description: Returns a fixed-width text file of all transactions for the provided date range. Defaults to the current day when no dates are provided.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Inclusive start date (ISO 8601). Defaults to start of today.
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Inclusive end date (ISO 8601). Defaults to end of today.
     *     responses:
     *       200:
     *         description: Fixed-width police report file (POLICE.EXP)
     *         content:
     *           text/plain:
     *             schema:
     *               type: string
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: No transactions found for the date range
     */
    router.get('/daily', auth, controller.getDailyReport);

    return router;
}
