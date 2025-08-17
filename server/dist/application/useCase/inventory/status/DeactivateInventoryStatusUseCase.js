"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeactivateInventoryStatusUseCase = void 0;
const errors_1 = require("../../../errors");
class DeactivateInventoryStatusUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(code) {
        if (!code)
            throw new errors_1.ValidationError('code required');
        const existing = await this.repo.find(code);
        if (!existing)
            throw new errors_1.ValidationError('status not found');
        if (existing.isTerminal) {
            // Allow deactivation of terminal statuses? We'll allow but could restrict.
        }
        await this.repo.deactivate(code);
    }
}
exports.DeactivateInventoryStatusUseCase = DeactivateInventoryStatusUseCase;
