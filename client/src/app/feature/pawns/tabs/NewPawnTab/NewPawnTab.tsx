import { useState, useCallback } from 'react';
import './NewPawnTab.css';
import PawnTicketForm from './components/PawnTicketForm';
import type { InventoryItemDraft } from './components/InventoryItemModal';

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
    <div className="tab-content">
      {success && (
        <div className="status-message status-success">
          ✅ {success}
        </div>
      )}

      {error && (
        <div className="status-message status-error">
          ❌ {error}
        </div>
      )}

      <div className={isSubmitting ? 'form-loading' : ''}>
        <PawnTicketForm
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
}
