import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import type { Customer } from '../../types';

interface ComplianceSectionProps {
  readonly customer: Customer | null;
  readonly onUpdate: <K extends keyof Customer>(field: K, value: Customer[K]) => void;
}

export function ComplianceSection({ customer, onUpdate }: ComplianceSectionProps) {
  return (
    <FieldSet className="card section">
      <FieldLegend className="mb-2 text-sm">Misc / Compliance</FieldLegend>
      <div className="grid grid-cols-2 gap-2">
        <Field>
          <FieldLabel>Fed. Firearms #</FieldLabel>
          <Input 
            value={customer?.fflNumber || ''} 
            onChange={(e) => onUpdate('fflNumber', e.target.value)} 
            placeholder="FFL number"
            disabled={!customer}
          />
        </Field>
        
        <Field>
          <FieldLabel>Fed. Firearms Exp. Date</FieldLabel>
          <DatePicker 
            value={customer?.fflExpireDate || undefined} 
            onChange={(value) => onUpdate('fflExpireDate', value)} 
            disabled={!customer}
          />
        </Field>
        
        <Field>
          <FieldLabel>Tax ID</FieldLabel>
          <Input 
            value={customer?.taxId || ''} 
            onChange={(e) => onUpdate('taxId', e.target.value)} 
            placeholder="Tax ID"
            disabled={!customer}
          />
        </Field>
        
        <Field>
          <FieldLabel>Customer Credit</FieldLabel>
          <Input 
            value={'0.00'} 
            onChange={(e) => {/* No customer credit field */}} 
            placeholder="0.00"
            disabled
          />
        </Field>
        
        <div className="col-span-2 flex items-center gap-6 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="military" 
              checked={customer?.military || false}
              onCheckedChange={(checked) => onUpdate('military', !!checked)}
              disabled={!customer}
            />
            <Label htmlFor="military" className="text-sm">Military</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="locked" 
              checked={customer?.locked || false}
              onCheckedChange={(checked) => onUpdate('locked', !!checked)}
              disabled={!customer}
            />
            <Label htmlFor="locked" className="text-sm">LOCKED</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="taxExempt" 
              checked={customer?.taxExempt || false}
              onCheckedChange={(checked) => onUpdate('taxExempt', !!checked)}
              disabled={!customer}
            />
            <Label htmlFor="taxExempt" className="text-sm">Tax Exempt</Label>
          </div>
        </div>
      </div>
    </FieldSet>
  );
}
