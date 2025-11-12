import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CustomerRecord } from '../../mappers';
import { US_STATES } from '../../constants/customerConstants';

interface PhysicalTraitsSectionProps {
  form: CustomerRecord;
  update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]): void;
  editing: boolean;
  setHeight(feet: string, inches: string): void;
  heightFeet: string;
  heightInches: string;
}

export function PhysicalTraitsSection({ form, update, editing, setHeight, heightFeet, heightInches }: PhysicalTraitsSectionProps) {
  return (
    <FieldSet className="card section">
      <FieldLegend>Physical Traits & Birth</FieldLegend>
      <div className="grid grid-cols-5 gap-4">
        <Field>
          <FieldLabel>Sex</FieldLabel>
          <Select value={form.sex || undefined} onValueChange={(value) => update('sex', value || undefined)} disabled={!editing}>
            <SelectTrigger>
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">M</SelectItem>
              <SelectItem value="F">F</SelectItem>
              <SelectItem value="O">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Height</FieldLabel>
          <div className="flex gap-1">
            <Input className="w-14" disabled={!editing} value={heightFeet} placeholder="ft" onChange={e => setHeight(e.target.value, heightInches)} />
            <Input className="w-14" disabled={!editing} value={heightInches} placeholder="in" onChange={e => setHeight(heightFeet, e.target.value)} />
          </div>
        </Field>
        <Field>
          <FieldLabel>Weight</FieldLabel>
          <Input value={form.weight || ''} onChange={e => update('weight', e.target.value)} disabled={!editing} placeholder="lbs" />
        </Field>
        <Field>
          <FieldLabel>Hair Color</FieldLabel>
          <Input list="hairColors" value={form.hairColor || ''} onChange={e => update('hairColor', e.target.value)} disabled={!editing} />
        </Field>
        <Field>
          <FieldLabel>Eye Color</FieldLabel>
          <Input list="eyeColors" value={form.eyeColor || ''} onChange={e => update('eyeColor', e.target.value)} disabled={!editing} />
        </Field>

        <Field>
          <FieldLabel>Race</FieldLabel>
          <Input list="races" value={form.race || ''} onChange={e => update('race', e.target.value)} disabled={!editing} />
        </Field>
        <Field>
          <FieldLabel>Birth City</FieldLabel>
          <Input value={form.birthCity || ''} onChange={e => update('birthCity', e.target.value)} disabled={!editing} />
        </Field>
        <Field>
          <FieldLabel>Birth State</FieldLabel>
          <Select value={form.birthState || undefined} onValueChange={(value) => update('birthState', value)} disabled={!editing}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Birth Country</FieldLabel>
          <Input value={form.birthCountry || ''} onChange={e => update('birthCountry', e.target.value)} disabled={!editing} />
        </Field>
        <Field className="col-span-2">
          <FieldLabel>Marks</FieldLabel>
          <Textarea 
            value={form.marks || ''} 
            onChange={e => update('marks', e.target.value)} 
            disabled={!editing} 
            rows={2} 
          />
        </Field>
      </div>
    </FieldSet>
  );
}
