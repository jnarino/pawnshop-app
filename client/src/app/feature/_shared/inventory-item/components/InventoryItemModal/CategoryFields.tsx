import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItemDraft } from './types';
import { CategoryOption } from '@/app/core/api/categoryApi';
import { Plus } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface CategoryFieldsProps {
  readonly draft: InventoryItemDraft;
  readonly rootCategories: CategoryOption[];
  readonly subcategories: CategoryOption[];
  readonly isLoading: boolean;
  readonly disabled?: boolean;
  readonly handleCategoryChange: (categoryId: string) => void;
  readonly handleSubcategoryChange: (subcategoryId: string) => void;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
  readonly showAddButton?: boolean;
}

export function CategoryFields({
  draft,
  rootCategories,
  subcategories,
  isLoading,
  disabled = false,
  handleCategoryChange,
  handleSubcategoryChange,
  showAddButton = false
}: CategoryFieldsProps) {
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
          <SelectTrigger className="h-8 text-xs uppercase">
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
            onValueChange={handleSubcategoryChange}
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
              <button className={`shrink-0 !p-0 h-8 w-8 border border-l-0 rounded-r-lg rounded-l-none ${disabled || !draft.type ? "cursor-not-allowed" : "cursor-pointer"} flex items-center justify-center`} disabled={disabled || !draft.type}>
                <Plus className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
}
