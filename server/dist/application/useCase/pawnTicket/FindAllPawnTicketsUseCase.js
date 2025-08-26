"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindAllPawnTicketsUseCase = void 0;
class FindAllPawnTicketsUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    execute(limit, offset, filters) {
        return this.repo.findAll(limit, offset, filters);
    }
}
exports.FindAllPawnTicketsUseCase = FindAllPawnTicketsUseCase;
