"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInventoryStatusesUseCase = void 0;
class ListInventoryStatusesUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute() {
        return this.repo.list();
    }
}
exports.ListInventoryStatusesUseCase = ListInventoryStatusesUseCase;
