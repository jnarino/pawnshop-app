import { useCallback, useState } from 'react';
import PawnTicketForm from './components/PawnTicketForm';
import type { InventoryItemDraft } from './components/InventoryItemModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Customer } from '@/app/feature/customer';
import { useCreatePawnTicket } from '../../hooks/useCreatePawnTicket';
import { usePawnPrint, type PrintItem, type FormDataItem } from '../../hooks/usePawnPrint';
import { PrintLabelsModal } from './components/PrintLabelsModal';

interface NewPawnTabProps {
  customer: Customer | null;
  onTicketCreated?: (ticketId: string) => void;
}

export default function NewPawnTab({ customer, onTicketCreated }: NewPawnTabProps) {
  const { createTicket, isLoading, error, success } = useCreatePawnTicket();
  const { printTransactionForm, printLabels, buildPrintItems, formError } = usePawnPrint();
  const customerId = customer?.id;

  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [pendingPrintData, setPendingPrintData] = useState<{
    controlNumber: string;
    items: PrintItem[];
  } | null>(null);

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
          categoryId: item.type,
          quantity: Number(item.quantity) || 1,
          brand: item.brand,
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

    const result = await createTicket(payload);
    
    if (customer) {
      const printFormItems: FormDataItem[] = formData.items.map(item => ({
        type: item.type,
        brand: item.brand,
        model: item.model,
        serial: item.serial,
        description: item.description,
        amount: item.amount,
        quantity: item.quantity,
        ownerNumber: item.ownerNumber,
      }));

      await printTransactionForm({
        ticket: result,
        customer,
        items: printFormItems,
      });

      const printItems = buildPrintItems(result, printFormItems);
      setPendingPrintData({
        controlNumber: result.controlNumber,
        items: printItems,
      });
      setShowLabelsModal(true);
    }

    if (onTicketCreated) {
      onTicketCreated(result.id);
    }
  }, [customerId, customer, createTicket, onTicketCreated, printTransactionForm, buildPrintItems]);

  const handlePrintLabels = useCallback(async (labelCounts: Record<string, number>) => {
    if (pendingPrintData) {
      await printLabels(pendingPrintData.controlNumber, pendingPrintData.items, labelCounts);
    }
    setShowLabelsModal(false);
    setPendingPrintData(null);
  }, [pendingPrintData, printLabels]);

  const handleCancelLabels = useCallback(() => {
    setShowLabelsModal(false);
    setPendingPrintData(null);
  }, []);

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

      {formError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="flex items-center gap-2">
            <span className="text-lg">🖨️</span> Print error: {formError}
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

      {pendingPrintData && (
        <PrintLabelsModal
          open={showLabelsModal}
          controlNumber={pendingPrintData.controlNumber}
          items={pendingPrintData.items}
          onPrint={handlePrintLabels}
          onCancel={handleCancelLabels}
        />
      )}
    </div>
  );
}
