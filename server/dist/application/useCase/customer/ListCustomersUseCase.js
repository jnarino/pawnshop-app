"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCustomersUseCase = void 0;
const errors_1 = require("../../errors");
const config_1 = require("../../../config");
class ListCustomersUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(params = {}) {
        const limit = params.limit ?? config_1.config.maxPageSize;
        const offset = params.offset ?? 0;
        if (limit < 1)
            throw new errors_1.ValidationError('limit must be >=1');
        if (offset < 0)
            throw new errors_1.ValidationError('offset must be >=0');
        if (limit > config_1.config.maxPageSize)
            throw new errors_1.ValidationError(`limit must be <= ${config_1.config.maxPageSize}`);
        return this.repo.findAll(limit, offset);
    }
}
exports.ListCustomersUseCase = ListCustomersUseCase;
