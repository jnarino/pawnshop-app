import { InventoryItemRecord } from './InventoryItemRecord';

export type InventoryItemsCriteria = {
  categoryId?: string;
  subcategoryId?: string;
  excludeJewelryAndFirearm?: boolean;
};

export interface InventoryReportRepository {
  findAllItems(criteria?: InventoryItemsCriteria): Promise<InventoryItemRecord[]>;
}
