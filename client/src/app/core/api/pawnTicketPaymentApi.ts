import { http } from './http';

export interface PawnTicketPayment {
  pawnTicketId: string;
  paymentDate: string;
  principalPaid: number;
  clerkUserId: string | null;
}

export const pawnTicketPaymentApi = {
  getPaymentHistory: async (pawnTicketId: string): Promise<PawnTicketPayment[]> => {
    return http(`/api/pawn-ticket/${pawnTicketId}/payments`);
  },
};
