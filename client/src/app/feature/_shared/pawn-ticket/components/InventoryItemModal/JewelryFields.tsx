import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WEIGHT_UNITS } from '@/app/shared/constants/jewelry';
import { LookupSelect } from '@/app/shared/components/LookupSelect';
import { LookupTypeName } from '@/app/shared/types/lookup';
import { InventoryItemDraft } from './types';
import { CategoryOption } from '@/app/core/api/categoryApi';

interface JewelryFieldsProps {
  readonly draft: InventoryItemDraft;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
  readonly handleMetalChange: (metal: string) => void;
  readonly isRing: boolean;
  readonly disabled?: boolean;
  readonly styleOptions?: CategoryOption[];
}

export function JewelryFields({ draft, updateField, handleMetalChange, isRing, disabled = false, styleOptions = [] }: JewelryFieldsProps) {

  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Style</Label>
        <Input
          value={draft.style || ''}
          onChange={(e) => updateField('style', e.target.value)}
          placeholder="STYLE"
          disabled={disabled}
          className="uppercase text-xs h-8"
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Metal <span className="text-red-600">*</span>
        </Label>
        <LookupSelect
          typeName={LookupTypeName.METAL}
          value={draft.metal || ''}
          onChange={handleMetalChange}
          placeholder="SELECT METAL..."
          disabled={disabled}
          required
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Karat <span className="text-red-600">*</span>
        </Label>
        <LookupSelect
          typeName={LookupTypeName.KARAT}
          value={draft.karat || ''}
          onChange={(value) => updateField('karat', value)}
          placeholder="SELECT KARAT..."
          disabled={disabled}
          required
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Gender</Label>
        <LookupSelect
          typeName={LookupTypeName.GENDER}
          value={draft.gender || ''}
          onChange={(value) => updateField('gender', value)}
          placeholder="SELECT..."
          disabled={disabled}
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Size/Length</Label>
        {isRing ? (
          <LookupSelect
            typeName={LookupTypeName.SIZE}
            value={draft.sizeLength || ''}
            onChange={(value) => updateField('sizeLength', value)}
            placeholder="RING SIZE..."
            disabled={disabled}
          />
        ) : (
          <Input
            type="number"
            step="0.25"
            min="0"
            value={draft.sizeLength || ''}
            onChange={(e) => updateField('sizeLength', e.target.value)}
            placeholder="0"
            disabled={disabled}
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
          disabled={disabled}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Unit</Label>
        <Select 
          value={draft.weightUnit?.toUpperCase() || 'GRAMS'} 
          onValueChange={(value) => updateField('weightUnit', value)}
          disabled={disabled}
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
