import { useState, useEffect, useCallback } from 'react';
import { useBarcodeScan } from '@/app/shared/hooks/useBarcodeScan';
import { InventoryItemDraft, DEFAULT_ITEM } from '../components/InventoryItemModal/types';
import { getRootCategories, getSubcategories, getBrands, CategoryOption } from '@/app/core/api/categoryApi';

interface UseInventoryItemFormProps {
  open: boolean;
  initial?: InventoryItemDraft | null;
  onSave: (item: InventoryItemDraft) => void;
}

export function useInventoryItemForm({ open, initial, onSave }: UseInventoryItemFormProps) {
  const [draft, setDraft] = useState<InventoryItemDraft>(DEFAULT_ITEM);
  const [error, setError] = useState<string | null>(null);
  const [barcodeMode, setBarcodeMode] = useState(false);

  const [rootCategories, setRootCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    const loadRootCategories = async () => {
      try {
        setIsLoading(true);
        const data = await getRootCategories();
        if (!cancelled) {
          setRootCategories(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load categories');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadRootCategories();
    
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draft.type) {
      setSubcategories([]);
      setBrands([]);
      return;
    }

    let cancelled = false;
    
    const loadSubcategoriesAndBrands = async () => {
      try {
        const [subcategoriesData, brandsData] = await Promise.all([
          getSubcategories(draft.type),
          getBrands(draft.type)
        ]);
        
        if (!cancelled) {
          setSubcategories(subcategoriesData);
          setBrands(brandsData);
        }
      } catch (err) {
        if (!cancelled) {
          setSubcategories([]);
          setBrands([]);
          if (err instanceof Error) {
            console.error('Failed to load subcategories and brands:', err.message);
          }
        }
      }
    };

    loadSubcategoriesAndBrands();
    
    return () => {
      cancelled = true;
    };
  }, [draft.type]);

  // Initialize form data
  useEffect(() => {
    if (open) {
      const formData = initial ? {
        ...DEFAULT_ITEM,
        ...initial,
        condition: initial.condition || '',
        gender: initial.gender || '',
        weightUnit: initial.weightUnit || 'Grams'
      } : {
        ...DEFAULT_ITEM,
        condition: '',
        gender: '',
        weightUnit: 'Grams'
      };
      setDraft(formData);
      setError(null);
    }
  }, [open, initial]);

  const selectedRootCategory = rootCategories.find(c => c.id === draft.type);
  const categoryName = selectedRootCategory?.name?.toLowerCase() || '';
  const isJewelry = categoryName.includes('jewelry');
  const isFirearm = categoryName.includes('firearm');
  const isRing = isJewelry && (categoryName.includes('ring') || (draft.subcategoryName?.toLowerCase().includes('ring') ?? false));

  const updateField = useCallback((field: keyof InventoryItemDraft, value: any) => {
    let processedValue = value;
    
    // Don't uppercase IDs, description, or fields that store lookup IDs
    const noUppercaseFields = ['description', 'ownerNumber', 'type', 'metal', 'karat', 'gender', 'sizeLength', 'color', 'caliber', 'action'];
    if (typeof value === 'string' && !noUppercaseFields.includes(field)) {
      processedValue = value.toUpperCase();
    }
    
    setDraft(prev => ({ ...prev, [field]: processedValue }));
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    const category = rootCategories.find(c => c.id === categoryId);
    setDraft(prev => ({
      ...prev,
      type: categoryId,
      categoryName: category?.name || '',
      subcategoryId: '',
      subcategoryName: '',
      brandId: '',
      brandName: '',
      sub1: '',
      brand: ''
    }));
    setSubcategories([]);
    setBrands([]);
  }, [rootCategories]);

  const handleSubcategoryChange = useCallback((subcategoryId: string) => {
    const subcategory = subcategories.find(s => s.id === subcategoryId);
    setDraft(prev => ({
      ...prev,
      subcategoryId,
      subcategoryName: subcategory?.name || '',
      sub1: subcategory?.name || '',
      brandId: '',
      brandName: '',
      brand: '',
      style: ''
    }));
  }, [subcategories]);

  const handleBrandChange = useCallback((brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    setDraft(prev => ({
      ...prev,
      brandId,
      brandName: brand?.name || '',
      brand: brand?.name || ''
    }));
  }, [brands]);

  // Barcode scanning
  useBarcodeScan({
    enabled: barcodeMode,
    onBarcode: (code) => {
      updateField('serial', code);
      setBarcodeMode(false);
    },
    allowRegex: /^[A-Z0-9-]+$/i
  });

  // Form validation and submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!draft.type.trim()) {
      setError('Type is required');
      return;
    }

    if (!draft.amount) {
      setError('Value is required');
      return;
    }

    if (isJewelry && (!draft.metal || !draft.karat || !draft.weight)) {
      setError('Metal, Karat and Weight are required for jewelry');
      return;
    }

    const itemData = {
      ...draft,
      id: draft.id || crypto.randomUUID()
    };

    onSave(itemData);
  }, [draft, isJewelry, onSave]);

  // Auto-fill karat when metal changes
  const handleMetalChange = useCallback((metal: string) => {
    updateField('metal', metal || '');
    updateField('karat', '');
  }, [updateField]);

  return {
    draft,
    error,
    barcodeMode,
    setBarcodeMode,
    rootCategories,
    subcategories,
    brands,
    isLoading,
    isJewelry,
    isFirearm,
    isRing,
    updateField,
    handleCategoryChange,
    handleSubcategoryChange,
    handleBrandChange,
    handleSubmit,
    handleMetalChange,
  };
}
