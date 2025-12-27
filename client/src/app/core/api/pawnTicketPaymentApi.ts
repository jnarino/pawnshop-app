import { http } from './http';

export interface PawnTicketPayment {
  pawnTicketId: string;
  paymentDate: string;
  principalPaid: number;
  clerkUserId: string | null;
}

export interface PawnTicketPaymentItem {
  pawnTicketId: string;
  controlNumber: string;
  createdDate: string;
  amountPaid: number;
}

export interface PawnTicketPaymentTender {
  id: string;
  name: string;
  amount: string;
  tenderTypeId: number;
}

export interface CreatePawnTicketPaymentPayload {
  items: PawnTicketPaymentItem[];
  tenders: PawnTicketPaymentTender[];
}

export const pawnTicketPaymentApi = {
  getPaymentHistory: async (pawnTicketId: string): Promise<PawnTicketPayment[]> => {
    return http(`/api/pawn-ticket/${pawnTicketId}/payments`);
  },


  /* /api/pawnTicket/payment*/
  create: async (payload: CreatePawnTicketPaymentPayload): Promise<PawnTicketPayment> => {
    return http('/api/pawn-ticket/payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

};
