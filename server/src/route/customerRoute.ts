// server/src/route/customerRoute.ts
import { Router } from 'express';
import { customerController } from '../container';  // <— where your factory was wired

const router = Router();

// GET /api/customer/        → list all customers
router.get('/', customerController.getAll);

// GET /api/customer/:id     → get one customer by ID
router.get('/:id', customerController.getById);

// POST /api/customer/       → create a new customer
router.post('/', customerController.create);

// PUT /api/customer/:id     → update an existing customer
router.put('/:id', customerController.update);

// DELETE /api/customer/:id  → delete a customer
router.delete('/:id', customerController.delete);

export default router;
