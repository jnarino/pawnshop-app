"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CustomerRepository_1 = require("../../persistence/CustomerRepository");
const router = (0, express_1.Router)();
const customerRepo = new CustomerRepository_1.CustomerRepository();
// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ error: 'Customer ID is required' });
        const updated = await customerRepo.update(id, req.body);
        if (!updated)
            return res.status(404).json({ error: 'Customer not found' });
        res.json({ id });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
