export class StoreTransactionTender {
  readonly id: string;

  storeTransactionId: string;
  sequence: number;
  tenderTypeId: number; // matches tender_type.id (SMALLINT in DB)
  amount: number;

  createdAt: Date;

  constructor(params: {
    id: string;
    storeTransactionId: string;
    sequence?: number;
    tenderTypeId: number;
    amount: number;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.storeTransactionId = params.storeTransactionId;
    this.sequence = params.sequence ?? 1;
    this.tenderTypeId = params.tenderTypeId;
    this.amount = params.amount;
    this.createdAt = params.createdAt;
  }
}
