import { Router } from 'express';
import { inventoryController } from '../../../container';
import type { InventoryController } from '../../../controller/inventory/inventoryControllerFactory';

export function buildInventoryRoute(controller: InventoryController) {
	const router = Router();
	router.get('/', controller.list);
	router.get('/:id', controller.get);
	router.post('/', controller.create);
	router.put('/:id', controller.update);
	router.delete('/:id', controller.delete);
	return router;
}

// Default route wired with container-managed controller
export default buildInventoryRoute(inventoryController);
