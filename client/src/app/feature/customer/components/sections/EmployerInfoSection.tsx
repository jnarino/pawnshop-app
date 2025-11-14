import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer } from '../../types';
import { US_STATES } from '../../constants/customerConstants';

interface EmployerInfoSectionProps {
  readonly customer: Customer | null;
  readonly onUpdate: <K extends keyof Customer>(field: K, value: Customer[K]) => void;
}

export function EmployerInfoSection({ customer, onUpdate }: EmployerInfoSectionProps) {
  return (
    <FieldSet className="card section">
      <FieldLegend className="mb-2 text-sm">Employer Information</FieldLegend>
      <div className="grid grid-cols-1 gap-2">
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input 
            value={customer?.employerName || ''} 
            onChange={(e) => onUpdate('employerName', e.target.value)} 
            placeholder="Employer name"
            disabled={!customer}
          />
        </Field>
        
        <Field>
          <FieldLabel>Address</FieldLabel>
          <Input 
            value={customer?.employerAddress || ''} 
            onChange={(e) => onUpdate('employerAddress', e.target.value)} 
            placeholder="Street address"
            disabled={!customer}
          />
        </Field>
        
        <div className="grid grid-cols-3 gap-2">
          <Field className="col-span-1">
            <FieldLabel>City, St, Zip</FieldLabel>
            <Input 
              value={customer?.employerCity || ''} 
              onChange={(e) => onUpdate('employerCity', e.target.value)} 
              placeholder="City"
              disabled={!customer}
            />
          </Field>
          
          <Field>
            <FieldLabel>&nbsp;</FieldLabel>
            <Select 
              value={customer?.employerState || undefined} 
              onValueChange={(value) => onUpdate('employerState', value)}
              disabled={!customer}
            >
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          
          <Field>
            <FieldLabel>&nbsp;</FieldLabel>
            <Input 
              value={customer?.employerZip || ''} 
              onChange={(e) => onUpdate('employerZip', e.target.value)} 
              placeholder="Zip"
              disabled={!customer}
            />
          </Field>
        </div>
        
        <Field>
          <FieldLabel>Phone</FieldLabel>
          <Input 
            value={customer?.employerPhoneNumber || ''} 
            onChange={(e) => onUpdate('employerPhoneNumber', e.target.value)} 
            placeholder="(555) 123-4567"
            disabled={!customer}
          />
        </Field>
      </div>
    </FieldSet>
  );
}
