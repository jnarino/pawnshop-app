import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CustomerRecord } from '../../mappers';
import { US_STATES } from '../../constants/customerConstants';

interface AddressSectionProps {
  form: CustomerRecord;
  update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]): void;
  editing: boolean;
  useIdAddr: boolean;
  setUseIdAddr(v: boolean): void;
}

export function AddressSection({ form, update, editing, useIdAddr, setUseIdAddr }: AddressSectionProps) {
  return (
    <FieldSet className="card section">
      <FieldLegend className="mb-1 text-sm">Address</FieldLegend>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="sameAsId" 
          checked={useIdAddr} 
          onCheckedChange={(checked) => {
            setUseIdAddr(!!checked);
            if (checked) {
              update('streetAddress', form.idAddress || '');
              update('city', form.idCity || '');
              update('stateUs', form.idState || '');
              update('zipCode', form.idZip || '');
            }
          }}
        />
        <Label htmlFor="sameAsId" className="text-sm">Use ID address as primary address</Label>
      </div>

      <div className="flex gap-2">
        <Field className="flex-1">
          <FieldLabel>Street Address</FieldLabel>
          <Input value={form.streetAddress || ''} onChange={e => update('streetAddress', e.target.value)} disabled={!editing || useIdAddr} />
        </Field>
        <Field className="w-48">
          <FieldLabel>City</FieldLabel>
          <Input value={form.city || ''} onChange={e => update('city', e.target.value)} disabled={!editing || useIdAddr} />
        </Field>
        <Field className="w-20">
          <FieldLabel>State</FieldLabel>
          <Select value={form.stateUs || undefined} onValueChange={(value) => update('stateUs', value)} disabled={!editing || useIdAddr}>
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
          <Input value={form.zipCode || ''} onChange={e => update('zipCode', e.target.value)} disabled={!editing || useIdAddr} />
        </Field>
      </div>
    </FieldSet>
  );
}
