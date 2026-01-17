import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WEIGHT_UNITS } from '@/app/shared/constants/jewelry';
import { LookupSelect } from '@/app/shared/components/LookupSelect';
import { LookupTypeName } from '@/app/shared/types/lookup';
import { InventoryItemDraft } from './types';

interface JewelryFieldsProps {
  readonly draft: InventoryItemDraft;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
  readonly handleMetalChange: (metal: string) => void;
  readonly isRing: boolean;
  readonly disabled?: boolean;
}

export function JewelryFields({ draft, updateField, handleMetalChange, isRing, disabled = false }: JewelryFieldsProps) {

  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Style<span className="text-red-600">*</span></Label>
        <LookupSelect
          typeName={LookupTypeName.STYLE}
          value={draft.style || ''}
          onChange={(_value, _label, option) => updateField('style', option)}
          placeholder="SELECT STYLE..."
          disabled={disabled}
          required
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Metal <span className="text-red-600">*</span>
        </Label>
        <LookupSelect
          typeName={LookupTypeName.METAL}
          value={draft.metal || ''}
          onChange={(_value, _lable, option) => handleMetalChange(option)}
          placeholder="SELECT METAL..."
          disabled={disabled}
          required
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Karat
        </Label>
        <LookupSelect
          typeName={LookupTypeName.KARAT}
          value={draft.karat || ''}
          onChange={(_value, _label, option) => updateField('karat', option)}
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
          onChange={(_value, _label, option) => updateField('gender', option)}
          placeholder="SELECT..."
          disabled={disabled}
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Size/Length <span className="text-red-600">*</span></Label>
          <LookupSelect
            typeName={LookupTypeName.SIZE}
            value={draft.sizeLength || ''}
            onChange={(_value, _label, option) => updateField('sizeLength', option)}
            placeholder="SIZE/LENGTH"
            disabled={disabled}
            required
          />
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
          placeholder="0.00"
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
