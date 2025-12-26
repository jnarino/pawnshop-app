
import { InventoryItem } from '../../../domains/inventory/InventoryItem';
import { InventoryItemResponseDto } from '../../dto/inventory/InventoryItemResponseDto';

export function toInventoryItemResponseDto(
  item: InventoryItem
): InventoryItemResponseDto {
  const enrichedData = (item as any)._enrichedData;

  return {
    id: item.id,

    inventorySubcategory: enrichedData?.inventorySubcategory || {
      id: item.inventorySubcategoryId,
      name: ''
    },
    inventoryCategory: enrichedData?.inventoryCategory || {
      id: '',
      name: ''
    },
    status: item.status,
    quantity: item.quantity,

    brand: enrichedData?.brand || (item.brand ? { id: item.brand, name: '' } : null),
    model: item.model,
    serialNumber: item.serialNumber,
    colorId:
      item.colorId && typeof item.colorId === 'object' && 'id' in item.colorId && 'name' in item.colorId
        ? item.colorId
        : (typeof item.colorId === 'string' && item.colorId !== ''
          ? { id: item.colorId, name: '' }
          : null),
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

    createdAt: item.createdAt ? item.createdAt.toISOString() : null,
    updatedAt: item.updatedAt.toISOString()
  };
}
