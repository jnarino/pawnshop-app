import type { CategoryCacheService } from '../../../infrastructure/cache/CategoryCacheService';

// ✅ Define return type that matches what the cache returns
export interface CategoryNode {
    id: string;
    name: string;
    code: string;
    parent_id: string | null;
    path: string;
    depth?: number;
    parentCode?: string;
    children?: CategoryNode[];
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
            const categories = await this.cacheService.getCategoriesTree();
            console.log(`[ListCategoriesTreeUseCase] Retrieved ${categories.length} categories`);
            
            // ✅ Transform to match expected return type
            const nodes: CategoryNode[] = categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                code: cat.code,
                parent_id: cat.parent_id,
                path: cat.path,
                depth: cat.depth,
                parentCode: undefined, // Can be computed if needed
                children: [] // Can be populated if tree structure needed
            }));
            
            return nodes;
        } catch (error) {
            console.error('[ListCategoriesTreeUseCase] Failed to get categories:', error);
            throw error;
        }
    }
}