import { CategoryRepository } from '../../../infrastructure/persistence/CategoryRepository';
import { CategoryCacheService } from '../../../infrastructure/cache/CategoryCacheService';

export interface CreateCategoryInput {
  name: string;
  code: string;
  parentId?: string;
}

export class CreateCategoryUseCase {
  constructor(
    private repo: CategoryRepository,
    private cacheService: CategoryCacheService
  ) {}

  async execute(input: CreateCategoryInput): Promise<{ id: string }> {
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
