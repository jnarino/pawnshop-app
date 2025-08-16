"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInventoryItemUseCase = void 0;
const inventoryValidation_1 = require("../../validation/inventoryValidation");
class UpdateInventoryItemUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id, partial) {
        const cleaned = (0, inventoryValidation_1.validateUpdateInventoryItem)(partial);
        return this.repo.update(id, cleaned);
    }
}
exports.UpdateInventoryItemUseCase = UpdateInventoryItemUseCase;
