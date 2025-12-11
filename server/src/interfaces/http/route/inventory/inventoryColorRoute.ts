import { Router } from 'express';
import { InventoryColorController } from '../../controller/inventory/InventoryColorController';
import { authenticate } from '../../middleware/authMiddleware';

export function createInventoryColorRouter(
  controller: InventoryColorController,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/inventory/colors:
   *   get:
   *     tags:
   *       - Inventory Colors
   *     summary: Get all inventory colors
   *     description: Retrieve all available color options for inventory items
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of inventory colors
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   value:
   *                     type: string
   *                   displayOrder:
   *                     type: number
   *                     nullable: true
   *       401:
   *         description: Unauthorized
   */
  router.get('/', auth, controller.getAllGenericColors);

  return router;
}
