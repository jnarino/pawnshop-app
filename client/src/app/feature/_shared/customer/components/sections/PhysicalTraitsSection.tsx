import { memo } from 'react';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CustomerRecord } from '../../mappers';
import { StateSelect } from '@/app/shared/components/StateSelect';
import { LookupSelect } from '@/app/shared/components/LookupSelect';
import { LookupTypeName } from '@/app/shared/types/lookup';

interface PhysicalTraitsSectionProps {
  readonly sex?: string | null;
  readonly weight?: string | null;
  readonly hairColor?: string | null;
  readonly eyeColor?: string | null;
  readonly race?: string | null;
  readonly birthCity?: string | null;
  readonly birthState?: string | null;
  readonly birthCountry?: string | null;
  readonly marks?: string | null;
  update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]): void;
  readonly editing: boolean;
  setHeight(feet: string, inches: string): void;
  readonly heightFeet: string;
  readonly heightInches: string;
}

export const PhysicalTraitsSection = memo(function PhysicalTraitsSection({ 
  sex,
  weight,
  hairColor,
  eyeColor,
  race,
  birthCity,
  birthState,
  birthCountry,
  marks,
  update, 
  editing, 
  setHeight, 
  heightFeet, 
  heightInches 
}: PhysicalTraitsSectionProps) {
  return (
    <FieldSet className="card section">
      <FieldLegend>Physical Traits & Birth</FieldLegend>
      <div className="grid grid-cols-5 gap-4">
        <Field>
          <FieldLabel>Sex</FieldLabel>
          <Select value={sex || undefined} onValueChange={(value) => update('sex', value || undefined)} disabled={!editing}>
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
          <Input value={weight || ''} onChange={e => update('weight', e.target.value)} disabled={!editing} placeholder="lbs" />
        </Field>
        <Field>
          <FieldLabel>Hair Color</FieldLabel>
          <LookupSelect
            typeName={LookupTypeName.HAIR}
            value={hairColor || ''}
            onChange={(value) => update('hairColor', value)}
            placeholder="Select color"
            disabled={!editing}
          />
        </Field>
        <Field>
          <FieldLabel>Eye Color</FieldLabel>
          <LookupSelect
            typeName={LookupTypeName.EYES}
            value={eyeColor || ''}
            onChange={(value) => update('eyeColor', value)}
            placeholder="Select color"
            disabled={!editing}
          />
        </Field>

        <Field>
          <FieldLabel>Race</FieldLabel>
          <LookupSelect
            typeName={LookupTypeName.RACE}
            value={race || ''}
            onChange={(value) => update('race', value)}
            placeholder="Select race"
            disabled={!editing}
          />
        </Field>
        <Field>
          <FieldLabel>Birth City</FieldLabel>
          <Input value={birthCity || ''} onChange={e => update('birthCity', e.target.value)} disabled={!editing} />
        </Field>
        <Field>
          <FieldLabel>Birth State</FieldLabel>
          <StateSelect 
            value={birthState} 
            onValueChange={(value) => update('birthState', value)} 
            disabled={!editing}
          />
        </Field>
        <Field>
          <FieldLabel>Birth Country</FieldLabel>
          <Input value={birthCountry || ''} onChange={e => update('birthCountry', e.target.value)} disabled={!editing} />
        </Field>
        <Field className="col-span-2">
          <FieldLabel>Marks</FieldLabel>
          <Textarea 
            value={marks || ''} 
            onChange={e => update('marks', e.target.value)} 
            disabled={!editing} 
            rows={2} 
            className="resize-none"
          />
        </Field>
      </div>
    </FieldSet>
  );
});
