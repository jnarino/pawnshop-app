export class InventoryGenericColor {
  readonly id: string;
  readonly value: string;
  
  constructor(props: {
    id: string;
    value: string;
  }) {
    this.id = props.id;
    this.value = props.value;
  }
}
