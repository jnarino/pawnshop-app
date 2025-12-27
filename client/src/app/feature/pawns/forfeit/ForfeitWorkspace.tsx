import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { RangeDatePicker } from '@/components/ui/range-date-picker';
import { CancelButton } from '@/app/shared/components/CancelButton';
import { useForfeitForm } from './hooks/useForfeitForm';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { PawnTableList } from './PawnTableList';

export type ForfeitTabKey = 'pull-transaction';

function ForfeitWorkspaceContent() {

  const { form, submitForfeit, items } = useForfeitForm();

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">Forfeit (Pull)</h1>

      <div className="flex flex-col space-y-4">
        <div className='self-end'>
          <CancelButton />
        </div>
        <form onSubmit={form.handleSubmit(submitForfeit)} className="grid grid-cols-5 gap-4">
          <FieldSet className="card section col-span-2">
            <FieldLegend className="mb-2 text-sm">Personal Information</FieldLegend>
            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-2">
                <Controller
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <RangeDatePicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Button type="submit">Search</Button>
              </div>

              <div className="grid grid-cols-2">
                <Field>
                  <FieldLabel>Ticket #</FieldLabel>
                  <Controller
                    control={form.control}
                    name="ticketNumber"
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value}
                        onChange={field.onChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            form.handleSubmit(submitForfeit)();
                          }
                        }}
                      />
                    )}
                  />
                </Field>
              </div>
            </div>
          </FieldSet>
          <div className='col-span-3'>
            <PawnTableList items={items} />
          </div>
        </form>
      </div>
    </>
  );
}

export default function ForfeitWorkspace() {
  return (
    <ForfeitWorkspaceContent />
  );
}
