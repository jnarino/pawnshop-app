import { useCallback } from 'react';
import PawnTicketForm from './components/PawnTicketForm';
import type { InventoryItemDraft } from './components/InventoryItemModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Customer } from '@/app/feature/customer';
import { useCreatePawnTicket } from '../../hooks/useCreatePawnTicket';

interface NewPawnTabProps {
  customer: Customer | null;
  onTicketCreated?: (ticketId: string) => void;
}

export default function NewPawnTab({ customer, onTicketCreated }: NewPawnTabProps) {
  const { isLoading, error, success } = useCreatePawnTicket();
  const customerId = customer?.id;

  const handleSuccess = useCallback((data: any) => {
    const ticketId = data.id || data.pawnTicket?.id;
    if (onTicketCreated && ticketId) {
      onTicketCreated(ticketId);
    }
  }, [onTicketCreated]);

  return (
    <div className="max-w-[1200px] mx-auto bg-white">
      {success && (
        <Alert className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <AlertDescription className="text-green-800 flex items-center gap-2">
            <span className="text-lg">✅</span> {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="flex items-center gap-2">
            <span className="text-lg">❌</span> {error}
          </AlertDescription>
        </Alert>
      )}

      <div className={isLoading ? 'opacity-60 pointer-events-none relative' : ''}>
        {isLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 px-6 py-3 rounded-lg shadow-lg font-medium text-gray-700">
            Processing...
          </div>
        )}
        <PawnTicketForm
          customerId={customerId || ''}
          onSuccess={handleSuccess}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
