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

  /**
   * @openapi
   * /api/layaway:
   *   post:
   *     tags:
   *       - Layaways
   *     summary: Create new layaway
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateLayawayRequest'
   *     responses:
   *       201:
   *         description: Layaway created successfully
   */
  router.post('/', auth, controller.create);

  return router;
}
