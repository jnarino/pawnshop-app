import { useCallback, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Customer } from '@/app/feature/_shared/customer';
import { useCreateSale } from '../hooks/useCreateSale';
import { useSalesWorkflow } from '../contexts/SalesWorkflowContext';
import { SaleForm, type SaleFormDraftState } from '../../_shared/sale/components/SaleForm';
import { type InventoryItemDraft } from '../../_shared/sale/components/InventoryItemModal';
import PaymentMethodModal from '../../_shared/modal/PaymentMethodModal';

interface NewPawnTabProps {
  readonly customer: Customer | null;
  readonly onTicketCreated?: (ticketId: string) => void;
}

export default function NewPawnTab({ customer, onTicketCreated }: NewPawnTabProps) {
  const { createTicket, isLoading, error, success } = useCreateSale();
  const { pawnDraft, updatePawnDraft, resetPawnDraft } = useSalesWorkflow();
  const [taxExemptUsed, setTaxExemptUsed] = useState(false);
  const [eatTax, setEatTax] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingSaleData, setPendingSaleData] = useState<{
    customerId: string;
    taxExemptUsed: boolean;
    items: InventoryItemDraft[];
  } | null>(null);

  const customerId = customer?.id;

  const handleDraftChange = useCallback((draft: SaleFormDraftState) => {
    updatePawnDraft({ items: draft.items });
  }, [updatePawnDraft]);

  const handleSubmit = useCallback(async (formData: {
    customerId: string;
    taxExemptUsed: boolean;
    items: InventoryItemDraft[];
  }) => {
    setPendingSaleData({
      customerId: customerId || formData.customerId,
      taxExemptUsed,
      items: formData.items
    });
    setShowPaymentModal(true);
  }, [customerId, taxExemptUsed]);

  // Step 2: User completes payment
  const handlePaymentDone = useCallback(async (tenders: any[]) => {
    if (!pendingSaleData) return;
    setShowPaymentModal(false);

    const payload = {
      customerId: pendingSaleData.customerId,
      taxExemptUsed,
      items: pendingSaleData.items.map(item => ({
        inventoryItemId: item.inventoryItem?.id, // Existing item ID
        inventoryNumber: item.inventoryItem?.inventoryNumber || item.inventoryNumber || '',
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        price: Number(item.priceEach) || 0,
      })),
      tenders: tenders.map(t => ({
        tenderTypeId: t.tenderTypeId,
        amount: parseFloat(t.amount)
      }))
    };

    const result = await createTicket(payload as any); // Type assertion until hooks/api types updated

    if (result) {
      resetPawnDraft();
      if (onTicketCreated) {
        onTicketCreated(result.id);
      }
    }
  }, [pendingSaleData, createTicket, resetPawnDraft, onTicketCreated]);

  const calculateTotal = () => {
    if (!pendingSaleData) return 0;
    const itemsTotal = pendingSaleData.items.reduce((sum, item) => {
      return sum + (Number(item.priceEach || 0) * Number(item.quantity || 1));
    }, 0);

    if (taxExemptUsed) {
      return itemsTotal;
    }

    if (eatTax) {
      return itemsTotal; // Total is the sum of items when eating tax
    }

    const tax = itemsTotal * 0.065;
    return itemsTotal + tax;
  };

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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 px-6 py-3 rounded-lg shadow-lg font-medium text-gray-700 z-50">
            Processing transaction...
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
          customer={customer || undefined}
          taxExemptUsed={taxExemptUsed}
          setTaxExemptUsed={setTaxExemptUsed}
          eatTax={eatTax}
          setEatTax={setEatTax}
          onDraftChange={handleDraftChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>

      {showPaymentModal && pendingSaleData && (
        <PaymentMethodModal
          open={showPaymentModal}
          totalAmount={calculateTotal()}
          onCancel={() => setShowPaymentModal(false)}
          onDone={handlePaymentDone}
        />
      )}
    </div>
  );
}