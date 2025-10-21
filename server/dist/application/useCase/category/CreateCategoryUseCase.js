"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCategoryUseCase = void 0;
class CreateCategoryUseCase {
    constructor(repo, cacheService) {
        this.repo = repo;
        this.cacheService = cacheService;
    }
    async execute(input) {
        // Create the category in database
        const result = await this.repo.create({
            name: input.name,
            code: input.code,
            parent_id: input.parentId || null
        });
        // Invalidate and refresh Redis cache
        await this.cacheService.invalidate();
        await this.cacheService.refreshCache();
        return { id: result.id };
    }
}
exports.CreateCategoryUseCase = CreateCategoryUseCase;
