import { Router } from 'express';
import { CustomerController } from '../../controller/customer/CustomerController';
import { authenticate } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';


export function createCustomerRouter(
    controller: CustomerController,
    jwtSecret: string
): Router {
    const router = Router();
    const auth = authenticate(jwtSecret);

    /**
     * @openapi
     * /api/customer:
     *   get:
     *     tags:
     *       - Customers
     *     summary: Search customers
     *     description: Search for customers by query parameter
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: q
     *         schema:
     *           type: string
     *         description: Search query for customer name, phone, email
     *     responses:
     *       200:
     *         description: List of matching customers
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Customer'
     *       401:
     *         description: Unauthorized
     */
    router.get('/', auth, controller.search);

    /**
     * @openapi
     * /api/customer/search:
     *   get:
     *     tags:
     *       - Customers
     *     summary: Search customers (grid view)
     *     description: Search for customers for grid display
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: q
     *         schema:
     *           type: string
     *         description: Search query
     *     responses:
     *       200:
     *         description: List of matching customers
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Customer'
     *       401:
     *         description: Unauthorized
     */
    router.get('/search', auth, controller.search);

    /**
     * @openapi
     * /api/customer/{id}:
     *   get:
     *     tags:
     *       - Customers
     *     summary: Get customer by ID
     *     description: Retrieve full customer details by ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Customer ID
     *     responses:
     *       200:
     *         description: Customer details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Customer'
     *       404:
     *         description: Customer not found
     *       401:
     *         description: Unauthorized
     */
    router.get('/:id', auth, controller.getById);

    /**
     * @openapi
     * /api/customer:
     *   post:
     *     tags:
     *       - Customers
     *     summary: Create new customer
     *     description: Create a new customer record
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Customer'
     *     responses:
     *       201:
     *         description: Customer created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Customer'
     *       400:
     *         description: Invalid input
     *       401:
     *         description: Unauthorized
     */
    router.post('/', auth, controller.create);

    /**
     * @openapi
     * /api/customer/{id}:
     *   put:
     *     tags:
     *       - Customers
     *     summary: Update customer
     *     description: Update an existing customer record
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Customer ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Customer'
     *     responses:
     *       200:
     *         description: Customer updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Customer'
     *       404:
     *         description: Customer not found
     *       401:
     *         description: Unauthorized
     */
    router.put('/:id', auth, controller.update);

    /**
     * @openapi
     * /api/customer/{id}:
     *   delete:
     *     tags:
     *       - Customers
     *     summary: Delete customer
     *     description: Delete a customer (requires admin or manager role)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Customer ID
     *     responses:
     *       200:
     *         description: Customer deleted successfully
     *       404:
     *         description: Customer not found
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - insufficient permissions
     */
    router.delete('/:id', auth, requireRole(['admin', 'manager']), controller.remove);

    return router;
}
