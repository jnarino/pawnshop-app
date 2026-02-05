import { Router } from 'express';
import { PoliceController } from '../../controller/police/PoliceController';
import { authenticate } from '../../middleware/authMiddleware';

export function createPoliceRouter(
  controller: PoliceController,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/police/holds:
   *   get:
   *     tags:
   *       - Police
   *     summary: List police holds
   *     description: List police holds by criteria (control number, inventory number, case number, jurisdiction, agency)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: controlNumber
   *         schema:
   *           type: string
   *       - in: query
   *         name: caseNumber
   *         schema:
   *           type: string
   *       - in: query
   *         name: inventoryNumber
   *         schema:
   *           type: string
   *       - in: query
   *         name: jurisdiction
   *         schema:
   *           type: string
   *       - in: query
   *         name: agency
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of police holds
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/PoliceHoldResponseDto'
   *       401:
   *         description: Unauthorized
   */
  router.get('/holds', auth, controller.listPoliceHold);

  return router;
}
