import { useState, useEffect, useMemo, useCallback } from 'react';
import { getCategories } from '@/app/core/api/categoryApi';

export interface Category {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  path: string;
  depth?: number;
}

export function useInventoryCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const loadCategories = async () => {
      try {
        console.log('[useInventoryCategories] Loading categories...');
        const data = await getCategories();
        
        if (cancelled) return;
        
        if (!Array.isArray(data)) {
          console.error('[useInventoryCategories] Invalid categories data:', data);
          setError('Invalid categories data received');
          return;
        }
        
        console.log(`[useInventoryCategories] Categories loaded successfully: ${data.length} items`);
        setCategories(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        
        console.error('[useInventoryCategories] Failed to load categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCategories();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Memoized category lookups with proper error handling
  const categoryLookup = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      console.log('[CategoryLookup] No categories available for lookup');
      return {
        byId: new Map(),
        byCode: new Map(),
        byPath: new Map(),
        roots: [],
        leafCategories: []
      };
    }

    console.log(`[CategoryLookup] Building lookup for ${categories.length} categories`);
    
    const byId = new Map<string, Category>();
    const byCode = new Map<string, Category>();
    const byPath = new Map<string, Category>();
    const roots: Category[] = [];
    const leafCategories: Category[] = [];

    // ✅ Build lookup maps with validation
    categories.forEach((cat, index) => {
      if (!cat || typeof cat !== 'object') {
        console.warn(`[CategoryLookup] Invalid category at index ${index}:`, cat);
        return;
      }

      if (!cat.id) {
        console.warn(`[CategoryLookup] Category missing id at index ${index}:`, cat);
        return;
      }

      byId.set(cat.id, cat);
      
      if (cat.code) {
        byCode.set(cat.code, cat);
      }
      
      if (cat.path) {
        byPath.set(cat.path, cat);
      }
      
      if (!cat.parent_id) {
        roots.push(cat);
      }
    });

    // ✅ Find leaf categories (those with no children)
    categories.forEach(cat => {
      if (!cat.id) return;
      
      const hasChildren = categories.some(other => other.parent_id === cat.id);
      if (!hasChildren) {
        leafCategories.push(cat);
      }
    });

    console.log(`[CategoryLookup] Lookup built: ${byId.size} by ID, ${roots.length} roots, ${leafCategories.length} leaves`);
    
    return {
      byId,
      byCode, 
      byPath,
      roots,
      leafCategories
    };
  }, [categories]);

  // ✅ Safe lookup functions with null checks
  const getCategoryById = useCallback((id: string): Category | undefined => {
    if (!id || !categoryLookup.byId) {
      return undefined;
    }
    return categoryLookup.byId.get(id);
  }, [categoryLookup.byId]);

  const getCategoryByCode = useCallback((code: string): Category | undefined => {
    if (!code || !categoryLookup.byCode) {
      return undefined;
    }
    return categoryLookup.byCode.get(code);
  }, [categoryLookup.byCode]);

  const getCategoryByPath = useCallback((path: string): Category | undefined => {
    if (!path || !categoryLookup.byPath) {
      return undefined;
    }
    return categoryLookup.byPath.get(path);
  }, [categoryLookup.byPath]);

  // ✅ Safe category tree building
  const buildCategoryTree = useCallback((parentId: string | null = null): Category[] => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return [];
    }

    return categories
      .filter(cat => cat && cat.parent_id === parentId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [categories]);

  return {
    categories,
    loading,
    error,
    
    // Lookup functions
    getCategoryById,
    getCategoryByCode, 
    getCategoryByPath,
    
    // Computed categories
    rootCategories: categoryLookup.roots || [],
    leafCategories: categoryLookup.leafCategories || [],
    
    // Tree building
    buildCategoryTree,
    
    // Raw lookup maps (for advanced usage)
    categoryLookup
  };
}