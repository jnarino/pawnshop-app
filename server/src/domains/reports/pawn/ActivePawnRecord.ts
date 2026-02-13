export interface ActivePawnRecordProps {
  pawnTicketId: string;
  ticketNumber: string;
  customerName: string;
  employeeUsername: string;
  dateIn: Date;
  dateOut: Date;
  serviceChargeDue: number;
  itemAmount: number;
  quantity: number;
  itemDescription: string;
  status: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  extra?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

export class ActivePawnRecord {
  readonly pawnTicketId: string;
  readonly ticketNumber: string;
  readonly customerName: string;
  readonly employeeUsername: string;
  readonly dateIn: Date;
  readonly dateOut: Date;
  readonly serviceChargeDue: number;
  readonly itemAmount: number;
  readonly quantity: number;
  readonly itemDescription: string;
  readonly status: string;
  readonly brand: string | null;
  readonly model: string | null;
  readonly serialNumber: string | null;
  readonly extra: Record<string, unknown>;
  readonly attributes: Record<string, unknown>;

  constructor(props: ActivePawnRecordProps) {
    this.pawnTicketId = props.pawnTicketId;
    this.ticketNumber = props.ticketNumber;
    this.customerName = props.customerName;
    this.employeeUsername = props.employeeUsername;
    this.dateIn = props.dateIn;
    this.dateOut = props.dateOut;
    this.serviceChargeDue = props.serviceChargeDue;
    this.itemAmount = props.itemAmount;
    this.quantity = props.quantity;
    this.itemDescription = props.itemDescription;
    this.status = props.status;
    this.brand = props.brand ?? null;
    this.model = props.model ?? null;
    this.serialNumber = props.serialNumber ?? null;
    this.extra = props.extra ?? {};
    this.attributes = props.attributes ?? {};
  }
}
