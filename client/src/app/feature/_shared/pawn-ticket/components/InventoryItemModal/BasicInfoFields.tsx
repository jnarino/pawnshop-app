import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarInput } from '@/components/ui/dollar-input';
import { LookupSelect } from '@/app/shared/components/LookupSelect';
import { LookupTypeName } from '@/app/shared/types/lookup';
import { InventoryItemDraft } from './types';
import { CategoryOption } from '@/app/core/api/categoryApi';

interface BasicInfoFieldsProps {
  readonly draft: InventoryItemDraft;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
  readonly isFirearm: boolean;
  readonly disabled?: boolean;
  readonly brands: CategoryOption[];
  readonly handleBrandChange: (brandId: string) => void;
}

export function BasicInfoFields({ draft, updateField, isFirearm, disabled = false, brands, handleBrandChange }: BasicInfoFieldsProps) {
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
              value={draft.amount || ''}
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
              value={draft.quantity || '1'}
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
          value={draft.ownerNumber || ''}
          onChange={(e) => updateField('ownerNumber', e.target.value)}
          placeholder="Marks/engravings (free text)"
          disabled={disabled}
          className="text-xs h-8"
        />
      </div>

      {brands.length > 0 && (
        <div className="space-y-1 col-span-3">
          <Label className="text-xs font-semibold">
            Brand <span className="text-red-600">*</span>
          </Label>
          <Select value={draft.brandId || ''} onValueChange={handleBrandChange} disabled={disabled}>
            <SelectTrigger className="h-8 text-xs uppercase">
              <SelectValue placeholder="SELECT BRAND..." />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id} className="text-xs uppercase">
                  {brand.name.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Row 2: Model */}
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Model</Label>
        <Input
          value={draft.model || ''}
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
          value={draft.serial || ''}
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
          value={draft.color || ''}
          onChange={(value) => updateField('color', value)}
          placeholder={isFirearm ? "SELECT FINISH..." : "SELECT COLOR..."}
          disabled={disabled}
        />
      </div>
    </>
  );
}
