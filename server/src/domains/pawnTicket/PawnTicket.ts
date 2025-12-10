export type PawnTransactionType = 'PAWN' | 'PURCHASE';

export type PawnStatus =
  | 'active'
  | 'redeemed'
  | 'defaulted'
  | 'police hold'
  | 'confiscation'
  | 'voided';

/**
 * Aggregate root for a pawn ticket:
 * - linked to one customer
 * - linked to one or many inventory items (itemIds)
 *
 * We'll extend this later with full finance details (APR, rate plan, etc.).
 */
export class PawnTicket {
  readonly id: string;

  controlNumber: string;
  transactionType: PawnTransactionType;
  customerId: string;

  /**
   * For PAWN transactions: cash out to customer.
   * For PURCHASE transactions: total purchase value (we'll refine later).
   */
  amountFinanced: number | null;
  purchaseTradeValue: number | null;

  transactionDate: Date;
  maturityDate: Date;
  defaultDate: Date;

  pawnStatus: PawnStatus;

  /**
   * List of inventory_item IDs attached to this ticket.
   * Persistence layer will map this to pawn_ticket_item join table.
   */
  itemIds: string[];

  constructor(params: {
    id: string;
    controlNumber: string;
    transactionType: PawnTransactionType;
    customerId: string;

    amountFinanced: number | null;
    purchaseTradeValue: number | null;

    transactionDate: Date;
    maturityDate: Date;
    defaultDate: Date;

    pawnStatus: PawnStatus;

    itemIds: string[];
  }) {
    this.id = params.id;

    this.controlNumber = params.controlNumber;
    this.transactionType = params.transactionType;
    this.customerId = params.customerId;

    this.amountFinanced = params.amountFinanced;
    this.purchaseTradeValue = params.purchaseTradeValue;

    this.transactionDate = params.transactionDate;
    this.maturityDate = params.maturityDate;
    this.defaultDate = params.defaultDate;

    this.pawnStatus = params.pawnStatus;

    this.itemIds = params.itemIds;
  }
}
