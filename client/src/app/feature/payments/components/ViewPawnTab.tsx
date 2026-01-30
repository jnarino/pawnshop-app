import { useCallback, useState } from 'react';
import { PawnTicketForm } from '@/app/feature/_shared/pawn-ticket';
import type { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { Button } from '@/components/ui/button';
import type { PawnTicketData, CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import { DueDateCalculatorModal } from './DueDateCalculatorModal';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import { formatDate } from '@/lib/utils';
import { extractId, transformStones } from '@/app/shared/components/ElectronMenuBridge';
import { transformPawnTicketToFormData } from '../../pawns/maintain/PawnsMaintainWorkspace';

interface ViewPawnTabProps {
  readonly pawnTicket: PawnTicketData;
  readonly customer?: CustomerData;
  readonly onBack: () => void;
  readonly onMakePayment: () => void;
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
