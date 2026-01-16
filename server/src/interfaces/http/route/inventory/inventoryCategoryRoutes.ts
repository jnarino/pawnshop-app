import { Router } from 'express';
import { InventoryCategoryController } from '../../controller/inventory/InventoryCategoryController';
import { authenticate } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';

export function createInventoryCategoryRouter(
    controller: InventoryCategoryController,
    jwtSecret: string
): Router {
    const router = Router();
    const auth = authenticate(jwtSecret);

    /**
     * @openapi
     * /api/category:
     *   post:
     *     tags:
     *       - Inventory Categories
     *     summary: Create new category
     *     description: Create a new inventory category with auto-generated unique code
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *                 description: Name of the category
     *     responses:
     *       201:
     *         description: Category created successfully
     *       400:
     *         description: Invalid input
     *       401:
     *         description: Unauthorized
     */
    router.post('/', auth, controller.create);

    /**
     * @openapi
     * /api/category/root:
     *   get:
     *     tags:
     *       - Inventory Categories
     *     summary: Get all root categories
     *     description: Returns a list of all root categories with id and name
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of root categories
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/CategorySimple'
     *       401:
     *         description: Unauthorized
     */
    router.get('/root', auth, controller.getRootCategories);

    /**
     * @openapi
     * /api/category/{categoryId}/subcategories:
     *   get:
     *     tags:
     *       - Inventory Categories
     *     summary: Get subcategories by category ID
     *     description: Returns all subcategories for a given category ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: categoryId
     *         required: true
     *         schema:
     *           type: string
     *         description: The category ID
     *     responses:
     *       200:
     *         description: List of subcategories
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/CategorySimple'
     *       401:
     *         description: Unauthorized
     */
    router.get('/:categoryId/subcategories', auth, controller.getSubCategories);

    /**
     * @openapi
     * /api/category/{categoryId}/brands:
     *   get:
     *     tags:
     *       - Inventory Categories
     *     summary: Get brands by category ID
     *     description: Returns all brands for a given root category ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: categoryId
     *         required: true
     *         schema:
     *           type: string
     *         description: The root category ID
     *     responses:
     *       200:
     *         description: List of brands
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/CategorySimple'
     *       401:
     *         description: Unauthorized
     */
    router.get('/:categoryId/brands', auth, controller.getBrandsByCategoryRoot);

    return router;
}
