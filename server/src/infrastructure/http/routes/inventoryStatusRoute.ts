import { Router } from 'express';
import { inventoryStatusController } from '../../../container';
import type { InventoryStatusController } from '../../../controller/inventory/inventoryStatusControllerFactory';

export function buildInventoryStatusRoute(controller: InventoryStatusController) {
  const router = Router();
  router.get('/', controller.list);
  router.post('/', controller.create);
  //router.delete('/:code', controller.remove);
  return router;
}

export default buildInventoryStatusRoute(inventoryStatusController);
