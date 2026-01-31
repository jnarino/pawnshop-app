import { PawnTicketForm } from '@/app/feature/_shared/pawn-ticket';
import { Button } from '@/components/ui/button';
import type { PawnTicketData, CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import { transformPawnTicketToFormData } from '../../pawns/maintain/PawnsMaintainWorkspace';

interface ViewPawnTabProps {
  readonly pawnTicket: PawnTicketData;
  readonly customer?: CustomerData;
}

export function ViewPawnTab({ pawnTicket, customer }: ViewPawnTabProps) {
  const pawnData = transformPawnTicketToFormData(pawnTicket);

  return (
    <div className="p-6">
      <PawnTicketForm
        mode="VIEW"
        initialData={pawnData}
        controlNumber={pawnTicket.controlNumber}
        pawnTicket={pawnTicket}
        customer={customer}
      />
    </div>
  );
}
