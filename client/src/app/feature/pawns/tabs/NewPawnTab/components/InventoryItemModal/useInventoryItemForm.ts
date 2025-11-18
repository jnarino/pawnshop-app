import { useState, useEffect, useCallback } from 'react';
import { useInventoryCategories } from '@/app/shared/hooks/useInventoryCategories';
import { useBarcodeScan } from '@/app/shared/hooks/useBarcodeScan';
import { useSubtypeMapping } from '@/app/shared/hooks/useSubtypeMapping';
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
  const categories = categoriesHook?.leafCategories || [];
  const isLoading = categoriesHook?.loading || false;
  const subtypes = useSubtypeMapping(draft.type);

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

  // Category suggestions
  const suggestions = categories.filter(cat =>
    cat?.name?.toLowerCase().includes(typeQuery.toLowerCase())
  ).slice(0, 10);

  // Category type detection
  const isJewelry = draft.type.toLowerCase().includes('jewelry');
  const isFirearm = draft.type.toLowerCase().includes('firearm');
  const isRing = isJewelry && draft.type.toLowerCase().includes('ring');

  // Karat options based on metal
  const karatOptions = draft.metal && KARAT_OPTIONS_BY_METAL[draft.metal.toLowerCase() as keyof typeof KARAT_OPTIONS_BY_METAL] || [];

  // Update field handler with uppercase conversion
  const updateField = useCallback((field: keyof InventoryItemDraft, value: any) => {
    let processedValue = value;
    
    if (typeof value === 'string' && field !== 'description' && field !== 'ownerNumber') {
      processedValue = value.toUpperCase();
    }
    
    setDraft(prev => ({ ...prev, [field]: processedValue }));
  }, []);

  // Type selection
  const selectType = useCallback((categoryName: string) => {
    updateField('type', categoryName);
    setTypeQuery(categoryName);
    setShowSuggestions(false);
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
    categories,
    suggestions,
    isLoading,
    subtypes,
    isJewelry,
    isFirearm,
    isRing,
    karatOptions,
    updateField,
    selectType,
    handleSubmit,
    handleMetalChange
  };
}
