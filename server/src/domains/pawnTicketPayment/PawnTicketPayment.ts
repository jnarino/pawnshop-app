/**
 * Domain entity for pawn ticket payments
 */
export class PawnTicketPayment {
  readonly pawnTicketId: string;
  readonly paymentDate: Date;
  readonly principalPaid: number;
  readonly clerkUserId: string | null;
  readonly transactionTypeName: string;

  constructor(params: {
    pawnTicketId: string;
    paymentDate: Date;
    principalPaid: number;
    clerkUserId: string | null;
    transactionTypeName: string;
  }) {
    this.pawnTicketId = params.pawnTicketId;
    this.paymentDate = params.paymentDate;
    this.principalPaid = params.principalPaid;
    this.clerkUserId = params.clerkUserId;
    this.transactionTypeName = params.transactionTypeName;
  }
}
