
import { InventoryItem } from '../../../domains/inventory/InventoryItem';
import { InventoryItemResponseDto } from '../../dto/inventory/InventoryItemResponseDto';
import { InventoryItemSearchResponseDto } from '../../dto/inventory/query/InventoryItemSearchResponseDto';

export function toInventoryItemResponseDto(
  item: InventoryItem
): InventoryItemResponseDto {
  const enrichedData = (item as any)._enrichedData;

  // Helper to trim string fields
  const trimString = (str: string | null | undefined): string | null => {
    return typeof str === 'string' ? str.trim() : (str ?? null);
  };

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
    model: trimString(item.model),
    serialNumber: trimString(item.serialNumber),
    colorId:
      item.colorId && typeof item.colorId === 'object' && 'id' in item.colorId && 'name' in item.colorId
        ? item.colorId
        : (typeof item.colorId === 'string' && item.colorId !== ''
          ? { id: item.colorId, name: '' }
          : null),
    itemCondition: item.itemCondition,
    ownerMark: trimString(item.ownerMark),
    itemDescription: trimString(item.itemDescription),

    priceAmount: item.priceAmount,
    resale: item.resale,
    minResale: item.minResale,
    itemReplace: item.itemReplace,

    extra: item.extra,
    attributes: item.attributes,

    legacyInventoryNumber: trimString(item.legacyInventoryNumber),
    legacyItemGuid: trimString(item.legacyItemGuid),
    legacyCategoryDescription: trimString(item.legacyCategoryDescription),
    legacyBrandColorDescription: trimString(item.legacyBrandColorDescription),

    inventoryNumber: trimString(item.inventoryNumber),
    lastUpdatedUserId: item.lastUpdatedUserId,

    createdAt: item.createdAt ? item.createdAt.toISOString() : null,
    updatedAt: item.updatedAt.toISOString()
  };
}

export function toInventoryItemSearchResponseDto(
  item: InventoryItem
): InventoryItemSearchResponseDto {
  const enrichedData = (item as any)._enrichedData;

  const trimString = (str: string | null | undefined): string | null => {
    return typeof str === 'string' ? str.trim() : (str ?? null);
  };

  const colorId = (() => {
    if (typeof item.colorId === 'string') return trimString(item.colorId);
    if (item.colorId && typeof item.colorId === 'object' && 'id' in item.colorId) {
      return trimString((item.colorId as { id?: string }).id ?? null);
    }
    return null;
  })();

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
    model: trimString(item.model),
    serialNumber: trimString(item.serialNumber),
    colorId,
    itemCondition: trimString(item.itemCondition),
    ownerMark: trimString(item.ownerMark),
    itemDescription: trimString(item.itemDescription),
    priceAmount: item.priceAmount,
    inventoryNumber: trimString(item.inventoryNumber)
  };
}
