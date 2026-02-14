import { InventoryItemRecord } from '../../../../domains/reports/inventory/InventoryItemRecord';
import { InventoryItemRowResponseDto } from '../../../dto/reports/inventory/query/InventoryItemRowResponseDto';

export function toInventoryItemRowDto(record: InventoryItemRecord): InventoryItemRowResponseDto {
  return {
    itemType: record.itemType,
    type: record.type,
    brand: record.brand,
    inventoryNumber: record.inventoryNumber,
    itemDescription: record.itemDescription,
    model: record.model,
    serialNumber: record.serialNumber,
    quantity: record.quantity,
    cost: record.cost,
    resale: record.resale,
  };
}
