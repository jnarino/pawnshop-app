export class InventoryAttributeType {
  readonly id: string;
  readonly name: string;

  constructor(props: { id: string; name: string }) {
    this.id = props.id;
    this.name = props.name;
  }
}
