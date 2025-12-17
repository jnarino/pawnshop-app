export type LookupDto = {
  id: string;
  name: string;
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
  colorId: string | null;
  itemCondition: string | null;
  ownerMark: string | null;
  itemDescription: string | null;

  priceAmount: number | null;
  resale: number | null;
  minResale: number | null;
  itemReplace: number | null;

  extra: Record<string, unknown>;
  attributes: Record<string, unknown>;

  legacyInventoryNumber: string | null;
  legacyItemGuid: string | null;
  legacyCategoryDescription: string | null;
  legacyBrandColorDescription: string | null;

  inventoryNumber: string | null;
  lastUpdatedUserId: string | null;

  createdAt: string;
  updatedAt: string;
};
