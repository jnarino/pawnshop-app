import { memo } from 'react';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Customer } from '../../types';
import { StateSelect } from '@/app/shared/components/StateSelect';

interface EmployerInfoSectionProps {
  readonly employerName?: string | null;
  readonly employerAddress?: string | null;
  readonly employerCity?: string | null;
  readonly employerState?: string | null;
  readonly employerZip?: string | null;
  readonly employerPhoneNumber?: string | null;
  readonly onUpdate: <K extends keyof Customer>(field: K, value: Customer[K]) => void;
}

export const EmployerInfoSection = memo(function EmployerInfoSection({ 
  employerName,
  employerAddress,
  employerCity,
  employerState,
  employerZip,
  employerPhoneNumber,
  onUpdate 
}: EmployerInfoSectionProps) {
  return (
    <FieldSet className="card section">
      <FieldLegend className="mb-2 text-sm">Employer Information</FieldLegend>
      <div className="grid grid-cols-1 gap-2">
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input 
            value={employerName || ''} 
            onChange={(e) => onUpdate('employerName', e.target.value)} 
            placeholder="Employer name"
          />
        </Field>
        
        <Field>
          <FieldLabel>Address</FieldLabel>
          <Input 
            value={employerAddress || ''} 
            onChange={(e) => onUpdate('employerAddress', e.target.value)} 
            placeholder="Street address"
          />
        </Field>
        
        <div className="grid grid-cols-3 gap-2">
          <Field className="col-span-1">
            <FieldLabel>City, St, Zip</FieldLabel>
            <Input 
              value={employerCity || ''} 
              onChange={(e) => onUpdate('employerCity', e.target.value)} 
              placeholder="City"
            />
          </Field>
          
          <Field>
            <FieldLabel>&nbsp;</FieldLabel>
            <StateSelect 
              value={employerState} 
              onValueChange={(value: string) => onUpdate('employerState', value)}
              placeholder="State"
            />
          </Field>
          
          <Field>
            <FieldLabel>&nbsp;</FieldLabel>
            <Input 
              value={employerZip || ''} 
              onChange={(e) => onUpdate('employerZip', e.target.value)} 
              placeholder="Zip"
            />
          </Field>
        </div>
        
        <Field>
          <FieldLabel>Phone</FieldLabel>
          <Input 
            value={employerPhoneNumber || ''} 
            onChange={(e) => onUpdate('employerPhoneNumber', e.target.value)} 
            placeholder="(555) 123-4567"
          />
        </Field>
      </div>
    </FieldSet>
  );
});
