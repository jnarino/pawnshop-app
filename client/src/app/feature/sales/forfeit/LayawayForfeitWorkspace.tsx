import { Button } from '@/components/ui/button';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { CancelButton } from '@/app/shared/components/CancelButton';
import { PrintLabelsModal } from '@/app/feature/_shared/pawn-ticket/components/PrintLabelsModal';
// import { PawnList } from './PawnList';
// import { PawnItemList } from './PawnItemList';
import { useForfeitStore } from '@/app/feature/pawns/forfeit/stores/forfeitStore';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ForfeitSearchBar } from '@/app/shared/components/ForfeitSearchBar';

function LayawayForfeitWorkspaceContent() {
  const { submitForfeit, selectedItems, reset, createdItems, closePrintModal, selectedPawn, loadingProcessPull, submitError } = useForfeitStore();

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">Layaway Forfeit (Pull)</h1>

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
            {/* <PawnList /> */}
          </div>
        </div>

        <div className='mt-4'>
          {/* <PawnItemList /> */}
        </div>

        {selectedItems.length > 0 && (
          <div className="flex justify-end mt-4">
            <Button
              onClick={submitForfeit}
              disabled={!selectedItems.every(item => item.status === 'Pulled')}
            >
              Process Pull
            </Button>

            {loadingProcessPull && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
          </div>
        )}

        <PrintLabelsModal
          open={createdItems.length > 0}
          controlNumber={selectedPawn?.controlNumber || ''}
          items={createdItems}
          onPrint={(counts) => {
            closePrintModal();
          }}
          onCancel={closePrintModal}
        />

        {(submitError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
}

export default function LayawayForfeitWorkspace() {
  return (
    <LayawayForfeitWorkspaceContent />
  );
}
