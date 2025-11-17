import { useState, useCallback } from 'react';
import PawnTicketForm from './components/PawnTicketForm';
import type { InventoryItemDraft } from './components/InventoryItemModal';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NewPawnTabProps {
  onTicketCreated?: (ticketId: string) => void;
}

export default function NewPawnTab({ onTicketCreated }: NewPawnTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = useCallback(async (formData: {
    customerId: string;
    type: 'PAWN' | 'PURCHASE';
    amountFinanced?: number;
    purchaseTradeValue?: number;
    periodicRate?: number;
    items: InventoryItemDraft[];
  }) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Implement API call to create pawn ticket
      console.log('Creating pawn ticket:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTicketId = 'ticket_' + Date.now();
      setSuccess(`Pawn ticket ${mockTicketId} created successfully!`);
      onTicketCreated?.(mockTicketId);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pawn ticket');
    } finally {
      setIsSubmitting(false);
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

      <div className={isSubmitting ? 'opacity-60 pointer-events-none relative' : ''}>
        {isSubmitting && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 px-6 py-3 rounded-lg shadow-lg font-medium text-gray-700">
            Processing...
          </div>
        )}
        <PawnTicketForm
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
}
