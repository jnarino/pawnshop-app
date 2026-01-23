import { Router } from 'express';
import { LayawayController } from '../../controller/layaway/LayawayController';
import { authenticate } from '../../middleware/authMiddleware';

export function createLayawayRouter(
  controller: LayawayController,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/layaway:
   *   get:
   *     tags:
   *       - Layaways
   *     summary: List layaways
   *     description: List layaways filtering by status or date range
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by status
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by start date (ISO date)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by end date (ISO date)
   *     responses:
   *       200:
   *         description: List of layaways
   */
  router.get('/', auth, controller.findByCriteria);

  return router;
}
