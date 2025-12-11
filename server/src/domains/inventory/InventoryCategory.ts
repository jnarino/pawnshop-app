export class InventoryCategory {
  categoryId: string;
  subcategoryId: string;
  brand: string;
  path: string;

  constructor(params: {
    categoryId: string;
    subcategoryId: string;
    brand: string;
    path: string;
  }) {
    this.categoryId = params.categoryId;
    this.subcategoryId = params.subcategoryId;
    this.brand = params.brand;
    this.path = params.path;
  }
}