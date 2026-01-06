import { memo } from 'react';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import type { Customer } from '../../types';

interface ComplianceSectionProps {
  readonly fflNumber?: string | null;
  readonly fflExpireDate?: string | null;
  readonly taxId?: string | null;
  readonly military?: boolean | null;
  readonly locked?: boolean | null;
  readonly taxExempt?: boolean | null;
  readonly onUpdate: <K extends keyof Customer>(field: K, value: Customer[K]) => void;
}

export const ComplianceSection = memo(function ComplianceSection({ 
  fflNumber,
  fflExpireDate,
  taxId,
  military,
  locked,
  taxExempt,
  onUpdate 
}: ComplianceSectionProps) {
  return (
    <FieldSet className="card section">
      <FieldLegend className="mb-2 text-sm">Misc / Compliance</FieldLegend>
      <div className="grid grid-cols-2 gap-2">
        <Field>
          <FieldLabel>Fed. Firearms #</FieldLabel>
          <Input 
            value={fflNumber || ''} 
            onChange={(e) => onUpdate('fflNumber', e.target.value)} 
            placeholder="FFL number"
          />
        </Field>
        
        <Field>
          <FieldLabel>Fed. Firearms Exp. Date</FieldLabel>
          <DatePicker 
            value={fflExpireDate || undefined} 
            onChange={(value) => onUpdate('fflExpireDate', value)} 
          />
        </Field>
        
        <Field>
          <FieldLabel>Tax ID</FieldLabel>
          <Input 
            value={taxId || ''} 
            onChange={(e) => onUpdate('taxId', e.target.value)} 
            placeholder="Tax ID"
          />
        </Field>
        
        <Field>
          <FieldLabel>Customer Credit</FieldLabel>
          <Input 
            value={'0.00'} 
            onChange={() => {/* No customer credit field */}} 
            placeholder="0.00"
            disabled
          />
        </Field>
        
        <div className="col-span-2 flex items-center gap-6 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="military" 
              checked={military || false}
              onCheckedChange={(checked) => onUpdate('military', !!checked)}
            />
            <Label htmlFor="military" className="text-sm">Military</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="locked" 
              checked={locked || false}
              onCheckedChange={(checked) => onUpdate('locked', !!checked)}
            />
            <Label htmlFor="locked" className="text-sm">LOCKED</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="taxExempt" 
              checked={taxExempt || false}
              onCheckedChange={(checked) => onUpdate('taxExempt', !!checked)}
            />
            <Label htmlFor="taxExempt" className="text-sm">Tax Exempt</Label>
          </div>
        </div>
      </div>
    </FieldSet>
  );
});
