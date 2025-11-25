import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItemDraft } from './types';

interface CategoryFieldsProps {
  typeQuery: string;
  setTypeQuery: (value: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (value: boolean) => void;
  suggestions: Array<{ id: string; name: string }>;
  selectType: (name: string) => void;
  isLoading: boolean;
  draft: InventoryItemDraft;
  subtypes: string[];
  updateField: (field: keyof InventoryItemDraft, value: any) => void;
  allCategories: Array<{ id: string; name: string }>;
}

export function CategoryFields({
  typeQuery,
  setTypeQuery,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  selectType,
  isLoading,
  draft,
  subtypes,
  updateField,
  allCategories,
  handleSubtypeChange
}: CategoryFieldsProps & { handleSubtypeChange?: (value: string) => void }) {
  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Category <span className="text-red-600">*</span>
        </Label>
        <Select 
          value={draft.type} 
          onValueChange={(value) => selectType(value)} 
          disabled={isLoading}
        >
          <SelectTrigger className="h-8 text-xs uppercase">
            <SelectValue placeholder={isLoading ? "LOADING..." : "SELECT CATEGORY..."} />
          </SelectTrigger>
          <SelectContent>
            {allCategories.map((cat, index) => (
              <SelectItem key={cat.id || index} value={cat.name.toUpperCase()} className="text-xs uppercase">
                {cat.name.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Type</Label>
        {subtypes.length > 0 ? (
          <Select value={draft.sub1 || ''} onValueChange={(value) => handleSubtypeChange ? handleSubtypeChange(value) : updateField('sub1', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="SELECT TYPE..." />
            </SelectTrigger>
            <SelectContent>
              {subtypes.map(subtype => (
                <SelectItem key={subtype} value={subtype.toUpperCase()} className="text-xs uppercase">
                  {subtype.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={draft.sub1 || ''}
            onChange={(e) => updateField('sub1', e.target.value)}
            placeholder="ENTER TYPE"
            className="uppercase text-xs h-8"
          />
        )}
      </div>
    </>
  );
}
