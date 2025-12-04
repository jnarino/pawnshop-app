import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItemDraft } from './types';

interface CategoryFieldsProps {
  draft: InventoryItemDraft;
  subtypes: string[];
  updateField: (field: keyof InventoryItemDraft, value: any) => void;
  allCategories: Array<{ id: string; name: string; code: string; parent_id: string | null; depth?: number }>;

  isLoading: boolean;
  handleSubtypeChange?: (value: string) => void;
}

export function CategoryFields({
  draft,
  subtypes,
  updateField,
  allCategories,
  isLoading,
  handleSubtypeChange
}: CategoryFieldsProps) {
  // Filter only root categories (parent_id is null)
  const rootCategories = allCategories.filter(cat => !cat.parent_id);

  const selectCategory = (categoryId: string) => {
    updateField('type', categoryId);
    updateField('sub1', '');
  };

  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Category <span className="text-red-600">*</span>
        </Label>
        <Select 
          value={draft.type} 
          onValueChange={selectCategory}
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
        {subtypes.length > 0 ? (
          <Select 
            value={draft.sub1 || ''} 
            onValueChange={(value) => handleSubtypeChange ? handleSubtypeChange(value) : updateField('sub1', value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="SELECT TYPE..." />
            </SelectTrigger>
            <SelectContent>
              {subtypes.map((subtype, index) => (
                <SelectItem key={`${subtype}-${index}`} value={subtype.toUpperCase()} className="text-xs uppercase">
                  {subtype.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={draft.sub1 || ''}
            onChange={(e) => updateField('sub1', e.target.value.toUpperCase())}
            placeholder="ENTER TYPE"
            className="uppercase text-xs h-8"
          />
        )}
      </div>
    </>
  );
}
