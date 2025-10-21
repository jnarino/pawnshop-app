import { useEffect, useState } from 'react';

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
let cachePromise: Promise<CategoryNode[]> | null = null;

async function fetchCategoriesTree(): Promise<CategoryNode[]> {
  // If we already have cached data, return it immediately
  if (cachedTree) {
    console.log('[CategoryCache] Using client-side cache');
    return cachedTree;
  }

  // If a fetch is already in progress, wait for it
  if (cachePromise) {
    return cachePromise;
  }

  // Start a new fetch (Redis will handle server-side caching)
  cachePromise = fetch('/api/categories/tree')
    .then(r => {
      if (!r.ok) throw new Error('Failed to load categories');
      return r.json();
    })
    .then((data: CategoryNode[]) => {
      cachedTree = data;
      cachePromise = null;
      console.log('[CategoryCache] Client cache populated with', data.length, 'root categories');
      return data;
    })
    .catch(err => {
      cachePromise = null;
      throw err;
    });

  return cachePromise;
}

// Function to invalidate client cache (call after creating new categories)
export function invalidateCategoryCache() {
  console.log('[CategoryCache] Client cache invalidated');
  cachedTree = null;
  cachePromise = null;
}

export function useInventoryCategories() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchCategoriesTree()
      .then(data => {
        setTree(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  // Top-level categories (e.g., JEWELRY, FIREARMS)
  const typeOptions: CategoryOption[] = tree.map(n => ({ code: n.code, name: n.name }));

  // Given a type code, return its children as options
  const subcat1OptionsFor = (typeCode: string): CategoryOption[] => {
    const node = tree.find(n => n.code === typeCode);
    if (!node) return [];
    return node.children.map(c => ({ code: c.code, name: c.name }));
  };

  // Given a sub1 code, return its children (e.g., brands or styles)
  const brandOptionsFor = (sub1Code: string): CategoryOption[] => {
    for (const typeNode of tree) {
      const sub1Node = typeNode.children.find(c => c.code === sub1Code);
      if (sub1Node) {
        return sub1Node.children.map(c => ({ code: c.code, name: c.name }));
      }
    }
    return [];
  };

  return {
    loading,
    error,
    typeOptions,
    subcat1OptionsFor,
    brandOptionsFor,
    refreshCache: () => {
      invalidateCategoryCache();
      setLoading(true);
      fetchCategoriesTree()
        .then(data => {
          setTree(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
        });
    }
  };
}