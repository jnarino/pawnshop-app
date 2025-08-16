"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetInventoryItemUseCase = void 0;
class GetInventoryItemUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id) { return this.repo.findById(id); }
}
exports.GetInventoryItemUseCase = GetInventoryItemUseCase;
