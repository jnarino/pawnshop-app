import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FIREARM_CALIBERS, FIREARM_ACTIONS } from '@/app/shared/constants/firearms';
import { InventoryItemDraft } from './types';

interface FirearmFieldsProps {
  draft: InventoryItemDraft;
  updateField: (field: keyof InventoryItemDraft, value: any) => void;
}

export function FirearmFields({ draft, updateField }: FirearmFieldsProps) {
  return (
    <>
      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Caliber</Label>
        <Select value={draft.caliber?.toUpperCase() || ''} onValueChange={(value) => updateField('caliber', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="SELECT CALIBER..." />
          </SelectTrigger>
          <SelectContent>
            {FIREARM_CALIBERS.map(caliber => (
              <SelectItem key={caliber} value={caliber.toUpperCase()} className="text-xs">
                {caliber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Action</Label>
        <Select value={draft.action?.toUpperCase() || ''} onValueChange={(value) => updateField('action', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="SELECT ACTION..." />
          </SelectTrigger>
          <SelectContent>
            {FIREARM_ACTIONS.map(action => (
              <SelectItem key={action} value={action.toUpperCase()} className="text-xs">
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Barrel Length</Label>
        <Input
          value={draft.barrelLength || ''}
          onChange={(e) => updateField('barrelLength', e.target.value)}
          placeholder="16 INCHES"
          className="uppercase text-xs h-8"
        />
      </div>

      <div className="space-y-1 col-span-3">
        <Label className="text-xs font-semibold">Capacity</Label>
        <Input
          value={draft.capacity || ''}
          onChange={(e) => updateField('capacity', e.target.value)}
          placeholder="15 ROUNDS"
          className="uppercase text-xs h-8"
        />
      </div>
    </>
  );
}
