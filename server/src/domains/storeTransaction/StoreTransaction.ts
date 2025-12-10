import { StoreTransactionTender } from './StoreTransactionTender';
import { StoreTransactionItem } from './StoreTransactionItem';

export class StoreTransaction {
  readonly id: string;

  customerId: string | null;
  clerkUserId: string | null;

  /**
   * store_transaction_type.id (SMALLINT)
   * e.g. 5 = PAWN_DISBURSEMENT, 6 = BUY_OUTRIGHT, etc.
   */
  typeId: number;

  occurredAt: Date;

  amount: number | null;
  taxSales: number | null;
  stateTax: number | null;
  taxExemptUsed: boolean;
  taxExemptCertificate: string | null;
  tenderChange: number | null;

  gunProcFee: number | null;

  note: string | null;

  tenders: StoreTransactionTender[];
  items: StoreTransactionItem[];

  createdAt: Date;
  updatedAt: Date;

  constructor(params: {
    id: string;

    customerId?: string | null;
    clerkUserId?: string | null;

    typeId: number;
    occurredAt: Date;

    amount?: number | null;
    taxSales?: number | null;
    stateTax?: number | null;
    taxExemptUsed?: boolean;
    taxExemptCertificate?: string | null;
    tenderChange?: number | null;

    gunProcFee?: number | null;

    note?: string | null;

    tenders?: StoreTransactionTender[];
    items?: StoreTransactionItem[];

    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;

    this.customerId = params.customerId ?? null;
    this.clerkUserId = params.clerkUserId ?? null;

    this.typeId = params.typeId;
    this.occurredAt = params.occurredAt;

    this.amount = params.amount ?? null;
    this.taxSales = params.taxSales ?? null;
    this.stateTax = params.stateTax ?? null;
    this.taxExemptUsed = params.taxExemptUsed ?? false;
    this.taxExemptCertificate = params.taxExemptCertificate ?? null;
    this.tenderChange = params.tenderChange ?? null;

    this.gunProcFee = params.gunProcFee ?? null;

    this.note = params.note ?? null;

    this.tenders = params.tenders ?? [];
    this.items = params.items ?? [];

    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
