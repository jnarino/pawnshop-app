import { Router } from 'express';
import { customerController } from '../../../container';

const router = Router();

router.get('/', customerController.list.bind(customerController));
router.get('/:id', customerController.get.bind(customerController));
router.post('/', customerController.create.bind(customerController));
router.put('/:id', customerController.update.bind(customerController));
router.delete('/:id', customerController.delete.bind(customerController));

export default router;