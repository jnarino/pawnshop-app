"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCustomerUseCase = void 0;
class CreateCustomerUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(dto) {
        return this.repo.create(dto);
    }
}
exports.CreateCustomerUseCase = CreateCustomerUseCase;
