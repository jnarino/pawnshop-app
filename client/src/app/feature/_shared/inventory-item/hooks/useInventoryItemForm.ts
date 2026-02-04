import { useState, useEffect, useCallback } from 'react';
import { useBarcodeScan } from '@/app/shared/hooks/useBarcodeScan';
import { InventoryItemDraft, DEFAULT_ITEM } from '../components/InventoryItemModal/types';
import { getRootCategories, getSubcategories, getBrands, CategoryOption } from '@/app/core/api/categoryApi';
import { ViewMode } from '@/app/feature/_shared/types/viewMode';

interface UseInventoryItemFormProps {
  open: boolean;
  initial?: InventoryItemDraft | null;
  onSave: (item: InventoryItemDraft) => void;
  mode?: ViewMode;
}

export function useInventoryItemForm({ open, initial, onSave, mode = ViewMode.CREATE }: UseInventoryItemFormProps) {
  const [draft, setDraft] = useState<InventoryItemDraft>(DEFAULT_ITEM);
  const [error, setError] = useState<string | null>(null);
  const [barcodeMode, setBarcodeMode] = useState(false);

  const [rootCategories, setRootCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === ViewMode.VIEW) {
      if (initial) {
        if (initial.type && initial.categoryName) {
          setRootCategories([{ id: initial.type, name: initial.categoryName }]);
        }
        if (initial.subcategoryId && initial.subcategoryName) {
          setSubcategories([{ id: initial.subcategoryId, name: initial.subcategoryName }]);
        }
        if (initial.brandId && (initial.brandName || initial.brand)) {
          const brandName = (initial.brandName || (typeof initial.brand === 'string' ? initial.brand : initial.brand?.name) || '').trim();
          setBrands([{ id: initial.brandId, name: brandName }]);
        }
      }
    }

    let cancelled = false;

    const loadCategoriesAndInitialData = async () => {
      try {
        setIsLoading(true);

        // Load root categories
        const rootCategoriesData = await getRootCategories();
        if (cancelled) return;
        setRootCategories(rootCategoriesData);

        // For MODIFY mode with initial data, pre-load subcategories and brands
        if (mode === ViewMode.MODIFY && initial?.type) {
          const [subcategoriesData, brandsData] = await Promise.all([
            getSubcategories(initial.type),
            getBrands(initial.type)
          ]);

          if (cancelled) return;
          setSubcategories(subcategoriesData);

          // Ensure initial brand is in the list even if missing from API
          let finalBrands = brandsData;
          if (initial.brandId && !brandsData.find(b => b.id === initial.brandId)) {
            const brandName = (initial.brandName || (typeof initial.brand === 'string' ? initial.brand : initial.brand?.name) || 'Selected Brand').trim();
            finalBrands = [...brandsData, { id: initial.brandId, name: brandName }];
          }
          setBrands(finalBrands);
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

    loadCategoriesAndInitialData();

    return () => {
      cancelled = true;
    };
  }, [mode, initial]);

  const loadSubcategoriesAndBrands = async () => {
    console.log('Loading subcategories and brands...');
    try {
      const [subcategoriesData, brandsData] = await Promise.all([
        getSubcategories(draft.type),
        getBrands(draft.type)
      ]);
      setSubcategories(subcategoriesData);
      setBrands(brandsData);
    } catch (err) {
      setSubcategories([]);
      setBrands([]);
      if (err instanceof Error) {
        console.error('Failed to load subcategories and brands:', err.message);
      }
    }
  };

  useEffect(() => {
    if (mode === ViewMode.VIEW) {
      return;
    }

    if (!draft.type) {
      setSubcategories([]);
      setBrands([]);
      return;
    }

    // In MODIFY mode, skip if this is the initial type (already loaded in first effect)
    if (mode === ViewMode.MODIFY && initial?.type === draft.type && subcategories.length > 0) {
      return;
    }

    loadSubcategoriesAndBrands();

  }, [draft.type, mode]);

  // Initialize form data
  useEffect(() => {
    if (open) {
      const formData = initial ? {
        ...DEFAULT_ITEM,
        ...initial,
        condition: initial.condition || '',
        gender: initial.gender,
        weightUnit: initial.weightUnit || 'Grams'
      } : {
        ...DEFAULT_ITEM,
        condition: '',
        gender: undefined,
        weightUnit: 'Grams'
      };
      console.log('useInventoryItemForm', { formData, initial });
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
    // Don't uppercase IDs, description, or fields that store lookup IDs
    const noUppercaseFields = ['description', 'ownerNumber', 'type', 'metal', 'karat', 'gender', 'sizeLength', 'color', 'caliber', 'action', 'style', 'stones', 'brandId', 'subcategoryId'];
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
      brand: undefined
    }));
    setSubcategories([]);
    setBrands([]);
  }, [rootCategories]);

  const handleSubcategoryChange = useCallback((subcategoryId: string) => {
    if (!subcategoryId) return;
    const subcategory = subcategories.find(s => s.id === subcategoryId);
    console.log('handle subcategory change', subcategoryId);
    setDraft(prev => ({
      ...prev,
      subcategoryId,
      subcategoryName: subcategory?.name || '',
      sub1: subcategory?.name || '',
      brandId: '',
      brandName: '',
      brand: undefined,
      style: undefined
    }));
  }, [subcategories]);

  const handleBrandChange = useCallback((brandId: string, explicitBrand?: CategoryOption) => {
    if (!brandId) return;
    const brand = explicitBrand || brands.find(b => b.id === brandId);
    setDraft(prev => ({
      ...prev,
      brandId,
      brandName: brand?.name || '',
      brand: brand
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

    console.log('draft', draft);

    if (!draft.type.trim()) {
      setError('Type is required');
      return;
    }

    if (!draft.subcategoryId?.trim()) {
      setError('Subcategory is required');
      return;
    }

    if (!draft.brand?.id?.trim()) {
      setError('Brand is required');
      return;
    }

    if (!draft.color?.id) {
      setError('Color is required');
      return;
    }

    if (isJewelry && (!draft.metal?.id?.trim() || !draft.weight || !draft.gender?.id || !draft.style?.id || !draft.sizeLength)) {
      setError('Metal, Weight, Gender, Style and Size are required for jewelry');
      return;
    }

    if (isFirearm && (!draft.caliber?.id || !draft.finish?.id || !draft.action?.id || !draft.barrel?.id || !draft.importer?.id)) {
      setError('Caliber, Finish, Action, Barrel and Importer are required for firearms');
      return;
    }

    const itemData = {
      ...draft,
      id: draft.id || crypto.randomUUID()
    };

    onSave(itemData);
  }, [draft, isJewelry, onSave]);

  // Auto-fill karat when metal changes
  const handleMetalChange = useCallback((metal: any) => {
    updateField('metal', metal);
    updateField('karat', null);
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
    loadSubcategoriesAndBrands,
    updateField,
    handleCategoryChange,
    handleSubcategoryChange,
    handleBrandChange,
    handleSubmit,
    handleMetalChange,
  };
}
