import { PawnTicketPayment } from './PawnTicketPayment';

export interface PawnTicketPaymentRepository {
  findByPawnTicketId(pawnTicketId: string): Promise<PawnTicketPayment[]>;
}
