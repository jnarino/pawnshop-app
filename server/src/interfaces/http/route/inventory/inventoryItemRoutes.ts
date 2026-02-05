import { Router } from 'express';
import { InventoryItemController } from '../../controller/inventory/InventoryItemController';
import { authenticate } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';

export function createInventoryItemRouter(
    controller: InventoryItemController,
    jwtSecret: string
): Router {
    const router = Router();
    const auth = authenticate(jwtSecret);

    /**
     * @openapi
     * /api/inventory-items/available/{inventoryNumber}:
     *   get:
     *     tags:
     *       - Inventory Items
     *     summary: Get available item by inventory number
     *     description: Retrieve an inventory item that is currently available (status = 'I' and created_at not null). Used for pawn transactions to verify item availability.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: inventoryNumber
     *         required: true
     *         schema:
     *           type: string
     *         description: Inventory number
     *     responses:
     *       200:
     *         description: Inventory item details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InventoryItem'
     *       404:
     *         description: Item not available for sale
     *       401:
     *         description: Unauthorized
     */
    router.get('/available/:inventoryNumber', auth, controller.getAvailableItemByInventoryNumber);

    /**
     * @openapi
     * /api/inventory-items/scrap-inventory-numbers:
     *   get:
     *     tags:
     *       - Inventory Items
     *     summary: Get scrap inventory numbers with descriptions
     *     description: Retrieve all scrap inventory numbers and descriptions (hardcoded list). Used to populate dropdowns when scrapping items.
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Scrap inventory items with numbers and descriptions ordered by description
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   inventoryNumber:
     *                     type: string
     *                   itemDescription:
     *                     type: string
     *                     nullable: true
     *       401:
     *         description: Unauthorized
     */
    router.get('/scrap-inventory-numbers', auth, controller.getScrapInventoryNumbers);

    /**
     * @openapi
     * /api/inventory-items/by-inventory-number/{inventoryNumber}:
     *   get:
     *     tags:
     *       - Inventory Items
     *     summary: Get item by inventory number (any status)
     *     description: Retrieve an inventory item by its inventory number regardless of status
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: inventoryNumber
     *         required: true
     *         schema:
     *           type: string
     *         description: Inventory number
     *     responses:
     *       200:
     *         description: Inventory item details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InventoryItem'
     *       404:
     *         description: Item not found
     *       401:
     *         description: Unauthorized
     */
    router.get('/by-inventory-number/:inventoryNumber', auth, controller.getItemByInventoryNumber);

    /**
     * @openapi
     * /api/inventory-items/by-serial-number/{serialNumber}:
     *   get:
     *     tags:
     *       - Inventory Items
     *     summary: Get item by serial number
     *     description: Retrieve an inventory item by its serial number
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: serialNumber
     *         required: true
     *         schema:
     *           type: string
     *         description: Serial number
     *     responses:
     *       200:
     *         description: Inventory item details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InventoryItem'
     *       404:
     *         description: Item not found
     *       401:
     *         description: Unauthorized
     */
    router.get('/by-serial-number/:serialNumber', auth, controller.getBySerialNumber);

    /**
     * @openapi
     * /api/inventory-items/findbyparam:
     *   get:
     *     tags:
     *       - Inventory Items
     *     summary: Find inventory items by optional parameters
     *     description: Search inventory items by brand, category, subcategory, serial number, or model
     *     security:
     *       - bearerAuth: []
     *     parameters:
    *       - in: query
    *         name: brandId
     *         schema:
     *           type: string
    *       - in: query
    *         name: categoryId
     *         schema:
     *           type: string
    *       - in: query
    *         name: subcategoryId
     *         schema:
     *           type: string
     *       - in: query
     *         name: serialNumber
     *         schema:
     *           type: string
     *       - in: query
     *         name: model
     *         schema:
     *           type: string
    *       - in: query
    *         name: inventoryNumber
    *         schema:
    *           type: string
     *     responses:
     *       200:
     *         description: Inventory items matching search criteria
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/InventoryItemSearchItem'
     *       401:
     *         description: Unauthorized
     */
    router.get('/findbyparam', auth, controller.findByParam);

    /**
     * @openapi
     * /api/inventory-items:
     *   post:
     *     tags:
     *       - Inventory Items
     *     summary: Create inventory item
     *     description: Create a new inventory item
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/InventoryItem'
     *     responses:
     *       201:
     *         description: Item created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InventoryItem'
     *       400:
     *         description: Invalid input
     *       401:
     *         description: Unauthorized
     */
    router.post('/', auth, controller.create);

    /**
     * @openapi
     * /api/inventory-items/{id}:
     *   put:
     *     tags:
     *       - Inventory Items
     *     summary: Update inventory item
     *     description: Update an existing inventory item
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Item ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/InventoryItem'
     *     responses:
     *       200:
     *         description: Item updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InventoryItem'
     *       404:
     *         description: Item not found
     *       401:
     *         description: Unauthorized
     */
    router.put('/:id', auth, controller.update);

    /**
     * @openapi
     * /api/inventory-items/{id}:
     *   delete:
     *     tags:
     *       - Inventory Items
     *     summary: Delete inventory item
     *     description: Delete an inventory item (requires admin or manager role)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Item ID
     *     responses:
     *       200:
     *         description: Item deleted successfully
     *       404:
     *         description: Item not found
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - insufficient permissions
     */
    router.delete('/:id', auth, requireRole(['admin', 'manager']), controller.remove);

    return router;
}
