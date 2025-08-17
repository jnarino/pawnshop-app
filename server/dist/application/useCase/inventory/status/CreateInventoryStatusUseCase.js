"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInventoryStatusUseCase = void 0;
const errors_1 = require("../../../errors");
class CreateInventoryStatusUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(dto) {
        if (!dto.code || !/^[a-z0-9_]+$/.test(dto.code))
            throw new errors_1.ValidationError('invalid code');
        dto.code = dto.code.toLowerCase();
        const existing = await this.repo.find(dto.code);
        if (existing)
            throw new errors_1.ValidationError('status code already exists');
        await this.repo.insert({
            code: dto.code,
            description: dto.description,
            isTerminal: !!dto.isTerminal,
            sortOrder: dto.sortOrder ?? 100,
        });
    }
}
exports.CreateInventoryStatusUseCase = CreateInventoryStatusUseCase;
