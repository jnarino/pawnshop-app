"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletePawnTicketUseCase = void 0;
const errors_1 = require("../../errors");
class DeletePawnTicketUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id) {
        if (!id)
            throw new errors_1.ValidationError('id required');
        return this.repo.delete(id);
    }
}
exports.DeletePawnTicketUseCase = DeletePawnTicketUseCase;
