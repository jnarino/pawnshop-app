import { Router } from 'express';
import { AuthController } from '../../controller/auth/AuthController';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post('/login', controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);

  return router;
}
