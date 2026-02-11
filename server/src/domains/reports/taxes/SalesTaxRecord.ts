export type SalesTaxRecordProps = {
  occurredAt: Date;
  type: string;
  ticketNumber: string | null;
  grossAmount: number;
  taxableAmount: number;
  taxCollected: number;
};

export class SalesTaxRecord {
  readonly occurredAt: Date;
  readonly type: string;
  readonly ticketNumber: string | null;
  readonly grossAmount: number;
  readonly taxableAmount: number;
  readonly taxCollected: number;

  constructor(props: SalesTaxRecordProps) {
    this.occurredAt = props.occurredAt;
    this.type = props.type;
    this.ticketNumber = props.ticketNumber;
    this.grossAmount = props.grossAmount;
    this.taxableAmount = props.taxableAmount;
    this.taxCollected = props.taxCollected;
  }
}
