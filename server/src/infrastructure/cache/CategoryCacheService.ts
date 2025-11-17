import type { CategoryRepository } from '../persistence/CategoryRepository';

export interface CachedCategory {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly parent_id: string | null;
  readonly path: string;
  readonly depth?: number; // ✅ Add optional depth property
}

export class CategoryCacheService {
  private readonly CACHE_TTL = 300000; // 5 minutes
  private cache: CachedCategory[] = [];
  private lastRefresh = 0;
  private isRefreshing = false;

  constructor(private readonly repo: CategoryRepository) {
    // ✅ Validate repository is provided
    if (!repo) {
      throw new Error('CategoryCacheService requires CategoryRepository');
    }
  }

  async getCategoriesTree(): Promise<CachedCategory[]> {
    const now = Date.now();
    const cacheExpired = now - this.lastRefresh > this.CACHE_TTL;
    const cacheEmpty = this.cache.length === 0;
    
    if ((cacheExpired || cacheEmpty) && !this.isRefreshing) {
      await this.refreshCache();
    }
    
    return [...this.cache]; // Return copy to prevent mutations
  }

  async refreshCache(): Promise<CachedCategory[]> {
    if (this.isRefreshing) {
      await this.waitForRefresh();
      return this.cache;
    }

    this.isRefreshing = true;
    
    try {
      console.log('[CategoryCache] Loading categories from database...');
      
      const categories = await this.repo.getAllAsTree();
      
      if (!Array.isArray(categories)) {
        throw new Error('Invalid categories data received from repository');
      }

      this.cache = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        code: cat.code,
        parent_id: cat.parent_id,
        path: cat.path,
        depth: cat.depth // ✅ Include depth in cached data
      }));
      
      this.lastRefresh = Date.now();
      
      console.log(`[CategoryCache] Successfully cached ${this.cache.length} categories`);
      return [...this.cache];
      
    } catch (error) {
      console.error('[CategoryCache] Failed to refresh cache:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async waitForRefresh(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (this.isRefreshing && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.warn('[CategoryCache] Timeout waiting for refresh to complete');
    }
  }

  clearCache(): void {
    this.cache = [];
    this.lastRefresh = 0;
    console.log('[CategoryCache] Cache cleared');
  }

  getCacheStats() {
    const now = Date.now();
    const isExpired = now - this.lastRefresh > this.CACHE_TTL;
    
    return {
      count: this.cache.length,
      lastRefresh: this.lastRefresh ? new Date(this.lastRefresh).toISOString() : 'Never',
      isExpired,
      isRefreshing: this.isRefreshing
    } as const;
  }

  async disconnect(): Promise<void> {
    console.log('[CategoryCache] Disconnect called (no-op for in-memory cache)');
  }
}
