"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInventoryItemUseCase = void 0;
const inventoryValidation_1 = require("../../validation/inventoryValidation");
class CreateInventoryItemUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(input) {
        const cleaned = (0, inventoryValidation_1.validateCreateInventoryItem)(input);
        return this.repo.create(cleaned);
    }
}
exports.CreateInventoryItemUseCase = CreateInventoryItemUseCase;
