"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchPawnTicketsUseCase = void 0;
const errors_1 = require("../../errors");
class SearchPawnTicketsUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(filters) {
        if (filters.startDate && isNaN(Date.parse(filters.startDate)))
            throw new errors_1.ValidationError('invalid startDate');
        if (filters.endDate && isNaN(Date.parse(filters.endDate)))
            throw new errors_1.ValidationError('invalid endDate');
        if (filters.limit !== undefined && (filters.limit <= 0 || filters.limit > 200))
            throw new errors_1.ValidationError('invalid limit');
        if (filters.offset !== undefined && filters.offset < 0)
            throw new errors_1.ValidationError('invalid offset');
        return this.repo.search(filters);
    }
}
exports.SearchPawnTicketsUseCase = SearchPawnTicketsUseCase;
