import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LookupSelect } from '@/app/shared/components/LookupSelect';
import { LookupTypeName } from '@/app/shared/types/lookup';
import { InventoryItemDraft } from './types';

interface FirearmFieldsProps {
  readonly draft: InventoryItemDraft;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
  readonly disabled?: boolean;
}

export function FirearmFields({ draft, updateField, disabled = false }: FirearmFieldsProps) {
  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Caliber</Label>
        <LookupSelect
          typeName={LookupTypeName.CALIBER}
          value={draft.caliber || ''}
          onChange={(value) => updateField('caliber', value)}
          placeholder="SELECT CALIBER..."
          disabled={disabled}
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Action</Label>
        <LookupSelect
          typeName={LookupTypeName.ACTION}
          value={draft.action || ''}
          onChange={(value) => updateField('action', value)}
          placeholder="SELECT ACTION..."
          disabled={disabled}
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Barrel Length</Label>
        <Input
          value={draft.barrelLength || ''}
          onChange={(e) => updateField('barrelLength', e.target.value)}
          placeholder="16 INCHES"
          disabled={disabled}
          className="uppercase text-xs h-8"
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Capacity</Label>
        <Input
          value={draft.capacity || ''}
          onChange={(e) => updateField('capacity', e.target.value)}
          placeholder="15 ROUNDS"
          disabled={disabled}
          className="uppercase text-xs h-8"
        />
      </div>
    </>
  );
}
