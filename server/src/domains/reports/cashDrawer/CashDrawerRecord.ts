export type CashDrawerRecordProps = {
  occurredAt: Date;
  ticketNumber: string | null;
  employee: string;
  transactionType: string;
  transactionCode: string;
  amount: number;
  tenderAmount: number;
  tenderChange: number;
  remarks: string | null;
  paymentMethod: string | null;
  balance: number;
  // Optional breakdown for redemption payments: principal and interest components
  principalComponent?: number;
  interestComponent?: number;
};

export class CashDrawerRecord {
  readonly occurredAt: Date;
  readonly ticketNumber: string | null;
  readonly employee: string;
  readonly transactionType: string;
  readonly transactionCode: string;
  readonly amount: number;
  readonly tenderAmount: number;
  readonly tenderChange: number;
  readonly remarks: string | null;
  readonly paymentMethod: string | null;
  readonly balance: number;
  readonly principalComponent?: number;
  readonly interestComponent?: number;

  constructor(props: CashDrawerRecordProps) {
    this.occurredAt = props.occurredAt;
    this.ticketNumber = props.ticketNumber;
    this.employee = props.employee;
    this.transactionType = props.transactionType;
    this.transactionCode = props.transactionCode;
    this.amount = props.amount;
    this.tenderAmount = props.tenderAmount;
    this.tenderChange = props.tenderChange;
    this.remarks = props.remarks;
    this.paymentMethod = props.paymentMethod;
    this.balance = props.balance;
    this.principalComponent = props.principalComponent;
    this.interestComponent = props.interestComponent;
  }
}
