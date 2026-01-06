import { ScrapInventoryNumberItemDto, ScrapInventoryNumberResponseDto } from '../../dto/inventory/query/ScrapInventoryNumberResponseDto';

export function toScrapInventoryNumberResponseDto(
  items: Array<{ inventoryNumber: string; itemDescription: string | null }>
): ScrapInventoryNumberResponseDto {
  return items.map((item) => ({
    inventoryNumber: item.inventoryNumber,
    itemDescription: item.itemDescription
  }));
}
