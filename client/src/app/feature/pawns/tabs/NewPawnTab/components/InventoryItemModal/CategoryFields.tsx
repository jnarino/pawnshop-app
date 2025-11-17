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
  updateField
}: CategoryFieldsProps) {
  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Category <span className="text-red-600">*</span>
        </Label>
        <div className="relative">
          <Input
            type="text"
            value={typeQuery}
            onChange={(e) => {
              const upperValue = e.target.value.toUpperCase();
              setTypeQuery(upperValue);
              updateField('type', upperValue);
              setShowSuggestions(upperValue.length > 0);
            }}
            onFocus={() => setShowSuggestions(typeQuery.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={isLoading ? "LOADING..." : "SEARCH CATEGORIES..."}
            disabled={isLoading}
            required
            className="uppercase text-xs h-8"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 border-t-0 rounded-b-md max-h-40 overflow-y-auto z-[1000] shadow-lg">
              {suggestions.map((cat, index) => (
                <div
                  key={cat.id || index}
                  className="px-2.5 py-1.5 cursor-pointer text-xs border-b border-gray-100 hover:bg-slate-50 last:border-b-0"
                  onClick={() => selectType(cat.name.toUpperCase())}
                >
                  {cat.name.toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Type</Label>
        {subtypes.length > 0 ? (
          <Select value={draft.sub1 || ''} onValueChange={(value) => updateField('sub1', value)}>
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
