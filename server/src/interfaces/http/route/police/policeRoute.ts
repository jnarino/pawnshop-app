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
  /**
   * @openapi
   * /api/police/holds:
   *   post:
   *     tags:
   *       - Police
   *     summary: Create a police hold
   *     description: Create a new police hold for one or more inventory items
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePoliceHoldRequest'
   *     responses:
   *       201:
   *         description: Police hold created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PoliceHoldResponseDto'
   *       400:
   *         description: Invalid input or item validation error
   *       404:
   *         description: Inventory item not found
   *       401:
   *         description: Unauthorized
   */
  router.post('/holds', auth, controller.createPoliceHold);
  return router;
}
