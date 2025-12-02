import { memo } from 'react';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CustomerRecord } from '../../mappers';
import { HAIR_COLORS, RACES, EYE_COLORS } from '../../constants/customerConstants';
import { StateSelect } from '../../../../shared/components/StateSelect';

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
          <Select value={hairColor || undefined} onValueChange={(value) => update('hairColor', value)} disabled={!editing}>
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {HAIR_COLORS.map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Eye Color</FieldLabel>
          <Select value={eyeColor || undefined} onValueChange={(value) => update('eyeColor', value)} disabled={!editing}>
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {EYE_COLORS.map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Race</FieldLabel>
          <Select value={race || undefined} onValueChange={(value) => update('race', value)} disabled={!editing}>
            <SelectTrigger>
              <SelectValue placeholder="Select race" />
            </SelectTrigger>
            <SelectContent>
              {RACES.map(race => <SelectItem key={race} value={race}>{race}</SelectItem>)}
            </SelectContent>
          </Select>
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
