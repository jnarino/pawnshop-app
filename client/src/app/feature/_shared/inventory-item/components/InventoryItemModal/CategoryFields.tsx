import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItemDraft } from './types';
import { CategoryOption, createNewSubcategory } from '@/app/core/api/categoryApi';
import { Plus } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { useState, useRef, useEffect } from 'react';
import { useNewOptionModal } from '@/app/shared/hooks/useNewOptionModal';
import { useInventoryItemForm } from '../../hooks/useInventoryItemForm';

interface CategoryFieldsProps {
  readonly draft: InventoryItemDraft;
  readonly rootCategories: CategoryOption[];
  readonly subcategories: CategoryOption[];
  readonly isLoading: boolean;
  readonly disabled?: boolean;
  readonly handleCategoryChange: (categoryId: string) => void;
  readonly handleSubcategoryChange: (subcategoryId: string) => void;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
  readonly loadSubcategoriesAndBrands: () => Promise<void>;
  readonly showAddButton?: boolean;
  readonly autoFocus?: boolean;
}

export function CategoryFields({
  draft,
  rootCategories,
  subcategories,
  isLoading,
  disabled = false,
  handleCategoryChange,
  handleSubcategoryChange,
  loadSubcategoriesAndBrands,
  showAddButton = false,
  autoFocus = false
}: CategoryFieldsProps) {
  const categoryTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoFocus && !isLoading && !disabled && categoryTriggerRef.current) {
      // Small timeout to ensure DOM is ready and accessible logic has run
      const timer = setTimeout(() => {
        categoryTriggerRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, disabled, autoFocus]);

  const handleConfirmAdd = async (name: string) => {
    if (!draft.type || !name.trim()) return;

    try {
      const response = await createNewSubcategory({
        name,
        inventoryCategoryId: draft.type
      });
      if (response && response.id) {
        await loadSubcategoriesAndBrands();
        handleSubcategoryChange(response.id);
      }
    } catch (error) {
      console.error('Failed to create new option', error);
    }
  };

  const { NewOptionModalWrapper, setShowAddModal } = useNewOptionModal(handleConfirmAdd, "type");

  const handleOpenModal = (e: any) => {
    e.preventDefault();
    setShowAddModal(true)
  }

  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Category <span className="text-red-600">*</span>
        </Label>
        <Select
          value={draft.type}
          onValueChange={handleCategoryChange}
          disabled={isLoading || disabled}
        >
          <SelectTrigger
            ref={categoryTriggerRef}
            className="h-8 text-xs uppercase"
          >
            <SelectValue placeholder={isLoading ? "LOADING..." : "SELECT CATEGORY..."} />
          </SelectTrigger>
          <SelectContent>
            {rootCategories.length === 0 && !isLoading && (
              <SelectItem value="__empty__" disabled className="text-xs text-muted-foreground">
                No categories available
              </SelectItem>
            )}
            {rootCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} className="text-xs uppercase">
                {cat.name.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Type <span className="text-red-600">*</span>
        </Label>
        <div className='flex items-center w-full'>
          <Select
            value={draft.subcategoryId || ''}
            onValueChange={(value) => handleSubcategoryChange(value)}
            disabled={disabled || !draft.type}
          >
            <SelectTrigger className={`h-8 text-xs ${showAddButton ? "rounded-r-none rounded-l-lg" : "rounded-lg"}`}>
              <SelectValue placeholder="SELECT TYPE..." />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((subcat) => (
                <SelectItem key={subcat.id} value={subcat.id} className="text-xs uppercase">
                  {subcat.name.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showAddButton && (
            <Tooltip content={`Add type`}>
              <button className={`shrink-0 !p-0 h-8 w-8 border border-l-0 rounded-r-lg rounded-l-none ${disabled || !draft.type ? "cursor-not-allowed" : "cursor-pointer"} flex items-center justify-center`} disabled={disabled || !draft.type} onClick={handleOpenModal}>
                <Plus className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      <NewOptionModalWrapper />
    </>
  );
}
