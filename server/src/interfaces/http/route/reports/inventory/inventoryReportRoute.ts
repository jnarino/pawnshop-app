import { Router } from 'express';
import { InventoryReportController } from '../../../controller/reports/inventory/InventoryReportController';
import { authenticate } from '../../../middleware/authMiddleware';

export function createInventoryReportRouter(controller: InventoryReportController, jwtSecret: string): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/reports/inventory/items:
   *   get:
   *     tags:
   *       - Inventory Reports
   *     summary: List all inventory items on hand
   *     description: Returns all inventory items with quantities, cost, and resale values where status = 'I'. Includes totals for quantity, cost, and resale.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Inventory items with totals
   *       204:
   *         description: No inventory items found
   *       401:
   *         description: Unauthorized
   */
  router.get('/items', auth, controller.getAllItemsInventory);

  return router;
}
