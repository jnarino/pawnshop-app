import { InventoryItemRecord } from './InventoryItemRecord';

export interface InventoryReportRepository {
  findAllItems(): Promise<InventoryItemRecord[]>;
}
