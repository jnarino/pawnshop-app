export class InventoryAttributeValue {
  readonly id: string;
  readonly attributeTypeId: string;
  readonly value: string;

  constructor(props: { id: string; attributeTypeId: string; value: string }) {
    this.id = props.id;
    this.attributeTypeId = props.attributeTypeId;
    this.value = props.value;
  }
}
