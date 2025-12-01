import { http } from './http';

// ✅ Add request deduplication for category loading
let categoriesPromise: Promise<any[]> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export interface Category {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  path: string;
  depth: number;
}

export async function getCategories(): Promise<Category[]> {
  const now = Date.now();
  
  // ✅ Return cached promise if it's still fresh
  if (categoriesPromise && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('[CategoryAPI] Using cached categories');
    return categoriesPromise;
  }
  
  console.log('[CategoryAPI] Fetching fresh categories');
  lastFetchTime = now;
  
  categoriesPromise = http('/api/category/tree')
    .then((data: any[]) => {
      // Transform to ensure snake_case and handle both formats
      const transformed = data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        code: cat.code,
        parent_id: cat.parent_id ?? cat.parentId ?? null, // Handle both formats
        path: cat.path,
        depth: cat.depth ?? 0
      }));
      
      console.log('[CategoryAPI] Transformed categories:', {
        total: transformed.length,
        roots: transformed.filter((c: any) => !c.parent_id).length,
        sample: transformed[0]
      });
      
      return transformed;
    })
    .catch(error => {
      console.error('[CategoryAPI] Failed to load categories:', error);
      categoriesPromise = null;
      throw error;
    });
  
  return categoriesPromise;
}

export async function getCategoriesTree(): Promise<Category[]> {
  // ✅ Use the same endpoint since server returns tree structure
  return getCategories();
}

export function clearCategoriesCache(): void {
  categoriesPromise = null;
  lastFetchTime = 0;
}
