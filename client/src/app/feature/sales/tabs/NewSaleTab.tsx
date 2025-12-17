import { useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Customer } from '@/app/feature/_shared/customer';
import { useCreateSale } from '../hooks/useCreateSale';
import { useSalesWorkflow } from '../contexts/SalesWorkflowContext';
import { SaleForm, type SaleFormDraftState } from '../../_shared/sale/components/SaleForm';
import { type InventoryItemDraft } from '../../_shared/sale/components/InventoryItemModal';

interface NewPawnTabProps {
  readonly customer: Customer | null;
  readonly onTicketCreated?: (ticketId: string) => void;
}

export default function NewPawnTab({ customer, onTicketCreated }: NewPawnTabProps) {
  const { createTicket, isLoading, error, success } = useCreateSale();
  const { pawnDraft, updatePawnDraft, resetPawnDraft } = useSalesWorkflow();
  const customerId = customer?.id;

  const handleDraftChange = useCallback((draft: SaleFormDraftState) => {
    // Only persist items to the global draft, ignore transient form fields
    updatePawnDraft({ items: draft.items });
  }, [updatePawnDraft]);

  const handleSubmit = useCallback(async (formData: {
    customerId: string;
    items: InventoryItemDraft[];
  }) => {
    // ... type conversion helpers ...
    const toISOString = (dateStr?: string): string => {
      if (!dateStr) return new Date().toISOString();
      return new Date(dateStr).toISOString();
    };

    const removeNullish = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
      return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v != null && v !== '')
      ) as Partial<T>;
    };

    const pawnData = removeNullish({
      customerId: customerId || formData.customerId,
    });

    const payload = {
      sale: pawnData,
      items: formData.items.map(item => {
        const attributes = removeNullish({
          sub1: item.sub1,
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
          capacity: item.capacity,
        });

        return removeNullish({
          inventorySubcategoryId: item.subcategoryId,
          quantity: Number(item.quantity) || 1,
          brand: item.brandId,
          model: item.model,
          serialNumber: item.serial,
          itemDescription: item.description,
          priceAmount: Number(item.amount) || 0,
          resale: Number(item.resale) || 0,
          minResale: undefined,
          itemReplace: item.replace ? Number(item.replace) : undefined,
          ownerMark: item.ownerNumber,
          colorId: item.color,
          itemCondition: item.condition,
          extra: Object.keys({}).length > 0 ? {} : undefined,
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        });
      }),
    };

    const ticket = await createTicket(payload);
    if (ticket) {
      // Refresh logic or navigation
      resetPawnDraft();
      // If we need to redirect or show success, we can use ticket.id
      if (onTicketCreated) {
        onTicketCreated(ticket.id);
      }
    }
  }, [customerId, createTicket, onTicketCreated, resetPawnDraft]);

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
        <SaleForm
          externalDraft={{
            ...pawnDraft,
            inventoryNumber: '',
            quantity: 1,
            description: '',
            priceEach: 0
          }}
          onDraftChange={handleDraftChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}