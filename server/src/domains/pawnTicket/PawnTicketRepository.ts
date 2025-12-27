import { PawnTicket } from './PawnTicket';

export interface PawnTicketRepository {
  /**
   * Persist a new pawn ticket + its item links (pawn_ticket_item).
   * Returns the fully-hydrated aggregate.
   */
  create(ticket: PawnTicket): Promise<PawnTicket>;

  /**
   * Find tickets by control number.
   *
   * In practice control_number will usually be unique, but we keep
   * the return type as an array in case there are legacy quirks
   * or future multi-store scenarios.
   */
  listByControlNumber(controlNumber: string): Promise<PawnTicket[]>;

  /**
   * Find ALL tickets for a given customer (any status).
   * Useful for customer history screens.
   */
  findByCustomer(customerId: string): Promise<PawnTicket[]>;

  /**
   * Find tickets within a given date range.
   */
  findByDateRange(from: Date, to: Date): Promise<PawnTicket[]>;

  /**
   * List ACTIVE (non-redeemed / non-voided / non-defaulted) tickets for a customer.
   * This is what you'd show on "open pawns" for that customer.
   */
  listActiveByCustomer(customerId: string): Promise<PawnTicket[]>;

  /**
   * Find a pawn ticket by id.
   */
  findById(id: string): Promise<PawnTicket | null>;

  /**
   * Add a payment to a pawn ticket (update total_of_payments and last_payment_at).
   */
  addPayment(pawnTicketId: string, amount: number): Promise<void>;

  /**
   * Set the status of a pawn ticket (e.g., to 'U' for Redeemed).
   */
  setStatus(pawnTicketId: string, status: string): Promise<void>;

  /**
   * Atomically update all payment-related fields for a pawn ticket.
   */
  updatePaymentFields(params: {
    pawnTicketId: string;
    paymentAmount: number;
    transactionDate: Date;
    updatedAt: Date;
    defaultDate: Date;
    maturityDate: Date;
    setRedeemed: boolean;
  }): Promise<void>;
}
