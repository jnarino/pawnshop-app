import { Router } from 'express';
import { InventoryAttributeController } from '../../controller/inventory/InventoryAttributeController';
import { authenticate } from '../../middleware/authMiddleware';

export function createInventoryAttributeRouter(
  controller: InventoryAttributeController,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/inventory/attributes/types:
   *   get:
   *     tags:
   *       - Inventory Attributes
   *     summary: Get all attribute types
   *     description: Returns all attribute types (HAIR, COLOR, RACE, etc.)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of attribute types
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   name:
   *                     type: string
   *       401:
   *         description: Unauthorized
   */
  router.get('/types', auth, controller.getAllTypes);

  /**
   * @openapi
   * /api/inventory/attributes/values/{attributeTypeId}:
   *   get:
   *     tags:
   *       - Inventory Attributes
   *     summary: Get attribute values by type
   *     description: Returns all values for a specific attribute type
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: attributeTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Attribute type ID
   *     responses:
   *       200:
   *         description: List of attribute values
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   attributeTypeId:
   *                     type: string
   *                   value:
   *                     type: string
   *       401:
   *         description: Unauthorized
   */
  router.get('/values/:attributeTypeId', auth, controller.getValuesByType);

/**
     * @openapi
     * /api/inventory/attributes/values:
     *   post:
     *     tags:
     *       - Inventory Attributes
     *     summary: Create new attribute value
     *     description: Create a new value for a specific attribute type
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - attributeTypeId
     *               - value
     *             properties:
     *               attributeTypeId:
     *                 type: string
     *                 format: uuid
     *               value:
     *                 type: string
     *     responses:
     *       201:
     *         description: Attribute value created
     *       400:
     *         description: Invalid input
     *       401:
     *         description: Unauthorized
     */
    router.post('/values', auth, controller.createValue);

    return router;
}
