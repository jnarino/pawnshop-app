import type { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import type { InventoryItem } from '../../domain/inventory/InventoryItem';
import type { IInventoryRepository, CreateInventoryItemDTO, UpdateInventoryItemDTO } from '../../domain/inventory/IInventoryRepository';

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
    return result.rows[0] ? this.mapRowToInventoryItem(result.rows[0]) : null;
  }

  async findAll(limit?: number, offset?: number): Promise<InventoryItem[]> {
    let sql = this.findAllInventoryItemsSql;
    const params: any[] = [];

    if (limit || offset) {
      sql = sql.replace('ORDER BY updated_at DESC;', 'ORDER BY updated_at DESC LIMIT $1 OFFSET $2;');
      params.push(limit || 50, offset || 0);
    }

    const result = await this.pool.query(sql, params);
    return result.rows.map(row => this.mapRowToInventoryItem(row));
  }

  async update(id: string, dto: UpdateInventoryItemDTO): Promise<boolean> {
    // ✅ Build dynamic update query
    const sets: string[] = [];
    const values: any[] = [];
    
    if (dto.status !== undefined) {
      values.push(dto.status);
      sets.push(`status = $${values.length}`);
    }
    if (dto.categoryId !== undefined) {
      values.push(dto.categoryId);
      sets.push(`category_id = $${values.length}`);
    }
    if (dto.brand !== undefined) {
      values.push(dto.brand);
      sets.push(`brand = $${values.length}`);
    }
    if (dto.model !== undefined) {
      values.push(dto.model);
      sets.push(`model = $${values.length}`);
    }
    if (dto.serialNumber !== undefined) {
      values.push(dto.serialNumber);
      sets.push(`serial_number = $${values.length}`);
    }
    if (dto.colorId !== undefined) {
      values.push(dto.colorId);
      sets.push(`color_id = $${values.length}`);
    }
    if (dto.itemCondition !== undefined) {
      values.push(dto.itemCondition);
      sets.push(`item_condition = $${values.length}`);
    }
    if (dto.quantity !== undefined) {
      values.push(dto.quantity);
      sets.push(`quantity = $${values.length}`);
    }
    if (dto.priceAmount !== undefined) {
      values.push(dto.priceAmount);
      sets.push(`price_amount = $${values.length}`);
    }
    if (dto.resale !== undefined) {
      values.push(dto.resale);
      sets.push(`resale = $${values.length}`);
    }
    if (dto.minResale !== undefined) {
      values.push(dto.minResale);
      sets.push(`min_resale = $${values.length}`);
    }
    if (dto.itemReplace !== undefined) {
      values.push(dto.itemReplace);
      sets.push(`item_replace = $${values.length}`);
    }
    if (dto.ownerMark !== undefined) {
      values.push(dto.ownerMark);
      sets.push(`owner_mark = $${values.length}`);
    }
    if (dto.itemDescription !== undefined) {
      values.push(dto.itemDescription);
      sets.push(`item_description = $${values.length}`);
    }
    if (dto.attributes !== undefined) {
      values.push(JSON.stringify(dto.attributes));
      sets.push(`attributes = $${values.length}`);
    }

    if (sets.length === 0) return true; // No changes

    values.push(id);
    const sql = `UPDATE inventory_item SET ${sets.join(', ')}, updated_at = now() WHERE id = $${values.length}`;
    
    const res = await this.pool.query(sql, values);
    return res.rowCount === 1;
  }

  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM inventory_item WHERE id = $1';
    const res = await this.pool.query(sql, [id]);
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
      colorId: row.color_id,
      itemCondition: row.item_condition,
      quantity: row.quantity,
      priceAmount: row.price_amount,
      resale: row.resale,
      minResale: row.min_resale,
      itemReplace: row.item_replace,
      ownerMark: row.owner_mark,
      itemDescription: row.item_description,
      attributes: row.attributes || {},
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    };
  }
}
