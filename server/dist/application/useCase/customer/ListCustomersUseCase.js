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
        return this.repo.findAll(limit, offset);
    }
}
exports.ListCustomersUseCase = ListCustomersUseCase;
