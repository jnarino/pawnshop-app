"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCustomersUseCase = void 0;
class ListCustomersUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute() {
        return this.repo.findAll();
    }
}
exports.ListCustomersUseCase = ListCustomersUseCase;
