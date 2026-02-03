import { http } from './http';

export interface PawnTicketPaymentResponse {
  message: string;
  gunTransferNumber?: string;
  receipts?: any;
}

export interface PawnTicketPayment {
  pawnTicketId: string;
  paymentDate: string;
  principalPaid: number;
  clerkUserId: string | null;
  message: string;
  gunTransferNumber: string;
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
  create: async (payload: CreatePawnTicketPaymentPayload): Promise<PawnTicketPaymentResponse> => {
    return http('/api/pawn-ticket/payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateGunLogInfo: async (data: { nicsNumber: string; comments: string }) => {
    // Mock API call
    return new Promise<{ message: string }>((resolve) => {
      setTimeout(() => {
        resolve({ message: "The assigned ATF 4473 number is - 6967" });
      }, 500);
    });
  },
};
