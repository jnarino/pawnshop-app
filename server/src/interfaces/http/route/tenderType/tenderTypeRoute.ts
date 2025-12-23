import { Router } from 'express';
import { TenderTypeController } from '../../controller/tenderType/TenderTypeController';
import { authenticate } from '../../middleware/authMiddleware';

export const createTenderTypeRouter = (controller: TenderTypeController, jwtSecret: string): Router => {
    const router = Router();
    const auth = authenticate(jwtSecret);

    /**
     * @openapi
     * /api/tender-types:
     *   get:
     *     tags:
     *       - Tender Types
     *     summary: List all active tender types
     *     description: Retrieve a list of all active tender types available for payments
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of active tender types
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/TenderType'
     *       401:
     *         description: Unauthorized
     */
    router.get('/', auth, controller.list);

    return router;
};
