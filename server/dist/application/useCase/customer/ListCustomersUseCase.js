"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCustomersUseCase = void 0;
const pagination_1 = require("../../validation/pagination");
class ListCustomersUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(params = {}) {
        const { limit, offset } = (0, pagination_1.validatePagination)(params);
        const filters = {};
        if (params.firstName)
            filters.firstName = params.firstName.trim();
        if (params.lastName)
            filters.lastName = params.lastName.trim();
        if (params.dateOfBirth)
            filters.dateOfBirth = params.dateOfBirth.trim();
        return this.repo.findAll(limit, offset, filters);
    }
}
exports.ListCustomersUseCase = ListCustomersUseCase;
