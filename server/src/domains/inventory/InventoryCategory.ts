export class InventoryCategory {
  id: string;
  name: string;


  constructor(params: {
    readonly id: string;
    name: string;
  }) {
    this.id = params.id;
    this.name = params.name;
  }
}