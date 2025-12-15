import { PawnTicketPayment } from '../../../domains/pawnTicketPayment/PawnTicketPayment';
import { PawnTicketPaymentResponseDto } from '../../dto/pawnTicketPayment/query/PawnTicketPaymentResponseDto';

export function toPawnTicketPaymentResponseDto(payment: PawnTicketPayment): PawnTicketPaymentResponseDto {
  return {
    pawnTicketId: payment.pawnTicketId,
    paymentDate: payment.paymentDate.toISOString(),
    principalPaid: payment.principalPaid,
    clerkUserId: payment.clerkUserId
  };
}
