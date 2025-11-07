import { useState, useEffect, useCallback, useRef } from 'react';
import { http } from '@/app/core/api/http';

// ✅ Define Category interface
interface Category {
  id: string;
  name: string;
  code: string;
  parentId?: string | null;
  path?: string;
  depth?: number;
  children?: Category[];
}

export function useCategoryLookup() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false); // ✅ Prevent duplicate loads

  useEffect(() => {
    if (loadedRef.current) return; // ✅ Only load once
    
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await http<Category[]>('/api/categories/tree');
        
        console.log('[CategoryLookup] Raw API response:', data);
        
        // ✅ Handle both flat array and nested structure
        let flatCategories: Category[] = [];
        
        if (Array.isArray(data)) {
          // If it's already a flat array, use it
          flatCategories = data;
        } else if (data && typeof data === 'object') {
          // If it's nested, flatten it
          flatCategories = flattenCategories([data]);
        }
        
        // ✅ Only get ROOT categories (no parentId)
        const rootCategories = flatCategories.filter(cat => !cat.parentId);
        
        // ✅ Remove duplicates by name (case-insensitive)
        const uniqueCategories = rootCategories.reduce((acc: Category[], cat) => {
          const existing = acc.find(existing => 
            existing.name.toUpperCase() === cat.name.toUpperCase()
          );
          if (!existing) {
            acc.push(cat);
          }
          return acc;
        }, []);
        
        // ✅ Sort alphabetically
        uniqueCategories.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('[CategoryLookup] Final categories:', uniqueCategories.map(c => ({ id: c.id, name: c.name, code: c.code })));
        
        setCategories(uniqueCategories);
        loadedRef.current = true; // ✅ Mark as loaded
      } catch (error) {
        console.error('[CategoryLookup] Failed to load categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []); // ✅ Empty dependency array

  // ✅ Memoize the lookup function to prevent recreation
  const getCategoryIdByPath = useCallback((path: string): string | null => {
    if (!path) return null;
    
    const category = categories.find(cat => 
      cat.name.toUpperCase() === path.toUpperCase() ||
      cat.code.toUpperCase() === path.toUpperCase()
    );
    
    return category?.id || null;
  }, [categories]);

  return {
    categories,
    loading,
    getCategoryIdByPath
  };
}

// ✅ Helper to flatten nested categories
function flattenCategories(categories: Category[]): Category[] {
  const result: Category[] = [];
  
  function flatten(cats: Category[]) {
    for (const cat of cats) {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        flatten(cat.children);
      }
    }
  }
  
  flatten(categories);
  return result;
}
