"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCustomerUseCase = void 0;
class GetCustomerUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id) {
        return this.repo.findById(id);
    }
}
exports.GetCustomerUseCase = GetCustomerUseCase;
