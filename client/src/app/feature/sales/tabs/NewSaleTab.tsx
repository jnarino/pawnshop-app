import { useCallback, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Customer } from '@/app/feature/_shared/customer';
import { useCreateSale } from '../hooks/useCreateSale';
import { useSalesWorkflow } from '../contexts/SalesWorkflowContext';
import { SaleForm, type SaleFormDraftState } from '../../_shared/sale/components/SaleForm';

import PaymentMethodModal, { TenderMethod } from '../../_shared/modal/PaymentMethodModal';
import { useNavigate } from 'react-router-dom';
import { InventoryItemDraft } from '../../_shared/inventory-item';
import { useMemo } from 'react';
import ConfirmModal from '@/app/shared/components/ConfirmModal';
import { useReceiptPrint } from '@/app/core/hooks/useReceiptPrint';

interface NewSaleTabProps {
  readonly customer: Customer | null;
  readonly mode: 'VIEW' | 'CREATE';
  readonly initialTicket?: any;
  readonly onTicketCreated?: (ticketId: string) => void;
}

export default function NewSaleTab({ customer, mode, initialTicket, onTicketCreated }: NewSaleTabProps) {
  const navigate = useNavigate();
  const { createTicket, isLoading, error, success } = useCreateSale();
  const { pawnDraft, updatePawnDraft, resetPawnDraft } = useSalesWorkflow();
  const [taxExemptUsed, setTaxExemptUsed] = useState(false);
  const [eatTax, setEatTax] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingSaleData, setPendingSaleData] = useState<{
    customerId: string;
    items: InventoryItemDraft[];
    taxExemptUsed: boolean;
    eatTax: boolean;
  } | null>(null);



  const [gunLogSuccessMessage, setGunLogSuccessMessage] = useState<string | null>(null);
  const [showReceiptConfirmModal, setShowReceiptConfirmModal] = useState(false);
  const [lastReceipts, setLastReceipts] = useState<any>(null);
  const { printReceipt } = useReceiptPrint();

  const isFirearmSale = useMemo(() => {
    if (!pendingSaleData) return false;
    return pendingSaleData.items.some(item =>
    (!!item.inventoryItem
      .attributes?.action)
    );
  }, [pendingSaleData]);

  const customerId = customer?.id;

  const handleDraftChange = useCallback((draft: SaleFormDraftState) => {
    updatePawnDraft({ items: draft.items });
  }, [updatePawnDraft]);

  const handleSubmit = useCallback(async (formData: {
    customerId: string;
    items: InventoryItemDraft[];
    taxExemptUsed: boolean;
    eatTax: boolean;
  }) => {
    setPendingSaleData({
      customerId: customerId || formData.customerId,
      items: formData.items,
      taxExemptUsed: formData.taxExemptUsed,
      eatTax: formData.eatTax
    });
    setShowPaymentModal(true);
  }, [customerId, taxExemptUsed]);

  // Step 2: User completes payment
  const handlePaymentDone = useCallback(async (tenders: TenderMethod[], gunLogData?: { nicsNumber: string; notes: string; comments: string, gunFee: number }) => {
    if (!pendingSaleData) return;
    setShowPaymentModal(false);

    const payload = {
      customerId: pendingSaleData.customerId,
      taxExemptUsed: pendingSaleData.taxExemptUsed,
      eatTax: pendingSaleData.eatTax,
      items: pendingSaleData.items.map(item => ({
        inventoryItemId: item.inventoryItem?.id,
        inventoryNumber: item.inventoryItem?.inventoryNumber || item.inventoryNumber || '',
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        price: Number(item.priceEach) || 0,
      })),
      tenders: tenders.map(t => ({
        tenderTypeId: t.tenderTypeId,
        amount: parseFloat(t.amount)
      })),
      ...(gunLogData && isFirearmSale ? {
        nicstn: gunLogData.nicsNumber,
        gunNotes1: gunLogData.comments,
        gunNotes2: gunLogData.notes,
        gunFee: gunLogData.gunFee
      } : {})
    };

    const result = await createTicket(payload as any);

    if (result) {
      if (isFirearmSale && result.gunTransferNumber) {
        setLastReceipts(result);
        setGunLogSuccessMessage(`The assigned ATF 4473 number is - ${result.gunTransferNumber}`);
        setShowReceiptConfirmModal(true);
        // We delay the navigate/reset until after the confirm modal is handled or just let it stay open?
        // In LocatePawnsTab, we don't navigate away, we just refresh.
        // Here, a "New Sale" usually resets or navigates away.
        // If we navigate immediately, the modal might be lost or we might navigate to a success page?
        // User requirement says "show setShowReceiptConfirmModal".
        // If I navigate immediately, the user won't see the modal on this screen.
        // I should probably wait for the modal interaction.
      } else {
        resetPawnDraft();
        if (onTicketCreated) {
          onTicketCreated(result.id);
        }
        //navigate(`/`);
      }
    }
  }, [pendingSaleData, createTicket, resetPawnDraft, onTicketCreated, navigate, isFirearmSale]);

  const handleReceiptConfirm = async () => {
    setShowReceiptConfirmModal(false);

    if (!!lastReceipts) {
      await printReceipt(lastReceipts, 'SALE');
    }

    resetPawnDraft();
  };

  const handleReceiptCancel = () => {
    setShowReceiptConfirmModal(false);
    resetPawnDraft();
    navigate(`/`);
  };

  const calculateTotal = useCallback(() => {
    if (!pendingSaleData) return 0;
    const itemsTotal = pendingSaleData.items.reduce((sum, item) => {
      return sum + (Number(item.priceEach || 0) * Number(item.quantity || 1));
    }, 0);

    if (pendingSaleData.taxExemptUsed) {
      return itemsTotal;
    }

    if (pendingSaleData.eatTax) {
      return itemsTotal; // Total is the sum of items when eating tax
    }

    const tax = itemsTotal * 0.065;
    return Number((itemsTotal + tax).toFixed(2));
  }, [pendingSaleData]);

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
          mode={mode}
          externalDraft={mode === 'VIEW' ? initialTicket : {
            ...pawnDraft,
            inventoryNumber: '',
            quantity: 1,
            description: '',
            priceEach: 0
          }}
          initialData={mode === 'VIEW' ? initialTicket : undefined}
          customer={customer || undefined}
          taxExemptUsed={taxExemptUsed}
          setTaxExemptUsed={setTaxExemptUsed}
          eatTax={eatTax}
          setEatTax={setEatTax}
          onDraftChange={handleDraftChange}
          onSubmit={handleSubmit}
          disabled={isLoading || mode === 'VIEW'}
        />
      </div>

      {showPaymentModal && pendingSaleData && (
        <PaymentMethodModal
          open={showPaymentModal}
          totalAmount={calculateTotal()}
          allowedTenderTypes={[1, 2, 3, 4, 5, 6, 7, 8]} // CASH and DEBIT
          onCancel={() => setShowPaymentModal(false)}
          onDone={handlePaymentDone}
          showGunProcessingFee={isFirearmSale}
        />
      )}

      <ConfirmModal
        open={showReceiptConfirmModal}
        title={gunLogSuccessMessage ? "Success" : "Print Confirmation"}
        message={gunLogSuccessMessage ?
          `${gunLogSuccessMessage}. Do you want to print sale receipt?` :
          "Do you want to print sale receipt?"
        }
        confirmText="Yes, print"
        cancelText="No"
        onConfirm={handleReceiptConfirm}
        onCancel={handleReceiptCancel}
      />
    </div>
  );
}