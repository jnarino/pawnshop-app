import { memo } from 'react';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CustomerRecord } from '../../mappers';
import { US_STATES } from '../../constants/customerConstants';

interface AddressSectionProps {
  readonly streetAddress?: string | null;
  readonly city?: string | null;
  readonly stateUs?: string | null;
  readonly zipCode?: string | null;
  readonly idAddress?: string | null;
  readonly idCity?: string | null;
  readonly idState?: string | null;
  readonly idZip?: string | null;
  readonly update: <K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) => void;
  readonly editing: boolean;
  readonly useIdAddr: boolean;
  readonly setUseIdAddr: (v: boolean) => void;
}

export const AddressSection = memo(function AddressSection({ 
  streetAddress,
  city,
  stateUs,
  zipCode,
  idAddress,
  idCity,
  idState,
  idZip,
  update, 
  editing, 
  useIdAddr, 
  setUseIdAddr 
}: AddressSectionProps) {
  return (
    <FieldSet className="card section">
      <FieldLegend className="mb-1 text-sm">Address</FieldLegend>

      <div className="flex items-center gap-2">
        <Checkbox 
          id="sameAsId" 
          checked={useIdAddr}
          disabled={!editing}
          onCheckedChange={(checked) => {
            setUseIdAddr(!!checked);
            if (checked) {
              update('streetAddress', idAddress || '');
              update('city', idCity || '');
              update('stateUs', idState || '');
              update('zipCode', idZip || '');
            }
          }}
        />
        <Label htmlFor="sameAsId" className="text-sm leading-none cursor-pointer">Use ID address as primary address</Label>
      </div>

      <div className="flex gap-2">
        <Field className="flex-1">
          <FieldLabel>Street Address</FieldLabel>
          <Input value={streetAddress || ''} onChange={e => update('streetAddress', e.target.value)} disabled={!editing || useIdAddr} />
        </Field>
        <Field className="w-48">
          <FieldLabel>City</FieldLabel>
          <Input value={city || ''} onChange={e => update('city', e.target.value)} disabled={!editing || useIdAddr} />
        </Field>
        <Field className="w-20">
          <FieldLabel>State</FieldLabel>
          <Select value={stateUs || undefined} onValueChange={(value) => update('stateUs', value)} disabled={!editing || useIdAddr}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field className="w-28">
          <FieldLabel>Zip</FieldLabel>
          <Input value={zipCode || ''} onChange={e => update('zipCode', e.target.value)} disabled={!editing || useIdAddr} />
        </Field>
      </div>
    </FieldSet>
  );
});
