import type { CategoryCacheService } from '../../../infrastructure/cache/CategoryCacheService';

// ✅ Define return type that matches what the cache returns
export interface CategoryNode {
    id: string;
    name: string;
    code: string;
    parent_id: string | null;
    path: string;
    depth?: number;
}

export class ListCategoriesTreeUseCase {
    constructor(private readonly cacheService: CategoryCacheService) {
        if (!cacheService) {
            throw new Error('ListCategoriesTreeUseCase requires CategoryCacheService');
        }
    }

    async execute(): Promise<CategoryNode[]> {
        try {
            console.log('[ListCategoriesTreeUseCase] Executing...');
            
            if (!this.cacheService || typeof this.cacheService.getCategoriesTree !== 'function') {
                throw new Error('CategoryCacheService is not properly initialized');
            }
            
            const categories = await this.cacheService.getCategoriesTree();
            
            if (!Array.isArray(categories)) {
                console.error('[ListCategoriesTreeUseCase] Categories is not an array:', categories);
                throw new Error('Invalid categories data received from cache');
            }
            
            console.log(`[ListCategoriesTreeUseCase] Retrieved ${categories.length} categories`);
            
            // ✅ Transform to match expected return type
            const nodes: CategoryNode[] = categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                code: cat.code,
                parent_id: cat.parent_id,
                path: cat.path,
                depth: cat.depth
            }));
            
            return nodes;
        } catch (error) {
            console.error('[ListCategoriesTreeUseCase] Failed to get categories:', error);
            throw new Error(`Failed to load categories: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}