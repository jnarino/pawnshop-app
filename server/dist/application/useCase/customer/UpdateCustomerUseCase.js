"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCustomerUseCase = void 0;
class UpdateCustomerUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id, partial) {
        return this.repo.update(id, partial);
    }
}
exports.UpdateCustomerUseCase = UpdateCustomerUseCase;
