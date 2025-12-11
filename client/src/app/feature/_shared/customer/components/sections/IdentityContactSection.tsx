import { memo } from 'react';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { CustomerRecord } from '../../mappers';
import { formatPhone } from '../../utils/formatters';

interface IdentityContactSectionProps {
  readonly firstName: string;
  readonly middleName?: string | null;
  readonly lastName: string;
  readonly dateOfBirth?: string | null;
  readonly phoneNumber?: string | null;
  readonly cellPhone?: string | null;
  readonly email?: string | null;
  readonly ssNumber?: string | null;
  readonly update: <K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) => void;
  readonly editing: boolean;
}

export const IdentityContactSection = memo(function IdentityContactSection({ 
  firstName,
  middleName,
  lastName,
  dateOfBirth,
  phoneNumber,
  cellPhone,
  email,
  ssNumber,
  update, 
  editing 
}: IdentityContactSectionProps) {
  return (
    <FieldSet className="card section">
      <FieldLegend className="mb-2 text-sm">Personal Information</FieldLegend>
      <div className="grid grid-cols-2 gap-2">
        <Field>
          <FieldLabel>First Name</FieldLabel>
          <Input value={firstName} onChange={e => update('firstName', e.target.value)} placeholder="First" />
        </Field>
        <Field>
          <FieldLabel>Middle</FieldLabel>
          <Input value={middleName || ''} onChange={e => update('middleName', e.target.value)} placeholder="M" disabled={!editing} />
        </Field>
        <Field>
          <FieldLabel>Last Name *</FieldLabel>
          <Input value={lastName} onChange={e => update('lastName', e.target.value)} placeholder="Last" />
        </Field>
        <Field>
          <FieldLabel>Date of Birth</FieldLabel>
          <DatePicker 
            value={dateOfBirth || undefined} 
            onChange={(value) => update('dateOfBirth', value)} 
          />
        </Field>

        <Field>
          <FieldLabel>Phone (primary)</FieldLabel>
          <Input value={phoneNumber || ''} onChange={e => update('phoneNumber', formatPhone(e.target.value))} disabled={!editing} placeholder="(555) 123-4567" />
        </Field>
        <Field>
          <FieldLabel>Cell Phone</FieldLabel>
          <Input value={cellPhone || ''} onChange={e => update('cellPhone', formatPhone(e.target.value))} disabled={!editing} placeholder="(555) 987-6543" />
        </Field>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input value={email || ''} onChange={e => update('email', e.target.value)} disabled={!editing} />
        </Field>
        <Field>
          <FieldLabel>SS Number</FieldLabel>
          <Input value={ssNumber || ''} onChange={e => update('ssNumber', e.target.value)} disabled={!editing} placeholder="###-##-####" />
        </Field>
      </div>
    </FieldSet>
  );
});
