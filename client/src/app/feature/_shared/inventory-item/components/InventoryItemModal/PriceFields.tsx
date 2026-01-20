import { Label } from '@/components/ui/label';
import { InventoryItemDraft } from './types';
import { DollarInput } from '@/components/ui/dollar-input';

interface CategoryFieldsProps {
  readonly draft: InventoryItemDraft;
  readonly disabled?: boolean;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
}

export function PriceFields({
  draft,
  disabled = false,
  updateField
}: CategoryFieldsProps) {

  const updateResale = (value: string) => {
    updateField('resale', value);
    updateField('minResale', (Number.parseFloat(value) * 0.2).toFixed(2));
  };

  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Resale ($) <span className="text-red-600">*</span>
        </Label>
        <DollarInput
          value={draft.resale || ''}
          onChange={(value) => updateResale(value)}
          placeholder="10000.00"
          required
          disabled={disabled}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">
          Min resale ($) <span className="text-red-600">*</span>
        </Label>
        <DollarInput
          value={draft.minResale || ''}
          onChange={(value) => updateField('minResale', value)}
          placeholder="10000.00"
          required
          disabled={disabled}
          className="h-8 text-xs"
        />
      </div>
    </>
  );
}
