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

  router.get('/', auth, controller.list);
  router.post('/', auth, requireRole(['admin', 'manager']), controller.create);
  router.put('/:id', auth, requireRole(['admin', 'manager']), controller.update);
  router.delete('/:id', auth, requireRole(['admin', 'manager']), controller.remove);

  return router;
}
