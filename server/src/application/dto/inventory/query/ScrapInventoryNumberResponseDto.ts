export type ScrapInventoryNumberItemDto = {
  inventoryNumber: string;
  itemDescription: string | null;
};

export type ScrapInventoryNumberResponseDto = ScrapInventoryNumberItemDto[];
