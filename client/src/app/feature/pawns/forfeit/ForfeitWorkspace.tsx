import { Button } from '@/components/ui/button';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { CancelButton } from '@/app/shared/components/CancelButton';
import { PawnList } from './PawnList';
import { PawnItemList } from './PawnItemList';
import { ForfeitSearchBar } from './ForfeitSearchBar';
import { useForfeitStore } from './stores/forfeitStore';

function ForfeitWorkspaceContent() {
  const { submitForfeit, selectedItems, reset } = useForfeitStore();

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">Forfeit (Pull)</h1>

      <div className="flex flex-col space-y-4">
        <div className='self-end'>
          <CancelButton onCancelTransaction={reset} />
        </div>

        <div className="grid grid-cols-5 gap-4">
          <FieldSet className="card section col-span-2">
            <FieldLegend className="mb-2 text-sm">Personal Information</FieldLegend>
            <ForfeitSearchBar />
          </FieldSet>
          <div className='col-span-3'>
            <PawnList />
          </div>
        </div>

        <div className='mt-4'>
          <PawnItemList />
        </div>

        {selectedItems.length > 0 && (
          <div className="flex justify-end mt-4">
            <Button
              onClick={submitForfeit}
              disabled={!selectedItems.every(item => item.status === 'Pulled')}
            >
              Process Pull
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export default function ForfeitWorkspace() {
  return (
    <ForfeitWorkspaceContent />
  );
}
