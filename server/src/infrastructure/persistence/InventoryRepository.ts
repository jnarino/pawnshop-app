import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';
import { InventoryItem } from '../../domain/inventory/InventoryItem';
import { CreateInventoryItemDTO, IInventoryRepository, UpdateInventoryItemDTO } from '../../domain/inventory/IInventoryRepository';
import type { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export class InventoryRepository implements IInventoryRepository {
  async createSingleItem(dto: CreateInventoryItemDTO): Promise<string> {
    const createSQL = getSQL('command', 'inventory', 'createInventoryItem');
    const { rows } = await pool.query(createSQL, [
      uuidv4(),
      dto.inventoryNumber || null,
      dto.status || 'I',
      dto.categoryId,
      dto.brand || null,
      dto.model || null,
      dto.serialNumber || null,
      dto.colorId || null,              // ✅ Changed from color to colorId
      dto.itemCondition || null,
      dto.quantity || 1,
      dto.priceAmount || null,
      dto.resale || null,
      dto.minResale || null,            // ✅ Added minResale
      dto.itemReplace || null,
      dto.ownerMark || null,            // ✅ Changed from ownerTag to ownerMark
      dto.itemDescription || null,
      JSON.stringify(dto.attributes || {}),
      JSON.stringify({}), // extra field
    ]);
    return rows[0].id;
  }

  async createInTransaction(client: PoolClient, dto: CreateInventoryItemDTO): Promise<string> {
    const createSQL = getSQL('command', 'inventory', 'createInventoryItem');
    const { rows } = await client.query(createSQL, [
      uuidv4(),
      dto.inventoryNumber || null,
      dto.status || 'I',
      dto.categoryId,
      dto.brand || null,
      dto.model || null,
      dto.serialNumber || null,
      dto.colorId || null,              // ✅ Changed from color to colorId
      dto.itemCondition || null,
      dto.quantity || 1,
      dto.priceAmount || null,
      dto.resale || null,
      dto.minResale || null,            // ✅ Added minResale
      dto.itemReplace || null,
      dto.ownerMark || null,            // ✅ Changed from ownerTag to ownerMark
      dto.itemDescription || null,
      JSON.stringify(dto.attributes || {}),
      JSON.stringify({}), // extra field
    ]);
    return rows[0].id;
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const sql = getSQL('query', 'inventory', 'findInventoryItemById');
    const { rows } = await pool.query(sql, [id]);
    if (!rows[0]) return null;
    return this.mapRowToInventoryItem(rows[0]);
  }

  async findAll(limit?: number, offset?: number): Promise<InventoryItem[]> {
    const base = getSQL('query', 'inventory', 'findAllInventoryItems');
    const clauses: string[] = [];
    const params: any[] = [];
    if (typeof limit === 'number') { params.push(limit); clauses.push(`LIMIT $${params.length}`); }
    if (typeof offset === 'number') { params.push(offset); clauses.push(`OFFSET $${params.length}`); }
    const sql = `${base} ${clauses.join(' ')}`.trim();
    const { rows } = await pool.query(sql, params);
    return rows.map(this.mapRowToInventoryItem);
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
      colorId: row.color_id,            // ✅ Changed from color to colorId
      itemCondition: row.item_condition,
      quantity: row.quantity,
      priceAmount: row.price_amount,
      resale: row.resale,
      minResale: row.min_resale,        // ✅ Added minResale
      itemReplace: row.item_replace,
      ownerMark: row.owner_mark,        // ✅ Changed from ownerTag
      itemDescription: row.item_description,
      attributes: row.attributes || {},
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    };
  }
}
