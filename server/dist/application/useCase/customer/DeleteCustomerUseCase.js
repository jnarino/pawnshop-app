"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCustomerUseCase = void 0;
class DeleteCustomerUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id) {
        return this.repo.delete(id);
    }
}
exports.DeleteCustomerUseCase = DeleteCustomerUseCase;
