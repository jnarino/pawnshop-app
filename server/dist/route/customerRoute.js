"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/route/customerRoute.ts
const express_1 = require("express");
const container_1 = require("../container"); // wired controller
const router = (0, express_1.Router)();
// GET /api/customer/        → list all customers
router.get('/', container_1.customerController.list);
// GET /api/customer/:id     → get one customer by ID
router.get('/:id', container_1.customerController.get);
// POST /api/customer/       → create a new customer
router.post('/', container_1.customerController.create);
// PUT /api/customer/:id     → update an existing customer
router.put('/:id', container_1.customerController.update);
// DELETE /api/customer/:id  → delete a customer
router.delete('/:id', container_1.customerController.remove);
exports.default = router;
