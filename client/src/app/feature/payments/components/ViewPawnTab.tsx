import { useCallback, useState } from 'react';
import { PawnTicketForm } from '@/app/feature/_shared/pawn-ticket';
import type { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { Button } from '@/components/ui/button';
import type { PawnTicketData, CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import { DueDateCalculatorModal } from './DueDateCalculatorModal';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import { formatDate } from '@/lib/utils';
import { extractId, transformStones } from '@/app/shared/components/ElectronMenuBridge';

interface ViewPawnTabProps {
  readonly pawnTicket: PawnTicketData;
  readonly customer?: CustomerData;
  readonly onBack: () => void;
  readonly onMakePayment: () => void;
}

function transformPawnTicketToFormData(pawnTicket: PawnTicketData) {

  const getBrandName = (brand: string | { id: string; name: string } | undefined): string => {
    if (!brand) return '';
    if (typeof brand === 'object' && brand.name) return brand.name;
    if (typeof brand === 'string') return brand;
    return '';
  };

  const transformedItems: InventoryItemDraft[] = (pawnTicket.items || []).map((item) => ({
    id: item.id,
    type: item.inventoryCategory?.id || item.legacyCategoryDescription || 'Item',
    categoryName: item.inventoryCategory?.name || item.legacyCategoryDescription || '',
    subcategoryId: item.inventorySubcategory?.id || '',
    subcategoryName: item.inventorySubcategory?.name || '',
    brandId: typeof item.brand === 'object' ? item.brand?.id : '',
    brandName: getBrandName(item.brand),
    model: item.model || '',
    serial: item.serialNumber || '',
    color: extractId(item.colorId),
    condition: item.itemCondition || '',
    quantity: String(item.quantity || 1),
    amount: String(item.priceAmount || 0),
    resale: String(item.resale || 0),
    replace: String(item.itemReplace || 0),
    ownerNumber: item.inventoryNumber || '',
    description: item.itemDescription || '',
    metal: extractId(item.attributes?.metal),
    karat: extractId(item.attributes?.karat),
    weight: extractId(item.extra?.weight),
    weightUnit: extractId(item.extra?.weightUnit) || 'Grams',
    gender: extractId(item.extra?.gender),
    style: extractId(item.attributes?.style),
    sizeLength: extractId(item.extra?.size),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stones: transformStones(item.extra?.stones as any),
  }));

  const transactionType = pawnTicket.transactionType?.toUpperCase();

  return {
    customerId: pawnTicket.customerId,
    type: transactionType === 'PURCHASE' ? 'PURCHASE' as const : 'PAWN' as const,
    periodicRate: String(Math.round((pawnTicket.periodicRate || 0) * 100)),
    transactionDate: formatDate(pawnTicket.transactionDate),
    maturityDate: formatDate(pawnTicket.maturityDate),
    expirationDate: formatDate(pawnTicket.defaultDate),
    items: transformedItems
  };
}

export function ViewPawnTab({ pawnTicket, customer, onBack, onMakePayment }: ViewPawnTabProps) {
  const pawnData = transformPawnTicketToFormData(pawnTicket);
  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);

  const handlePayHistory = useCallback(() => {
    setIsPaymentHistoryModalOpen(true);
  }, []);

  const handleDueDates = useCallback(() => {
    setIsDueDateModalOpen(true);
  }, []);

  return (
    <div className="p-6">
      <PawnTicketForm
        mode="VIEW"
        initialData={pawnData}
        controlNumber={pawnTicket.controlNumber}
        pawnTicket={pawnTicket}
        customer={customer}
      />
      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="secondary"
          size="lg"
          onClick={handlePayHistory}
          className="px-8"
        >
          Pay History
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleDueDates}
          className="px-8"
        >
          Due Dates
        </Button>
      </div>

      <DueDateCalculatorModal
        open={isDueDateModalOpen}
        onClose={() => setIsDueDateModalOpen(false)}
        pawnAmount={pawnTicket.amountFinanced || 0}
        transactionDate={pawnTicket.transactionDate}
        periodicRate={pawnTicket.periodicRate || 0}
      />

      <PaymentHistoryModal
        open={isPaymentHistoryModalOpen}
        onClose={() => setIsPaymentHistoryModalOpen(false)}
        pawnTicketId={pawnTicket.id}
      />
    </div>
  );
}
