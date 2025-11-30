import { memo } from 'react';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { CustomerRecord } from '../../mappers';
import { US_STATES } from '../../constants/customerConstants';

interface GovernmentIdSectionProps {
  readonly idType?: string | null;
  readonly idNumber?: string | null;
  readonly idState?: string | null;
  readonly idIssueDate?: string | null;
  readonly idExpiration?: string | null;
  readonly idAddress?: string | null;
  readonly idCity?: string | null;
  readonly idZip?: string | null;
  update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]): void;
  readonly editing: boolean;
  readonly loading?: boolean;
}

export const GovernmentIdSection = memo(function GovernmentIdSection({ 
  idType,
  idNumber,
  idState,
  idIssueDate,
  idExpiration,
  idAddress,
  idCity,
  idZip,
  update, 
  editing, 
  loading 
}: GovernmentIdSectionProps) {
  return (
    <FieldSet className="card section">
      <FieldLegend className="mb-1 text-sm">Government ID</FieldLegend>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-end">
          <Field className="flex-1">
            <FieldLabel>ID Type</FieldLabel>
            <Input list="idTypes" value={idType || ''} onChange={e => update('idType', e.target.value)} disabled={!editing} />
          </Field>
          <Field className="flex-1">
            <FieldLabel>ID Number</FieldLabel>
            <Input value={idNumber || ''} onChange={e => update('idNumber', e.target.value)} disabled={loading || !editing} />
          </Field>
          <Field className="w-20">
            <FieldLabel>Issuing State</FieldLabel>
            <Select value={idState || undefined} onValueChange={(value) => update('idState', value)} disabled={!editing}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-36">
            <FieldLabel>ID Issue Date</FieldLabel>
            <DatePicker 
              value={idIssueDate || undefined} 
              onChange={(value) => update('idIssueDate', value)} 
              disabled={!editing}
            />
          </Field>
          <Field className="w-36">
            <FieldLabel>ID Expiration</FieldLabel>
            <DatePicker 
              value={idExpiration || undefined} 
              onChange={(value) => update('idExpiration', value)} 
              disabled={!editing}
            />
          </Field>
        </div>

        <div className="flex gap-2">
          <Field className="flex-1">
            <FieldLabel>ID Address</FieldLabel>
            <Input value={idAddress || ''} onChange={e => update('idAddress', e.target.value)} disabled={!editing} />
          </Field>
          <Field className="w-48">
            <FieldLabel>ID City</FieldLabel>
            <Input value={idCity || ''} onChange={e => update('idCity', e.target.value)} disabled={!editing} />
          </Field>
          <Field className="w-28">
            <FieldLabel>ID Zip</FieldLabel>
            <Input value={idZip || ''} onChange={e => update('idZip', e.target.value)} disabled={!editing} />
          </Field>
        </div>
      </div>
    </FieldSet>
  );
});
