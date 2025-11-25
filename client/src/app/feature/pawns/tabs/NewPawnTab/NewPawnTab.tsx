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
  const { createTicket, isLoading, error, success } = useCreatePawnTicket();
  const customerId = customer?.id;

  const handleSubmit = useCallback(async (formData: {
    customerId: string;
    type: 'PAWN' | 'PURCHASE';
    amountFinanced?: number;
    purchaseTradeValue?: number;
    periodicRate?: number;
    transactionDate?: string;
    maturityDate?: string;
    expirationDate?: string;
    items: InventoryItemDraft[];
  }) => {
    if (!customerId) {
      // We can handle this validation here or let the hook/service handle it if appropriate
      // For now, let's just alert or log, but ideally the form shouldn't submit without a customer
      console.error("No customer selected");
      return;
    }

    try {
      const payload = {
        customerId: customerId,
        type: formData.type,
        amountFinanced: formData.amountFinanced,
        periodicRate: formData.periodicRate,
        purchaseTradeValue: formData.purchaseTradeValue,
        transactionDate: formData.transactionDate ? new Date(formData.transactionDate).toISOString() : new Date().toISOString(),
        maturityDate: formData.maturityDate,
        defaultDate: formData.expirationDate, // Map expirationDate to defaultDate
        newInventoryItems: formData.items.map(item => ({
          categoryId: item.type, // Assuming type is categoryId
          brand: item.brand,
          model: item.model,
          serialNumber: item.serial,
          colorId: item.color,
          itemCondition: item.condition,
          quantity: Number(item.quantity),
          priceAmount: Number(item.amount),
          resale: Number(item.resale),
          itemReplace: Number(item.replace),
          ownerMark: item.ownerNumber,
          itemDescription: item.description,
          attributes: {
            metal: item.metal,
            karat: item.karat,
            weight: item.weight,
            weightUnit: item.weightUnit,
            gender: item.gender,
            style: item.style,
            sizeLength: item.sizeLength,
            caliber: item.caliber,
            action: item.action,
            barrelLength: item.barrelLength,
            capacity: item.capacity
          }
        }))
      };

      const ticketId = await createTicket(payload);
      onTicketCreated?.(ticketId);
      
    } catch (err) {
      console.error('Error creating pawn ticket:', err);
    }
  }, [customerId, onTicketCreated, createTicket]);

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
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
