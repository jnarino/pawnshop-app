export type InventoryItemRecordProps = {
  itemType: string;
  type: string;
  brand: string;
  itemDescription: string;
  model: string | null;
  serialNumber: string | null;
  quantity: number;
  cost: number;
  resale: number;
};

export class InventoryItemRecord {
  readonly itemType: string;
  readonly type: string;
  readonly brand: string;
  readonly itemDescription: string;
  readonly model: string | null;
  readonly serialNumber: string | null;
  readonly quantity: number;
  readonly cost: number;
  readonly resale: number;

  constructor(props: InventoryItemRecordProps) {
    this.itemType = props.itemType;
    this.type = props.type;
    this.brand = props.brand;
    this.itemDescription = props.itemDescription;
    this.model = props.model;
    this.serialNumber = props.serialNumber;
    this.quantity = props.quantity;
    this.cost = props.cost;
    this.resale = props.resale;
  }
}
