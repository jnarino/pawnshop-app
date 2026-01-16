import { InventoryCategory } from './InventoryCategory';

export class InventorySubCategory extends InventoryCategory {
  readonly inventoryCategoryId: string;

  constructor(params: {
    readonly id: string;
    inventoryCategoryId: string;
    name: string;
    code?: string;
    isActive?: boolean;
  }) {
    super(params);
    this.inventoryCategoryId = params.inventoryCategoryId;
  }
}
