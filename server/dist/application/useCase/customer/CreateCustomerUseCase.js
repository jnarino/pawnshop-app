"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCustomerUseCase = void 0;
const customerValidation_1 = require("../../validation/customerValidation");
class CreateCustomerUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(input) {
        const cleaned = (0, customerValidation_1.validateNewCustomer)(input);
        return this.repo.create(cleaned);
    }
}
exports.CreateCustomerUseCase = CreateCustomerUseCase;
