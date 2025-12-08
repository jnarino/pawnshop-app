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
   * List ACTIVE (non-redeemed / non-voided / non-defaulted) tickets for a customer.
   * This is what you'd show on "open pawns" for that customer.
   */
  listActiveByCustomer(customerId: string): Promise<PawnTicket[]>;
}
