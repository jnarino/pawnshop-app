"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPawnTicketUseCase = void 0;
class GetPawnTicketUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id) { return this.repo.findById(id); }
}
exports.GetPawnTicketUseCase = GetPawnTicketUseCase;
