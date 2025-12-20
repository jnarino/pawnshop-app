import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WEIGHT_UNITS } from '@/app/shared/constants/jewelry';
import { LookupSelect } from '@/app/shared/components/LookupSelect';
import { LookupTypeName } from '@/app/shared/types/lookup';
import type { InventoryItemDraft } from './types';

interface JewelryFieldsProps {
  readonly style?: string;
  readonly metal?: string;
  readonly karat?: string;
  readonly gender?: string;
  readonly sizeLength?: string;
  readonly weight?: string;
  readonly weightUnit?: string;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
  readonly handleMetalChange: (metal: string) => void;
  readonly isRing: boolean;
  readonly disabled?: boolean;
}

function JewelryFieldsComponent({ style, metal, karat, gender, sizeLength, weight, weightUnit, updateField, handleMetalChange, isRing, disabled = false }: JewelryFieldsProps) {

  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Style</Label>
        <Input
          value={style || ''}
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
          value={metal || ''}
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
          value={karat || ''}
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
          value={gender || ''}
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
            value={sizeLength || ''}
            onChange={(value) => updateField('sizeLength', value)}
            placeholder="RING SIZE..."
            disabled={disabled}
          />
        ) : (
          <Input
            type="number"
            step="0.25"
            min="0"
            value={sizeLength || ''}
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
          value={weight || ''}
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
          value={weightUnit?.toUpperCase() || 'GRAMS'} 
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

export const JewelryFields = memo(JewelryFieldsComponent);
