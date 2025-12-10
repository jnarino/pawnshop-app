// You can tighten this later if you define a fixed set of codes in inventory_status
export type InventoryStatusCode = string;

// Simple JSON value type for extra / attributes blobs
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export class InventoryItem {
  readonly id: string;

  // Required
  categoryId: string;
  status: InventoryStatusCode;
  quantity: number;

  // Descriptive
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  colorId: string | null;
  itemCondition: string | null;
  ownerMark: string | null;
  itemDescription: string | null;

  // Pricing
  priceAmount: number | null;
  resale: number | null;
  minResale: number | null;
  itemReplace: number | null;

  // Flexible payloads
  extra: JsonObject;
  attributes: JsonObject;

  // Legacy fields
  legacyInventoryNumber: string | null;
  legacyItemGuid: string | null;
  legacyCategoryDescription: string | null;
  legacyBrandColorDescription: string | null;

  // Control / tracking
  inventoryNumber: string | null;
  lastUpdatedUserId: string | null;

  createdAt: Date;
  updatedAt: Date;

  constructor(params: {
    id: string;

    categoryId: string;
    status: InventoryStatusCode;
    quantity: number;

    brand?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    colorId?: string | null;
    itemCondition?: string | null;
    ownerMark?: string | null;
    itemDescription?: string | null;

    priceAmount?: number | null;
    resale?: number | null;
    minResale?: number | null;
    itemReplace?: number | null;

    extra?: JsonObject | null;
    attributes?: JsonObject | null;

    legacyInventoryNumber?: string | null;
    legacyItemGuid?: string | null;
    legacyCategoryDescription?: string | null;
    legacyBrandColorDescription?: string | null;

    inventoryNumber?: string | null;
    lastUpdatedUserId?: string | null;

    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;

    this.categoryId = params.categoryId;
    this.status = params.status;
    this.quantity = params.quantity;

    this.brand = params.brand ?? null;
    this.model = params.model ?? null;
    this.serialNumber = params.serialNumber ?? null;
    this.colorId = params.colorId ?? null;
    this.itemCondition = params.itemCondition ?? null;
    this.ownerMark = params.ownerMark ?? null;
    this.itemDescription = params.itemDescription ?? null;

    this.priceAmount = params.priceAmount ?? null;
    this.resale = params.resale ?? null;
    this.minResale = params.minResale ?? null;
    this.itemReplace = params.itemReplace ?? null;

    this.extra = params.extra ?? {};
    this.attributes = params.attributes ?? {};

    this.legacyInventoryNumber = params.legacyInventoryNumber ?? null;
    this.legacyItemGuid = params.legacyItemGuid ?? null;
    this.legacyCategoryDescription = params.legacyCategoryDescription ?? null;
    this.legacyBrandColorDescription = params.legacyBrandColorDescription ?? null;

    this.inventoryNumber = params.inventoryNumber ?? null;
    this.lastUpdatedUserId = params.lastUpdatedUserId ?? null;

    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
