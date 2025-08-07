"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCustomerUseCase = void 0;
class UpdateCustomerUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id, dto) {
        return this.repo.update(id, dto);
    }
}
exports.UpdateCustomerUseCase = UpdateCustomerUseCase;
