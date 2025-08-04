import { Router } from 'express';
import {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from '../controller/customerController';

const router = Router();

// GET /api/customer/        → list all customers
router.get('/', getAllCustomers);

// GET /api/customer/:id     → get one customer by ID
router.get('/:id', getCustomerById);

// POST /api/customer/       → create a new customer
router.post('/', createCustomer);

// PUT /api/customer/:id     → update an existing customer
router.put('/:id', updateCustomer);

// DELETE /api/customer/:id  → delete a customer
router.delete('/:id', deleteCustomer);

export default router;
