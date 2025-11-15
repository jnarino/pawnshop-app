import type { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import type { InventoryItem } from '../../domain/inventory/InventoryItem';
import type { IInventoryRepository, CreateInventoryItemDTO, UpdateInventoryItemDTO } from '../../domain/inventory/IInventoryRepository';
import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';

export class InventoryRepository implements IInventoryRepository {
  private readonly createInventoryItemSql: string;
  private readonly findInventoryItemByIdSql: string;
  private readonly findAllInventoryItemsSql: string;

  constructor(private readonly pool: Pool) {
    // ✅ Load SQL queries from files
    const queryPath = path.join(__dirname, '../db/query/inventory');
    this.createInventoryItemSql = fs.readFileSync(path.join(queryPath, 'createInventoryItem.sql'), 'utf8');
    this.findInventoryItemByIdSql = fs.readFileSync(path.join(queryPath, 'findInventoryItemById.sql'), 'utf8');
    this.findAllInventoryItemsSql = fs.readFileSync(path.join(queryPath, 'findAllInventoryItems.sql'), 'utf8');
  }

  async createSingleItem(dto: CreateInventoryItemDTO): Promise<string> {
    const result = await this.pool.query(this.createInventoryItemSql, [
      dto.inventoryNumber,
      dto.status || 'I',
      dto.categoryId,
      dto.brand,
      dto.model,
      dto.serialNumber,
      dto.colorId,
      dto.itemCondition,
      dto.quantity || 1,
      dto.priceAmount,
      dto.resale,
      dto.minResale,
      dto.itemReplace,
      dto.ownerMark,
      dto.itemDescription,
      JSON.stringify(dto.attributes || {})
    ]);
    return result.rows[0].id;
  }

  async createInTransaction(client: PoolClient, dto: CreateInventoryItemDTO): Promise<string> {
    const result = await client.query(this.createInventoryItemSql, [
      dto.inventoryNumber,
      dto.status || 'I',
      dto.categoryId,
      dto.brand,
      dto.model,
      dto.serialNumber,
      dto.colorId,
      dto.itemCondition,
      dto.quantity || 1,
      dto.priceAmount,
      dto.resale,
      dto.minResale,
      dto.itemReplace,
      dto.ownerMark,
      dto.itemDescription,
      JSON.stringify(dto.attributes || {})
    ]);
    return result.rows[0].id;
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const result = await this.pool.query(this.findInventoryItemByIdSql, [id]);
    return result.rows[0] || null;
  }

  async findAll(limit?: number, offset?: number): Promise<InventoryItem[]> {
    let sql = this.findAllInventoryItemsSql;
    const params: any[] = [];

    if (limit || offset) {
      sql = sql.replace('ORDER BY updated_at DESC;', 'ORDER BY updated_at DESC LIMIT $1 OFFSET $2;');
      params.push(limit || 50, offset || 0);
    }

    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async update(id: string, dto: UpdateInventoryItemDTO): Promise<boolean> {
    const sql = getSQL('command', 'inventory', 'updateInventoryItem');
    const params = [
      dto.status,
      dto.categoryId,
      dto.brand,
      dto.model,
      dto.serialNumber,
      dto.colorId,                    // ✅ Changed from color to colorId
      dto.itemCondition,
      dto.quantity,
      dto.priceAmount,
      dto.resale,
      dto.minResale,
      dto.itemReplace,
      dto.ownerMark,                  // ✅ Renamed from ownerTag
      dto.itemDescription,
      dto.attributes ? JSON.stringify(dto.attributes) : undefined,
      id,
    ];
    const res = await pool.query(sql, params);
    return res.rowCount === 1;
  }

  async delete(id: string): Promise<boolean> {
    const sql = getSQL('command', 'inventory', 'deleteInventoryItem');
    const res = await pool.query(sql, [id]);
    return res.rowCount === 1;
  }

  private mapRowToInventoryItem(row: any): InventoryItem {
    return {
      id: row.id,
      inventoryNumber: row.inventory_number,
      status: row.status,
      categoryId: row.category_id,
      brand: row.brand,
      model: row.model,
      serialNumber: row.serial_number,
      colorId: row.color_id,            // ✅ Map color_id to colorId
      itemCondition: row.item_condition,
      quantity: row.quantity,
      priceAmount: row.price_amount,
      resale: row.resale,
      minResale: row.min_resale,        // ✅ Map min_resale
      itemReplace: row.item_replace,
      ownerMark: row.owner_mark,        // ✅ Map owner_mark to ownerMark
      itemDescription: row.item_description,
      attributes: row.attributes || {},
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    };
  }
}
