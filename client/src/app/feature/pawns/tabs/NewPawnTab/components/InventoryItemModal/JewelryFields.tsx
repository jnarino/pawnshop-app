import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JEWELRY_METALS, WEIGHT_UNITS, GENDER_OPTIONS, RING_SIZES } from '@/app/shared/constants/jewelry';
import { InventoryItemDraft } from './types';

interface JewelryFieldsProps {
  draft: InventoryItemDraft;
  updateField: (field: keyof InventoryItemDraft, value: any) => void;
  handleMetalChange: (metal: string) => void;
  karatOptions: readonly string[];
  isRing: boolean;
}

export function JewelryFields({ draft, updateField, handleMetalChange, karatOptions, isRing }: JewelryFieldsProps) {
  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Metal <span className="text-red-600">*</span>
        </Label>
        <Select 
          value={draft.metal?.toLowerCase() || ''} 
          onValueChange={handleMetalChange}
          required
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="SELECT METAL..." />
          </SelectTrigger>
          <SelectContent>
            {JEWELRY_METALS.map(metal => (
              <SelectItem key={metal} value={metal} className="text-xs uppercase">
                {metal.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Karat <span className="text-red-600">*</span>
        </Label>
        {karatOptions.length > 0 ? (
          <Select value={draft.karat || ''} onValueChange={(value) => updateField('karat', value)} required>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="SELECT KARAT..." />
            </SelectTrigger>
            <SelectContent>
              {karatOptions.map(k => (
                <SelectItem key={k} value={k} className="text-xs">
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={draft.karat || ''}
            onChange={(e) => updateField('karat', e.target.value)}
            placeholder="14K, .925"
            required
            className="uppercase text-xs h-8"
          />
        )}
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Weight <span className="text-red-600">*</span>
        </Label>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            step="0.01"
            min="0"
            max="999.99"
            value={draft.weight || ''}
            onChange={(e) => updateField('weight', e.target.value)}
            placeholder="5.25"
            required
            className="max-w-[70px] h-8 text-xs font-semibold text-amber-600"
          />
          <Select 
            value={draft.weightUnit || 'Grams'} 
            onValueChange={(value) => updateField('weightUnit', value)}
          >
            <SelectTrigger className="min-w-[65px] h-8 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEIGHT_UNITS.map(unit => (
                <SelectItem key={unit} value={unit} className="text-xs">
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Gender</Label>
        <Select value={draft.gender || ''} onValueChange={(value) => updateField('gender', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="SELECT..." />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map(g => (
              <SelectItem key={g} value={g} className="text-xs">
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Size/Length</Label>
        {isRing ? (
          <Select value={draft.sizeLength || ''} onValueChange={(value) => updateField('sizeLength', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="RING SIZE..." />
            </SelectTrigger>
            <SelectContent>
              {RING_SIZES.map(size => (
                <SelectItem key={size} value={size} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={draft.sizeLength || ''}
            onChange={(e) => updateField('sizeLength', e.target.value)}
            placeholder="LENGTH (INCHES)"
            className="uppercase text-xs h-8"
          />
        )}
      </div>
    </>
  );
}
