
import { InventoryItem } from '../../../domains/inventory/InventoryItem';
import { InventoryItemResponseDto } from '../../dto/inventory/InventoryItemResponseDto';

export function toInventoryItemResponseDto(
  item: InventoryItem
): InventoryItemResponseDto {
  return {
    id: item.id,

    categoryId: item.categoryId,
    status: item.status,
    quantity: item.quantity,

    brand: item.brand,
    model: item.model,
    serialNumber: item.serialNumber,
    colorId: item.colorId,
    itemCondition: item.itemCondition,
    ownerMark: item.ownerMark,
    itemDescription: item.itemDescription,

    priceAmount: item.priceAmount,
    resale: item.resale,
    minResale: item.minResale,
    itemReplace: item.itemReplace,

    extra: item.extra,
    attributes: item.attributes,

    legacyInventoryNumber: item.legacyInventoryNumber,
    legacyItemGuid: item.legacyItemGuid,
    legacyCategoryDescription: item.legacyCategoryDescription,
    legacyBrandColorDescription: item.legacyBrandColorDescription,

    inventoryNumber: item.inventoryNumber,
    lastUpdatedUserId: item.lastUpdatedUserId,

    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}
