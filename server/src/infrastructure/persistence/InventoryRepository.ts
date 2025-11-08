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
      uuidv4(),                           // $1 - id
      dto.inventoryNumber || null,        // $2 - inventory_number
      dto.status || 'I',                  // $3 - status
      dto.categoryId,                     // $4 - category_id
      dto.brand || null,                  // $5 - brand
      dto.model || null,                  // $6 - model
      dto.serialNumber || null,           // $7 - serial_number
      dto.colorId || null,                // $8 - color_id
      dto.itemCondition || null,          // $9 - item_condition
      dto.quantity || 1,                  // $10 - quantity
      dto.priceAmount || null,            // $11 - price_amount
      dto.resale || null,                 // $12 - resale
      dto.minResale || null,              // $13 - min_resale
      dto.itemReplace || null,            // $14 - item_replace
      dto.ownerMark || null,              // $15 - owner_mark
      dto.itemDescription || null,        // $16 - item_description
      JSON.stringify(dto.attributes || {}), // $17 - attributes
      JSON.stringify({}),                 // $18 - extra
      null                                // $19 - last_updated_user_id
    ]);
    return rows[0].id;
  }

  async createInTransaction(client: PoolClient, dto: CreateInventoryItemDTO): Promise<string> {
    const createSQL = getSQL('command', 'inventory', 'createInventoryItem');
    const { rows } = await client.query(createSQL, [
      uuidv4(),                           // $1 - id
      dto.inventoryNumber || null,        // $2 - inventory_number
      dto.status || 'I',                  // $3 - status
      dto.categoryId,                     // $4 - category_id
      dto.brand || null,                  // $5 - brand
      dto.model || null,                  // $6 - model
      dto.serialNumber || null,           // $7 - serial_number
      dto.colorId || null,                // $8 - color_id
      dto.itemCondition || null,          // $9 - item_condition
      dto.quantity || 1,                  // $10 - quantity
      dto.priceAmount || null,            // $11 - price_amount
      dto.resale || null,                 // $12 - resale
      dto.minResale || null,              // $13 - min_resale
      dto.itemReplace || null,            // $14 - item_replace
      dto.ownerMark || null,              // $15 - owner_mark
      dto.itemDescription || null,        // $16 - item_description
      JSON.stringify(dto.attributes || {}), // $17 - attributes
      JSON.stringify({}),                 // $18 - extra
      null                                // $19 - last_updated_user_id
    ]);
    return rows[0].id;
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const sql = getSQL('query', 'inventory', 'findInventoryItemById');
    const { rows } = await pool.query(sql, [id]);
    return rows[0] ? this.mapRowToInventoryItem(rows[0]) : null;
  }

  async findByIdInTransaction(client: PoolClient, id: string): Promise<InventoryItem | null> {
    const sql = getSQL('query', 'inventory', 'findInventoryItemById');
    const { rows } = await client.query(sql, [id]);
    return rows[0] ? this.mapRowToInventoryItem(rows[0]) : null;
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
