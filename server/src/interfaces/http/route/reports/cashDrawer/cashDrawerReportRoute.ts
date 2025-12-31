import { Router } from 'express';
import { CashDrawerReportController } from '../../../controller/reports/cashDrawer/CashDrawerReportController';
import { authenticate } from '../../../middleware/authMiddleware';

export function createCashDrawerReportRouter(controller: CashDrawerReportController, jwtSecret: string): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/reports/cash-drawer/detail:
   *   get:
   *     tags:
   *       - Cash Drawer
   *     summary: Cash drawer detail with running balance
   *     description: Returns cash drawer transactions and running balance for the specified date range. Defaults to today if no dates provided.
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
   *         description: Exclusive end datetime (ISO 8601). Defaults to end of startDate/today.
   *     responses:
   *       200:
   *         description: Cash drawer detail
   *       204:
   *         description: No data for the date range
   *       401:
   *         description: Unauthorized
   */
  router.get('/detail', auth, controller.getCashDrawerDetail);

  return router;
}
