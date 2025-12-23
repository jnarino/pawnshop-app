import { PawnTicket } from "./PawnTicket";

export interface PawnTicketPaymentService {
  payOnTicket(
    payments: {
      pawnTicketId: string;
      paymentAmount: number;
      tender: { tenderTypeId: number; amount: number };
      clerkUserId: string;
    }[]
  ): Promise<void>;
}
