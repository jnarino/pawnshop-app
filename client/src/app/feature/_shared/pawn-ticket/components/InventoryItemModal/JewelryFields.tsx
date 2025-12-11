import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JEWELRY_METALS, WEIGHT_UNITS, GENDER_OPTIONS, RING_SIZES } from '@/app/shared/constants/jewelry';
import { InventoryItemDraft } from './types';
import { CategoryOption } from '@/app/core/api/categoryApi';

interface JewelryFieldsProps {
  readonly draft: InventoryItemDraft;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
  readonly handleMetalChange: (metal: string) => void;
  readonly karatOptions: readonly string[];
  readonly isRing: boolean;
  readonly styleOptions?: CategoryOption[];
}

export function JewelryFields({ draft, updateField, handleMetalChange, karatOptions, isRing, styleOptions = [] }: JewelryFieldsProps) {
  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Style</Label>
        <Input
          value={draft.style || ''}
          onChange={(e) => updateField('style', e.target.value)}
          placeholder="STYLE"
          className="uppercase text-xs h-8"
        />
      </div>

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
        <Label className="text-xs font-semibold">Gender</Label>
        <Select value={draft.gender?.toUpperCase() || ''} onValueChange={(value) => updateField('gender', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="SELECT..." />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map(g => (
              <SelectItem key={g} value={g.toUpperCase()} className="text-xs">
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
            type="number"
            step="0.25"
            min="0"
            value={draft.sizeLength || ''}
            onChange={(e) => updateField('sizeLength', e.target.value)}
            placeholder="0"
            className="text-xs h-8"
          />
        )}
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Weight <span className="text-red-600">*</span>
        </Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          max="999.99"
          value={draft.weight || ''}
          onChange={(e) => updateField('weight', e.target.value)}
          placeholder="5.25"
          required
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Unit</Label>
        <Select 
          value={draft.weightUnit?.toUpperCase() || 'GRAMS'} 
          onValueChange={(value) => updateField('weightUnit', value)}
        >
          <SelectTrigger className="h-8 text-xs w-[69%]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEIGHT_UNITS.map(unit => (
              <SelectItem key={unit} value={unit.toUpperCase()} className="text-xs">
                {unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
