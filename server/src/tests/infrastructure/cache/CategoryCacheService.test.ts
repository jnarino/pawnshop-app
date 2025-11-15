import assert from 'assert';
import { CategoryCacheService } from '../../../infrastructure/cache/CategoryCacheService';
import { test } from '../../testHarness';

class MockCategoryRepository {
    private categories = [
        { id: '1', name: 'Electronics', code: 'ELEC', parent_id: null, path: 'ELEC' },
        { id: '2', name: 'Phones', code: 'PHONE', parent_id: '1', path: 'ELEC.PHONE' }
    ];

    async getAllAsTree() {
        return this.categories;
    }
}

test('CategoryCacheService: gets categories tree', async () => {
    const repo = new MockCategoryRepository();
    const cache = new CategoryCacheService(repo as any);
    
    const categories = await cache.getCategoriesTree();
    
    assert.strictEqual(categories.length, 2);
    assert.strictEqual(categories[0].name, 'Electronics');
    assert.strictEqual(categories[1].name, 'Phones');
});

test('CategoryCacheService: refreshes cache', async () => {
    const repo = new MockCategoryRepository();
    const cache = new CategoryCacheService(repo as any);
    
    const initialCategories = await cache.getCategoriesTree();
    const refreshedCategories = await cache.refreshCache();
    
    assert.deepStrictEqual(initialCategories, refreshedCategories);
});

test('CategoryCacheService: clears cache', async () => {
    const repo = new MockCategoryRepository();
    const cache = new CategoryCacheService(repo as any);
    
    await cache.getCategoriesTree(); // Populate cache
    cache.clearCache();
    
    const stats = cache.getCacheStats();
    assert.strictEqual(stats.count, 0);
    assert.strictEqual(stats.lastRefresh, 'Never');
});

test('CategoryCacheService: provides cache stats', async () => {
    const repo = new MockCategoryRepository();
    const cache = new CategoryCacheService(repo as any);
    
    const statsEmpty = cache.getCacheStats();
    assert.strictEqual(statsEmpty.count, 0);
    assert.strictEqual(statsEmpty.isRefreshing, false);
    
    await cache.getCategoriesTree();
    
    const statsPopulated = cache.getCacheStats();
    assert.strictEqual(statsPopulated.count, 2);
    assert.notStrictEqual(statsPopulated.lastRefresh, 'Never');
});

test('CategoryCacheService: returns copy to prevent mutations', async () => {
    const repo = new MockCategoryRepository();
    const cache = new CategoryCacheService(repo as any);
    
    const categories1 = await cache.getCategoriesTree();
    const categories2 = await cache.getCategoriesTree();
    
    // Modify one copy
    categories1.push({ id: '3', name: 'Test', code: 'TEST', parent_id: null, path: 'TEST' });
    
    // Other copy should be unchanged
    assert.notStrictEqual(categories1.length, categories2.length);
    assert.strictEqual(categories2.length, 2);
});
