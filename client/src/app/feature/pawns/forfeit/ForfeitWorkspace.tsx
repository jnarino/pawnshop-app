import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { RangeDatePicker } from '@/components/ui/range-date-picker';
import { CancelButton } from '@/app/shared/components/CancelButton';
import { useForfeitForm } from './hooks/useForfeitForm';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { PawnList } from './PawnList';
import { PawnItemList } from './PawnItemList';

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
        <form onSubmit={form.handleSubmit(submitForfeit)} >
          <div className="grid grid-cols-5 gap-4">
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
              <PawnList items={items} />
            </div>
          </div>
          <div className=''>
            <PawnItemList items={[{ id: '1', description: "Gun 1", quantity: 1, amountEach: 75.2, status: "Pending to pull", amountTotal: 75.2 },
            { id: '1', description: "Gun 2", quantity: 2, amountEach: 3.1, status: "Pulled", amountTotal: 6.2 }
            ]} />

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
