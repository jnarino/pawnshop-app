import { Pool } from 'pg';
import { InventoryReportRepository } from '../../../../domains/reports/inventory/InventoryReportRepository';
import { InventoryItemRecord } from '../../../../domains/reports/inventory/InventoryItemRecord';
import { loadSql } from '../../../db/sqlLoader';

const sqlGetAllItems = loadSql('queries', 'reports/inventory/inventory_all_items_report');

export class PgInventoryReportRepository implements InventoryReportRepository {
  constructor(private readonly pool: Pool) {}

  async findAllItems(): Promise<InventoryItemRecord[]> {
    const result = await this.pool.query(sqlGetAllItems);
    return result.rows.map((row: any) => new InventoryItemRecord({
      itemType: row.item_type,
      type: row.type,
      brand: row.brand,
      itemDescription: row.item_description,
      model: row.model ?? null,
      serialNumber: row.serial_number ?? null,
      quantity: Number(row.quantity ?? 0),
      cost: Number(row.cost ?? 0),
      resale: Number(row.resale ?? 0),
    }));
  }
}
