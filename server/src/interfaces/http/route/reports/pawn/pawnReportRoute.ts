import { Router } from 'express';
import { PawnReportController } from '../../../controller/reports/pawn/PawnReportController';
import { authenticate } from '../../../middleware/authMiddleware';

export function createPawnReportRouter(controller: PawnReportController, jwtSecret: string): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
  /**
   * @openapi
   * /api/reports/pawn/active:
   *   get:
   *     tags:
   *       - Pawn
   *     summary: List active pawns
   *     description: Returns active pawns with optional category/subcategory filters. Response includes a totals object with counts and sums.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: categoryId
   *         required: false
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by inventory category id.
   *       - in: query
   *         name: subcategoryId
   *         required: false
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by inventory subcategory id.
   *     responses:
   *       200:
   *         description: Active pawns list
   *       204:
   *         description: No active pawns found
   *       401:
   *         description: Unauthorized
   */
  router.get('/active', auth, controller.getActivePawns);

  return router;
}
