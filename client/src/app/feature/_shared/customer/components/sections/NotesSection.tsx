import { memo } from 'react';
import { Field, FieldSet, FieldLegend } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { CustomerRecord } from '../../mappers';

interface NotesSectionProps {
  readonly description?: string | null;
  readonly update: <K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) => void;
  readonly editing: boolean;
}

export const NotesSection = memo(function NotesSection({ description, update, editing }: NotesSectionProps) {
  return (
    <FieldSet className="card section h-full">
      <FieldLegend>Notes</FieldLegend>
      <Field className="h-[calc(100%-2rem)]">
        <Textarea 
          value={description || ''} 
          onChange={e => update('description', e.target.value)} 
          className="h-full resize-none"
          placeholder="Notes / description"
          disabled={!editing}
        />
      </Field>
    </FieldSet>
  );
});
