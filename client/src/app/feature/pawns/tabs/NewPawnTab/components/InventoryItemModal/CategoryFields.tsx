import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItemDraft } from './types';
import { CategoryOption } from '@/app/core/api/categoryApi';

interface CategoryFieldsProps {
  draft: InventoryItemDraft;
  rootCategories: CategoryOption[];
  subcategories: CategoryOption[];
  isLoading: boolean;
  handleCategoryChange: (categoryId: string) => void;
  handleSubcategoryChange: (subcategoryId: string) => void;
  updateField: (field: keyof InventoryItemDraft, value: any) => void;
}

export function CategoryFields({
  draft,
  rootCategories,
  subcategories,
  isLoading,
  handleCategoryChange,
  handleSubcategoryChange,
  updateField
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
          disabled={isLoading}
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
        <Label className="text-xs font-semibold">Type</Label>
        {subcategories.length > 0 ? (
          <Select 
            value={draft.subcategoryId || ''} 
            onValueChange={handleSubcategoryChange}
          >
            <SelectTrigger className="h-8 text-xs">
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
        ) : (
          <Input
            value={draft.subcategoryName || ''}
            onChange={(e) => updateField('subcategoryName', e.target.value.toUpperCase())}
            placeholder="ENTER TYPE"
            className="uppercase text-xs h-8"
            disabled={!draft.type}
          />
        )}
      </div>
    </>
  );
}
