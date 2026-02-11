import { Button } from '@/components/ui/button';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { CancelButton } from '@/app/shared/components/CancelButton';
import { LayawayForfeitSearchBar } from './ForfeitSearchBar';
import { useState } from 'react';
import { layawayApi } from '@/app/core/api/layawayApi';
import { LayawayList } from '../layaway/maintain/LayawayList';
import LayawayWorkspace from '../layaway/LayawayWorkspace';

function LayawayForfeitWorkspaceContent() {

  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const searchLayaways = async ({ from, to, ticketNumber }: { from: string; to: string; ticketNumber: string }) => {
    try {
      let results: any[] = [];

      if (ticketNumber.trim()) {
        results = await layawayApi.getByDateRange(from, to, 'defaulted', ticketNumber.trim());
      } else if (from && to) {
        results = await layawayApi.getByDateRange(from, to, 'defaulted');
      }

      console.log(results);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching pawns:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTicket = (row: any) => {
    setSelectedTicket(row);
  };

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">Layaway Forfeit (Pull)</h1>


      <div className="flex flex-col space-y-4">
        {!selectedTicket && (
          <><div className='self-end'>
            <CancelButton />
          </div>

            <div className="grid grid-cols-5 gap-4">
              <FieldSet className="card section col-span-2">
                <FieldLegend className="mb-2 text-sm">Personal Information</FieldLegend>
                <LayawayForfeitSearchBar searchLayaways={searchLayaways} loading={loading} />
              </FieldSet>
            </div>

            <div className='mt-4'>
              <LayawayList layaways={searchResults} loading={loading} handleOpenTicket={handleOpenTicket} />
            </div>
          </>
        )}

        {selectedTicket && (
          <div className="space-y-4">
            <LayawayWorkspace initialTicket={selectedTicket} mode="VIEW" isLayaway={true} isPull />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>Back to results</Button>
            </div>
          </div>
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
