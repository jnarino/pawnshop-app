"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteInventoryItemUseCase = void 0;
class DeleteInventoryItemUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id) { return this.repo.delete(id); }
}
exports.DeleteInventoryItemUseCase = DeleteInventoryItemUseCase;
