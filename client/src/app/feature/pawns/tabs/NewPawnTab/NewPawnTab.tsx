import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawnTicketForm, PrintLabelsModal, type InventoryItemDraft, type PawnFormDraftState } from '@/app/feature/_shared/pawn-ticket';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Customer } from '@/app/feature/_shared/customer';
import { useCreatePawnTicket } from '../../hooks/useCreatePawnTicket';
import { usePawnWorkflow } from '../../contexts/PawnWorkflowContext';
import { usePawnPrint, type PrintItem, type FormDataItem } from '../../hooks/usePawnPrint';
import { useAuth } from '@/app/core/hooks/useAuth';
import type { TicketByControlNumber } from '@/app/core/api/pawnTicketApi';

interface NewPawnTabProps {
  readonly customer: Customer | null;
  readonly onTicketCreated?: (ticketId: string) => void;
}

interface PrintState {
  showLabelModal: boolean;
  controlNumber: string;
  printItems: PrintItem[];
  formDataItems: FormDataItem[];
  ticketData: TicketByControlNumber | null;
}

export default function NewPawnTab({ customer, onTicketCreated }: NewPawnTabProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { createTicket, isLoading, error, success } = useCreatePawnTicket();
  const { pawnDraft, updatePawnDraft, resetPawnDraft } = usePawnWorkflow();
  const { printTransactionForm, printLabels, buildPrintItems, formError, labelsError } = usePawnPrint();
  const customerId = customer?.id;

  const [printState, setPrintState] = useState<PrintState>({
    showLabelModal: false,
    controlNumber: '',
    printItems: [],
    formDataItems: [],
    ticketData: null,
  });

  const handleDraftChange = useCallback((draft: PawnFormDraftState) => {
    updatePawnDraft(draft);
  }, [updatePawnDraft]);

  const handleLogoutAfterPrint = useCallback(async () => {
    try {
      await logout();
      if (globalThis.electronAPI?.authChanged) {
        globalThis.electronAPI.authChanged(false);
      }
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  const handleLabelPrint = useCallback(async (labelCounts: Record<string, number>) => {
    if (!printState.ticketData || !customer) return;
    const success = await printLabels(printState.ticketData, customer, printState.printItems, labelCounts);
    if (success) {
      setPrintState(prev => ({ ...prev, showLabelModal: false }));
      resetPawnDraft();
      handleLogoutAfterPrint();
    }
  }, [printState.ticketData, customer, printState.printItems, printLabels, resetPawnDraft, handleLogoutAfterPrint]);

  const handleLabelCancel = useCallback(() => {
    setPrintState(prev => ({ ...prev, showLabelModal: false }));
    resetPawnDraft();
    handleLogoutAfterPrint();
  }, [resetPawnDraft, handleLogoutAfterPrint]);

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

        // Build stones array for backend (convert string values to numbers where needed)
        const stones = item.stones?.map(stone => removeNullish({
          quantity: Number(stone.quantity) || 1,
          type: stone.type || undefined,
          shape: stone.shape || undefined,
          carat: stone.carat ? Number(stone.carat) : undefined,
          color: stone.color || undefined,
          weight: stone.weight ? Number(stone.weight) : undefined,
          length: stone.length ? Number(stone.length) : undefined,
          width: stone.width ? Number(stone.width) : undefined,
          clarity: stone.clarity || undefined,
        }));

        const extra = removeNullish({
          weight: item.weight,
          weightUnit: item.weightUnit,
          stones: stones && stones.length > 0 ? stones : undefined,
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
          extra: Object.keys(extra).length > 0 ? extra : undefined,
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        });
      }),
    };

    const ticketResponse = await createTicket(payload);
    if (ticketResponse && customer) {
      onTicketCreated?.(ticketResponse.id);

      const ticketData: TicketByControlNumber = {
        id: ticketResponse.id,
        controlNumber: ticketResponse.controlNumber,
        transactionType: formData.type,
        customerId: customerId || formData.customerId,
        amountFinanced: formData.amountFinanced || null,
        purchaseTradeValue: formData.purchaseTradeValue || null,
        transactionDate: toISOString(formData.transactionDate),
        maturityDate: toISOString(formData.maturityDate),
        defaultDate: toISOString(formData.expirationDate),
        pawnStatus: 'P',
        itemIds: formData.items.map((_, idx) => `item-${idx}`),
        items: [],
      };

      const rate = formData.periodicRate ? Number(formData.periodicRate) : 0;
      const amountFinanced = formData.amountFinanced || 0;
      const financeCharge = amountFinanced * (rate / 100);
      const totalOfPayments = amountFinanced + financeCharge;
      // APR = (Monthly Rate / 30) * 365
      const annualRate = (rate / 30) * 365;

      const formDataItems: FormDataItem[] = formData.items.map(item => ({
        type: item.subcategoryName || item.type || '',
        brand: item.brandName || item.brand || '',
        model: item.model,
        serial: item.serial,
        description: item.description,
        amount: item.amount,
        quantity: item.quantity,
        ownerNumber: item.ownerNumber,
        categoryName: item.categoryName,
        subcategoryName: item.subcategoryName,
        colorName: item.colorName,
      }));

      await printTransactionForm({
        ticket: ticketData,
        customer,
        items: formDataItems,
        financeCharge,
        totalOfPayments,
        annualRate,
      });

      const printItems = buildPrintItems(ticketData, formDataItems);

      setPrintState({
        showLabelModal: true,
        controlNumber: ticketResponse.controlNumber,
        printItems,
        formDataItems,
        ticketData,
      });
    }
  }, [customerId, createTicket, onTicketCreated, customer, printTransactionForm, buildPrintItems]);

  return (
    <div className="max-w-[1200px] mx-auto bg-white">
      {success && (
        <Alert className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <AlertDescription className="text-green-800 flex items-center gap-2">
            <span className="text-lg">✅</span> {success}
          </AlertDescription>
        </Alert>
      )}

      {(error || formError || labelsError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="flex flex-col gap-2">
            {error && (
              <div className="flex items-center gap-2">
                <span className="text-lg">❌</span> {error}
              </div>
            )}
            {formError && (
              <div className="flex items-center gap-2">
                <span className="text-lg">🖨️</span> <strong>Print Error:</strong> {formError}
              </div>
            )}
            {labelsError && (
              <div className="flex items-center gap-2">
                <span className="text-lg">🏷️</span> <strong>Label Error:</strong> {labelsError}
              </div>
            )}
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

      <PrintLabelsModal
        open={printState.showLabelModal}
        controlNumber={printState.controlNumber}
        items={printState.printItems}
        onPrint={handleLabelPrint}
        onCancel={handleLabelCancel}
      />
    </div>
  );
}