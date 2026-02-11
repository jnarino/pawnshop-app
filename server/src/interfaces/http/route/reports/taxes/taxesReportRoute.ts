import { Router } from 'express';
import { TaxesReportController } from '../../../controller/reports/taxes/TaxesReportController';
import { authenticate } from '../../../middleware/authMiddleware';

export function createTaxesReportRouter(controller: TaxesReportController, jwtSecret: string): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/reports/taxes/sales:
   *   get:
   *     tags:
   *       - Taxes
   *     summary: Sales tax detail and totals
   *     description: Returns sales tax rows and totals for the provided date range.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: false
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Inclusive start datetime (ISO 8601). Defaults to start of today.
   *       - in: query
   *         name: endDate
   *         required: false
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Inclusive end datetime (ISO 8601). Defaults to end of startDate/today.
   *       - in: query
   *         name: onlyTotals
   *         required: false
   *         schema:
   *           type: boolean
   *         description: When true, returns totals only (rows are empty).
   *     responses:
   *       200:
   *         description: Sales tax report
   *       204:
   *         description: No data for the date range
   *       401:
   *         description: Unauthorized
   */
  router.get('/sales', auth, controller.getSalesTaxes);

  return router;
}
