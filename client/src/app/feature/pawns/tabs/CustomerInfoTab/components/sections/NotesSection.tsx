import { Field, FieldSet, FieldLegend } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { CustomerRecord } from '../../mappers';

interface NotesSectionProps {
  form: CustomerRecord;
  update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]): void;
}

export function NotesSection({ form, update }: NotesSectionProps) {
  return (
    <FieldSet className="card section h-full">
      <FieldLegend>Notes</FieldLegend>
      <Field className="h-[calc(100%-2rem)]">
        <Textarea 
          value={form.description || ''} 
          onChange={e => update('description', e.target.value)} 
          className="h-full resize-none"
          placeholder="Notes / description" 
        />
      </Field>
    </FieldSet>
  );
}
