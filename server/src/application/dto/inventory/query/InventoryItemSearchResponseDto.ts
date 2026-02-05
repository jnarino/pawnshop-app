export type LookupDto = {
  id: string;
  name: string;
};

export type InventoryItemSearchResponseDto = {
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
  inventoryNumber: string | null;
};
