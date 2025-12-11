import { Router } from 'express';
import { AppUserController } from '../../controller/appUser/AppUserController';
import { authenticate } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';

export function createAppUserRouter(
  controller: AppUserController,
  jwtSecret: string
): Router {
  const router = Router();

  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/app-users:
   *   get:
   *     tags:
   *       - App Users
   *     summary: List all users
   *     description: Retrieve all application users
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/AppUser'
   *       401:
   *         description: Unauthorized
   */
  router.get('/', auth, controller.list);

  /**
   * @openapi
   * /api/app-users:
   *   post:
   *     tags:
   *       - App Users
   *     summary: Create new user
   *     description: Create a new application user (requires admin or manager role)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AppUser'
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AppUser'
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  router.post('/', auth, requireRole(['admin', 'manager']), controller.create);

  /**
   * @openapi
   * /api/app-users/{id}:
   *   put:
   *     tags:
   *       - App Users
   *     summary: Update user
   *     description: Update an existing application user (requires admin or manager role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AppUser'
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AppUser'
   *       404:
   *         description: User not found
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  router.put('/:id', auth, requireRole(['admin', 'manager']), controller.update);

  /**
   * @openapi
   * /api/app-users/{id}:
   *   delete:
   *     tags:
   *       - App Users
   *     summary: Delete user
   *     description: Delete an application user (requires admin or manager role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User deleted successfully
   *       404:
   *         description: User not found
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  router.delete('/:id', auth, requireRole(['admin', 'manager']), controller.remove);

  return router;
}
