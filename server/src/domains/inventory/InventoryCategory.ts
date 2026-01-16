export class InventoryCategory {
  id: string;
  name: string;
  code?: string;
  isActive?: boolean;

  constructor(params: {
    readonly id: string;
    name: string;
    code?: string;
    isActive?: boolean;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.code = params.code;
    this.isActive = params.isActive;
  }
}