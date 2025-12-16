import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { PawnTicketForm, type InventoryItemDraft, type PawnFormDraftState } from '@/app/feature/_shared/pawn-ticket';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Customer } from '@/app/feature/_shared/customer';
import { useCreatePawnTicket } from '../../hooks/useCreatePawnTicket';
import { usePawnWorkflow } from '../../contexts/PawnWorkflowContext';
import type { RootState } from '@/app/core/redux/store';

interface NewPawnTabProps {
  readonly customer: Customer | null;
  readonly onTicketCreated?: (ticketId: string) => void;
}

export default function NewPawnTab({ customer, onTicketCreated }: NewPawnTabProps) {
  const { createTicket, isLoading, error, success } = useCreatePawnTicket();
  const { pawnDraft, updatePawnDraft, resetPawnDraft } = usePawnWorkflow();
  const customerId = customer?.id;
  const authenticatedUser = useSelector((state: RootState) => state.auth.user);

  const handleDraftChange = useCallback((draft: PawnFormDraftState) => {
    updatePawnDraft(draft);
  }, [updatePawnDraft]);

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
      transactionType: formData.type,
      clerkUserId: authenticatedUser?.id ? String(authenticatedUser.id) : undefined,
      amountFinanced: formData.type === 'PAWN' ? formData.amountFinanced : undefined,
      purchaseTradeValue: formData.type === 'PURCHASE' ? formData.purchaseTradeValue : undefined,
      periodicRate: formData.periodicRate ? formData.periodicRate / 100 : undefined,
      transactionDate: toISOString(formData.transactionDate),
      maturityDate: toISOString(formData.maturityDate),
      defaultDate: toISOString(formData.expirationDate),
    });

    const payload = {
      pawn: pawnData,
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

    const ticketId = await createTicket(payload);
    if (ticketId) {
      resetPawnDraft();
      if (onTicketCreated) {
        onTicketCreated(ticketId);
      }
    }
  }, [customerId, createTicket, onTicketCreated, resetPawnDraft, authenticatedUser]);

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
          externalDraft={pawnDraft}
          onDraftChange={handleDraftChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}