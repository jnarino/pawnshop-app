export interface PawnTicketPaymentResponseDto {
  pawnTicketId: string;
  paymentDate: string;
  principalPaid: number;
  clerkUserId: string | null;
}
