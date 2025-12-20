import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarInput } from '@/components/ui/dollar-input';
import { LookupSelect } from '@/app/shared/components/LookupSelect';
import { LookupTypeName } from '@/app/shared/types/lookup';
import type { InventoryItemDraft } from './types';
import { CategoryOption } from '@/app/core/api/categoryApi';
import { BrandSelect } from './BrandSelect';

interface BasicInfoFieldsProps {
  readonly amount?: string | number;
  readonly quantity?: string | number;
  readonly ownerNumber?: string;
  readonly model?: string;
  readonly serial?: string;
  readonly color?: string;
  readonly brandId?: string;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
  readonly isFirearm: boolean;
  readonly disabled?: boolean;
  readonly brands: CategoryOption[];
  readonly handleBrandChange: (brandId: string) => void;
}

function BasicInfoFieldsComponent({ amount, quantity, ownerNumber, model, serial, color, brandId, updateField, isFirearm, disabled = false, brands, handleBrandChange }: BasicInfoFieldsProps) {
  return (
    <>
      {/* Row 1: Value (62%) + Qty (38%) combined */}
      <div className="space-y-1 col-span-3">
        <div className="flex gap-2">
          <div className="flex-[62] space-y-1">
            <Label className="text-xs font-semibold">
              Value ($) <span className="text-red-600">*</span>
            </Label>
            <DollarInput
              value={amount || ''}
              onChange={(value) => updateField('amount', value)}
              placeholder="10000.00"
              required
              disabled={disabled}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex-[38] space-y-1">
            <Label className="text-xs font-semibold">Quantity</Label>
            <Input
              type="number"
              min="1"
              max="999"
              value={quantity || '1'}
              onChange={(e) => updateField('quantity', e.target.value)}
              placeholder="1"
              disabled={disabled}
              className="h-8 text-xs text-center"
            />
          </div>
        </div>
      </div>

      {/* Row 1: Owner Marks */}
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Owner Marks</Label>
        <Input
          value={ownerNumber || ''}
          onChange={(e) => updateField('ownerNumber', e.target.value)}
          placeholder="Marks/engravings (free text)"
          disabled={disabled}
          className="text-xs h-8"
        />
      </div>

      {brands.length > 0 && (
        <BrandSelect
          value={brandId || ''}
          options={brands}
          onChange={handleBrandChange}
          disabled={disabled}
        />
      )}

      {/* Row 2: Model */}
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Model</Label>
        <Input
          value={model || ''}
          onChange={(e) => updateField('model', e.target.value)}
          placeholder="MODEL"
          disabled={disabled}
          className="uppercase text-xs h-8"
        />
      </div>

      {/* Row 2: Serial Number */}
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Serial Number</Label>
        <Input
          value={serial || ''}
          onChange={(e) => updateField('serial', e.target.value)}
          placeholder="SERIAL/IMEI"
          disabled={disabled}
          className="uppercase text-xs h-8"
        />
      </div>

      {/* Row 2: Color */}
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">{isFirearm ? 'Finish/Color' : 'Color'}</Label>
        <LookupSelect
          typeName={isFirearm ? LookupTypeName.FINISH : LookupTypeName.COLOR}
          value={color || ''}
          onChange={(value) => updateField('color', value)}
          placeholder={isFirearm ? "SELECT FINISH..." : "SELECT COLOR..."}
          disabled={disabled}
        />
      </div>
    </>
  );
}

export const BasicInfoFields = memo(BasicInfoFieldsComponent);
