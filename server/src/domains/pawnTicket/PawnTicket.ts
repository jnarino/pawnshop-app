import { InventoryItem } from '../inventory/InventoryItem';

export type PawnTransactionType = 'PAWN' | 'PURCHASE';

export type PawnStatus =
  | 'active'
  | 'redeemed'
  | 'defaulted'
  | 'police hold'
  | 'confiscation'
  | 'voided';

export type TenderInfo = {
  tenderTypeId: number;
  amount: number;
};

/**
 * Aggregate root for a pawn ticket:
 * - linked to one customer
 * - linked to one or many inventory items (itemIds)
 * - includes transaction and payment information
 */
export class PawnTicket {
  readonly id: string;

  controlNumber: string;
  transactionType: PawnTransactionType;
  customerId: string;
  clerkUserId: string;

  /**
   * For PAWN transactions: cash out to customer.
   * For PURCHASE transactions: total purchase value.
   */
  amountFinanced: number | null;
  financeCharge: number | null;
  periodicRate: number | null;
  totalOfPayments: number | null;
  apr: number | null;
  ratePlanId: string | null;
  
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

  /**
   * Full inventory item objects (populated when querying)
   */
  items?: InventoryItem[];

  /**
   * Tender information for the transaction
   */
  tenders: TenderInfo[];

  /**
   * Optional note for the transaction
   */
  note?: string;

  constructor(params: {
    id: string;
    controlNumber: string;
    transactionType: PawnTransactionType;
    customerId: string;
    clerkUserId: string;

    amountFinanced: number | null;
    financeCharge: number | null;
    periodicRate: number | null;
    totalOfPayments: number | null;
    apr: number | null;
    ratePlanId: string | null;

    purchaseTradeValue: number | null;

    transactionDate: Date;
    maturityDate: Date;
    defaultDate: Date;

    pawnStatus: PawnStatus;

    itemIds: string[];
    items?: InventoryItem[];
    tenders: TenderInfo[];
    note?: string;
  }) {
    this.id = params.id;

    this.controlNumber = params.controlNumber;
    this.transactionType = params.transactionType;
    this.customerId = params.customerId;
    this.clerkUserId = params.clerkUserId;

    this.amountFinanced = params.amountFinanced;
    this.financeCharge = params.financeCharge;
    this.periodicRate = params.periodicRate;
    this.totalOfPayments = params.totalOfPayments;
    this.apr = params.apr;
    this.ratePlanId = params.ratePlanId;

    this.purchaseTradeValue = params.purchaseTradeValue;

    this.transactionDate = params.transactionDate;
    this.maturityDate = params.maturityDate;
    this.defaultDate = params.defaultDate;

    this.pawnStatus = params.pawnStatus;

    this.itemIds = params.itemIds;
    this.items = params.items;
    this.tenders = params.tenders;
    this.note = params.note;
  }
}
