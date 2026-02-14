export type InventoryItemRowResponseDto = {
  itemType: string;
  type: string;
  brand: string;
  itemDescription: string;
  model: string | null;
  serialNumber: string | null;
  quantity: number;
  cost: number;
  resale: number;
};
