import { PawnTicket } from './PawnTicket';
import { InventoryItem } from '../inventory/InventoryItem';

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
   * Update pawn ticket amount financed.
   */
  updateAmount(id: string, amountFinanced: number): Promise<void>;

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

  /**
   * Update non-status marking fields on a pawn ticket.
   */
  updateMarkings(params: {
    pawnTicketId: string;
    transactionDate: Date;
    defaultMarkedBy: string;
  }): Promise<void>;

  /**
   * Find status_id from pawn_ticket_status table by status code and transaction type.
   */
  findStatusIdByCode(statusCode: string, transactionType: 'PAWN' | 'PURCHASE'): Promise<number | null>;

  /**
   * Set the status_id of a pawn ticket by looking up the status code.
   * Also updates transaction_date and default_marked_by.
   */
  setStatusByCode(pawnTicketId: string, statusCode: string, transactionType: 'PAWN' | 'PURCHASE', transactionDate: Date, defaultMarkedBy: string): Promise<void>;

  /**
   * List distinct previous items linked to a customer's pawn tickets.
   * Filters inventory_item by status in ('U','T','V').
   */
  listPreviousItemsByCustomer(customerId: string): Promise<InventoryItem[]>;

  /**
   * List pawn history for a customer with essential info: ticket dates, amounts, and item descriptions.
   * Returns simplified history data without enriched lookups.
   */
  listHistoryByCustomer(customerId: string): Promise<any[]>;
}
