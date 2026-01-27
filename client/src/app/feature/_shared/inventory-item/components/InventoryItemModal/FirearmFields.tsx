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
          onChange={(_value, _label, option) => updateField('caliber', option)}
          placeholder="SELECT CALIBER..."
          showAddButton
          disabled={disabled}
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Finish</Label>
        <LookupSelect
          typeName={LookupTypeName.FINISH}
          value={draft.finish || ''}
          onChange={(_value, _label, option) => updateField('finish', option)}
          placeholder="SELECT FINISH..."
          showAddButton
          disabled={disabled}
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Action</Label>
        <LookupSelect
          typeName={LookupTypeName.ACTION}
          value={draft.action || ''}
          onChange={(_value, _label, option) => updateField('action', option)}
          placeholder="SELECT ACTION..."
          showAddButton
          disabled={disabled}
        />
      </div>

      <div className="space-y-1 col-span-3">
        <div className='grid grid-cols-5 gap-2'>
          <div className='col-span-3 space-y-1'>
            <Label className="text-xs font-semibold">Barrel</Label>
            <LookupSelect
              typeName={LookupTypeName.BARREL}
              value={draft.barrel?.id || ''}
              onChange={(_value, _label, option) => updateField('barrel', option)}
              placeholder="SELECT BARREL..."
              showAddButton
              disabled={disabled}
            />
          </div>
          <div className='col-span-2 space-y-1'>
            <Label className="text-xs font-semibold">Length</Label>
            <Input
              value={draft.barrelLength || ''}
              onChange={(e) => updateField('barrelLength', e.target.value)}
              placeholder="16 INCHES"
              disabled={disabled}
              className="uppercase text-xs h-8"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Importer</Label>
        <LookupSelect
          typeName={LookupTypeName.IMPORTER}
          value={draft.importer || ''}
          onChange={(_value, _label, option) => updateField('importer', option)}
          placeholder="SELECT IMPORTER..."
          showAddButton
          disabled={disabled}
        />
      </div>
    </>
  );
}
