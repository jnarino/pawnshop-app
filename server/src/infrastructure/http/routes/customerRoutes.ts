import { Router } from 'express';
import { CustomerRepository } from '../../persistence/CustomerRepository';

const router = Router();
const customerRepo = new CustomerRepository();

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'Customer ID is required' });
        const updated = await customerRepo.update(id, req.body);
        if (!updated) return res.status(404).json({ error: 'Customer not found' });
        res.json({ id });
    } catch (err) {
        next(err);
    }
});

export default router;