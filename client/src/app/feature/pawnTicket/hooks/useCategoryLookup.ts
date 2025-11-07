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
        setCategories(data || []);
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
