import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JEWELRY_COLORS } from '@/app/shared/constants/jewelry';
import { FIREARM_FINISHES } from '@/app/shared/constants/firearms';
import { InventoryItemDraft } from './types';

interface BasicInfoFieldsProps {
  draft: InventoryItemDraft;
  updateField: (field: keyof InventoryItemDraft, value: any) => void;
  isFirearm: boolean;
}

export function BasicInfoFields({ draft, updateField, isFirearm }: BasicInfoFieldsProps) {
  return (
    <>
      {/* Row 1: Value (62%) + Qty (38%) combined */}
      <div className="space-y-1 col-span-3">
        <div className="flex gap-2">
          <div className="flex-[62] space-y-1">
            <Label className="text-xs font-semibold">
              Value ($) <span className="text-red-600">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="999999.99"
              value={draft.amount || ''}
              onChange={(e) => updateField('amount', e.target.value)}
              placeholder="10000.00"
              required
              className="h-8 text-xs font-semibold text-green-700"
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
          className="text-xs h-8"
        />
      </div>

      {/* Row 2: Brand */}
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Brand</Label>
        <Input
          value={draft.brand || ''}
          onChange={(e) => updateField('brand', e.target.value)}
          placeholder="BRAND NAME"
          className="uppercase text-xs h-8"
        />
      </div>

      {/* Row 2: Model */}
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Model</Label>
        <Input
          value={draft.model || ''}
          onChange={(e) => updateField('model', e.target.value)}
          placeholder="MODEL"
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
          className="uppercase text-xs h-8"
        />
      </div>

      {/* Row 2: Color */}
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">{isFirearm ? 'Finish/Color' : 'Color'}</Label>
        <Select value={draft.color || ''} onValueChange={(value) => updateField('color', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={isFirearm ? "SELECT FINISH..." : "SELECT COLOR..."} />
          </SelectTrigger>
          <SelectContent>
            {(isFirearm ? FIREARM_FINISHES : JEWELRY_COLORS).map(item => (
              <SelectItem key={item} value={item.toUpperCase()} className="text-xs uppercase">
                {item.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
