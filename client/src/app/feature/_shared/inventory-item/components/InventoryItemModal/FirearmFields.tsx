import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LookupSelect } from '@/app/shared/components/LookupSelect';
import { LookupTypeName } from '@/app/shared/types/lookup';
import type { InventoryItemDraft } from './types';

interface FirearmFieldsProps {
  readonly caliber?: string;
  readonly action?: string;
  readonly barrelLength?: string;
  readonly capacity?: string;
  readonly updateField: (field: keyof InventoryItemDraft, value: any) => void;
  readonly disabled?: boolean;
}

function FirearmFieldsComponent({ caliber, action, barrelLength, capacity, updateField, disabled = false }: FirearmFieldsProps) {
  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Caliber</Label>
        <LookupSelect
          typeName={LookupTypeName.CALIBER}
          value={caliber || ''}
          onChange={(value) => updateField('caliber', value)}
          placeholder="SELECT CALIBER..."
          disabled={disabled}
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Action</Label>
        <LookupSelect
          typeName={LookupTypeName.ACTION}
          value={action || ''}
          onChange={(value) => updateField('action', value)}
          placeholder="SELECT ACTION..."
          disabled={disabled}
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Barrel Length</Label>
        <Input
          value={barrelLength || ''}
          onChange={(e) => updateField('barrelLength', e.target.value)}
          placeholder="16 INCHES"
          disabled={disabled}
          className="uppercase text-xs h-8"
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Capacity</Label>
        <Input
          value={capacity || ''}
          onChange={(e) => updateField('capacity', e.target.value)}
          placeholder="15 ROUNDS"
          disabled={disabled}
          className="uppercase text-xs h-8"
        />
      </div>
    </>
  );
}

export const FirearmFields = memo(FirearmFieldsComponent);
