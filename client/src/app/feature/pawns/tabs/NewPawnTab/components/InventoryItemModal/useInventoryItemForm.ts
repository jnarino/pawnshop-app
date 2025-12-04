import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInventoryCategories } from '@/app/shared/hooks/useInventoryCategories';
import { useBarcodeScan } from '@/app/shared/hooks/useBarcodeScan';
import { KARAT_OPTIONS_BY_METAL } from '@/app/shared/constants/jewelry';
import { InventoryItemDraft, DEFAULT_ITEM } from './types';

interface UseInventoryItemFormProps {
  open: boolean;
  initial?: InventoryItemDraft | null;
  onSave: (item: InventoryItemDraft) => void;
}

export function useInventoryItemForm({ open, initial, onSave }: UseInventoryItemFormProps) {
  const [draft, setDraft] = useState<InventoryItemDraft>(DEFAULT_ITEM);
  const [error, setError] = useState<string | null>(null);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [typeQuery, setTypeQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const categoriesHook = useInventoryCategories();
  const allCategories = categoriesHook?.categories || []; // All categories with depth info
  const buildCategoryTree = categoriesHook?.buildCategoryTree;
  const isLoading = categoriesHook?.loading || false;

  const selectedCategory = useMemo(() => 
    allCategories.find(c => c.id === draft.type),
    [allCategories, draft.type]
  );
  
  // Get subtypes (children of selected category)
  const subtypes = useMemo(() => {
    if (!selectedCategory?.id || !buildCategoryTree) return [];
    return buildCategoryTree(selectedCategory.id).map(c => c.name);
  }, [selectedCategory, buildCategoryTree]);

  // Find selected subtype object
  const selectedSubtype = useMemo(() => 
    allCategories.find(c => 
      c.name.toUpperCase() === draft.sub1?.toUpperCase() && 
      c.parent_id === selectedCategory?.id
    ),
    [allCategories, draft.sub1, selectedCategory]
  );

  // Get brand options (children of selected subtype)
  const brandOptions = useMemo(() => {
    if (!selectedSubtype?.id || !buildCategoryTree) return [];
    return buildCategoryTree(selectedSubtype.id).map(c => c.name);
  }, [selectedSubtype, buildCategoryTree]);

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
      setTypeQuery(initial?.type || '');
      setError(null);
    }
  }, [open, initial]);

  // Category suggestions - use all categories
  const suggestions = allCategories.filter(cat =>
    cat?.name?.toLowerCase().includes(typeQuery.toLowerCase())
  ).slice(0, 10);

  const categoryName = selectedCategory?.name?.toLowerCase() || '';
  const isJewelry = categoryName.includes('jewelry');
  const isFirearm = categoryName.includes('firearm');
  const isRing = isJewelry && (categoryName.includes('ring') || draft.sub1?.toLowerCase().includes('ring'));

  // Karat options based on metal
  const karatOptions = draft.metal && KARAT_OPTIONS_BY_METAL[draft.metal.toLowerCase() as keyof typeof KARAT_OPTIONS_BY_METAL] || [];

  const updateField = useCallback((field: keyof InventoryItemDraft, value: any) => {
    let processedValue = value;
    
    // Don't uppercase: description, ownerNumber, type, metal, karat (these need exact matching)
    if (typeof value === 'string' && field !== 'description' && field !== 'ownerNumber' && field !== 'type' && field !== 'metal' && field !== 'karat') {
      processedValue = value.toUpperCase();
    }
    
    setDraft(prev => ({ ...prev, [field]: processedValue }));
  }, []);

  // Type selection
  const selectType = useCallback((categoryName: string) => {
    updateField('type', categoryName);
    updateField('sub1', ''); // Clear subtype
    updateField('brand', ''); // Clear brand
    updateField('style', ''); // Clear style
    setTypeQuery(categoryName);
    setShowSuggestions(false);
  }, [updateField]);

  // Subtype selection
  const handleSubtypeChange = useCallback((subtype: string) => {
    updateField('sub1', subtype);
    updateField('brand', ''); // Clear brand
    updateField('style', ''); // Clear style
  }, [updateField]);

  // Barcode scanning
  useBarcodeScan({
    enabled: barcodeMode,
    onBarcode: (code) => {
      updateField('serial', code);
      setBarcodeMode(false);
    },
    allowRegex: /^[A-Z0-9\-]+$/i
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
    if (!metal) {
      updateField('metal', '');
      updateField('karat', '');
      return;
    }

    const metalKey = metal as keyof typeof KARAT_OPTIONS_BY_METAL;
    const karatOptions = KARAT_OPTIONS_BY_METAL[metalKey] || [];
    
    updateField('metal', metal.toUpperCase());
    
    if (karatOptions.length > 0) {
      updateField('karat', karatOptions[0]);
    } else {
      updateField('karat', '');
    }
  }, [updateField]);

  return {
    draft,
    error,
    barcodeMode,
    setBarcodeMode,
    typeQuery,
    setTypeQuery,
    showSuggestions,
    setShowSuggestions,
    categories: allCategories, // Return all categories, not just root
    suggestions,
    isLoading,
    subtypes,
    brandOptions,
    isJewelry,
    isFirearm,
    isRing,
    karatOptions,
    updateField,
    selectType,
    handleSubtypeChange,
    handleSubmit,
    handleMetalChange,
  };
}
