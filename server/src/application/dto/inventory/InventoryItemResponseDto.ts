export type LookupDto = {
  id: string;
  name: string;
};

export type StoneDto = {
  type: LookupDto | null;
  color: LookupDto | null;
  shape: LookupDto | null;
  width?: number;
  quantity?: number;
  [key: string]: unknown;
};

export type ExtraDto = {
  stones?: StoneDto[];
  [key: string]: unknown;
};

export type AttributesDto = {
  karat?: LookupDto | null;
  metal?: LookupDto | null;
  style?: LookupDto | null;
  gender?: LookupDto | null;
  sizeLength?: LookupDto | null;
  [key: string]: unknown;
};

export type InventoryItemResponseDto = {
  id: string;

  inventorySubcategory: LookupDto;
  inventoryCategory: LookupDto;
  status: string;
  quantity: number;

  brand: LookupDto | null;
  model: string | null;
  serialNumber: string | null;
  colorId: LookupDto | null;
  itemCondition: string | null;
  ownerMark: string | null;
  itemDescription: string | null;

  priceAmount: number | null;
  resale: number | null;
  minResale: number | null;
  itemReplace: number | null;

  extra: ExtraDto;
  attributes: AttributesDto;

  legacyInventoryNumber: string | null;
  legacyItemGuid: string | null;
  legacyCategoryDescription: string | null;
  legacyBrandColorDescription: string | null;

  inventoryNumber: string | null;
  lastUpdatedUserId: string | null;

  createdAt: string | null;
  updatedAt: string;
};
