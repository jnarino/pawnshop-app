import { useEffect, useState, useCallback } from 'react';
import { http } from '@/app/core/api/http';

interface CategoryNode {
  id: string;
  name: string;
  code: string;
  parentCode: string | null;
  children: CategoryNode[];
}

interface CategoryOption {
  code: string;
  name: string;
}

// Client-side cache at module level
let cachedTree: CategoryNode[] | null = null;
let pendingFetch: Promise<CategoryNode[]> | null = null;

async function fetchCategoriesTree(): Promise<CategoryNode[]> {
  if (cachedTree) {
    console.log('[CategoryCache] Using client-side cache with', cachedTree.length, 'root categories');
    return cachedTree;
  }

  if (pendingFetch) {
    console.log('[CategoryCache] Waiting for pending fetch...');
    return pendingFetch;
  }

  console.log('[CategoryCache] Fetching categories with JWT...');

  pendingFetch = http<CategoryNode[]>('/api/categories/tree')
    .then((data) => {
      console.log('[CategoryCache] Received', data.length, 'root categories');
      cachedTree = data;
      return data;
    })
    .catch(err => {
      console.error('[CategoryCache] Fetch error:', err);
      throw err;
    })
    .finally(() => {
      pendingFetch = null;
    });

  return pendingFetch;
}

export function invalidateCategoryCache() {
  cachedTree = null;
  pendingFetch = null;
}

export function useInventoryCategories() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useInventoryCategories] Hook initialized, fetching categories...');
    fetchCategoriesTree()
      .then(data => {
        console.log('[useInventoryCategories] Categories loaded successfully:', data.length, 'root nodes');
        setTree(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error('[useInventoryCategories] Failed to load categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load categories');
        setLoading(false);
      });
  }, []);

  // Top-level categories (e.g., JEWELRY, FIREARMS)
  const typeOptions: CategoryOption[] = tree.map(n => ({ code: n.code, name: n.name }));

  // Given a type code, return its children as options
  const subcat1OptionsFor = useCallback((typeCode: string): CategoryOption[] => {
    const node = tree.find(n => n.code === typeCode);
    if (!node) return [];
    return node.children.map(c => ({ code: c.code, name: c.name }));
  }, [tree]);

  // Given a sub1 code, return its children (e.g., brands or styles)
  const brandOptionsFor = useCallback((sub1Code: string): CategoryOption[] => {
    for (const typeNode of tree) {
      const sub1Node = typeNode.children.find(c => c.code === sub1Code);
      if (sub1Node) {
        return sub1Node.children.map(c => ({ code: c.code, name: c.name }));
      }
    }
    return [];
  }, [tree]);

  const refreshCache = useCallback(() => {
    invalidateCategoryCache();
    setLoading(true);
    setError(null);
    fetchCategoriesTree()
      .then(data => {
        setTree(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to refresh categories');
        setLoading(false);
      });
  }, []);

  return {
    loading,
    error,
    typeOptions,
    subcat1OptionsFor,
    brandOptionsFor,
    refreshCache
  };
}