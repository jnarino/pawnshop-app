import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';
import { InventoryItem } from '../../domain/inventory/InventoryItem';
import { CreateInventoryItemDTO, IInventoryRepository, UpdateInventoryItemDTO } from '../../domain/inventory/IInventoryRepository';
import type { PoolClient } from 'pg';

// Mapping is handled mostly by SQL aliases. Just ensure numeric/JSON fields are normalized.
// Exported for testing (mapping tests)
export function mapRowToInventoryItem(r: any): InventoryItem {
  return {
    id: typeof r.id === 'number' ? String(r.id) : r.id,
    inventoryNumber: r.inventory_number,
    status: r.status,
    categoryId: r.category_id,
    brand: r.brand ?? undefined,
    model: r.model ?? undefined,
    serialNumber: r.serial_number ?? undefined,
    color: r.color ?? undefined,
    itemCondition: r.item_condition ?? undefined,
    quantity: r.quantity,
    priceAmount: r.price_amount !== null ? Number(r.price_amount) : undefined,
    resale: r.resale !== null ? Number(r.resale) : undefined,
    minResale: r.min_resale !== null ? Number(r.min_resale) : undefined,
    itemReplace: r.item_replace !== null ? Number(r.item_replace) : undefined,
    ownerTag: r.owner_mark ?? undefined,
    itemDescription: r.item_description ?? undefined,
    attributes: r.attributes ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class InventoryRepository implements IInventoryRepository {
  // ✅ Standalone: Creates single item, auto-commits
  async createSingleItem(item: Partial<InventoryItem>): Promise<string> {
    const sql = getSQL('command', 'inventory', 'createInventoryItem');
    const params = [
      item.inventoryNumber,
      item.status || 'I',
      item.categoryId,
      item.brand || null,
      item.model || null,
      item.serialNumber || null,
      item.color || null,
      item.itemCondition || null,
      item.quantity || 1,
      item.priceAmount || null,
      item.resale || null,
      item.minResale || null,
      item.itemReplace || null,
      item.ownerTag || null,
      item.itemDescription || null,
      JSON.stringify(item.attributes || {}),
    ];
    
    const { rows } = await pool.query(sql, params);
    return rows[0].id;
  }

  // ✅ Transactional: Part of larger transaction (e.g., with pawn ticket)
  async createInTransaction(client: PoolClient, item: Partial<InventoryItem>): Promise<string> {
    const sql = getSQL('command', 'inventory', 'createInventoryItem');
    const params = [
      item.inventoryNumber,
      item.status || 'I',
      item.categoryId,
      item.brand || null,
      item.model || null,
      item.serialNumber || null,
      item.color || null,
      item.itemCondition || null,
      item.quantity || 1,
      item.priceAmount || null,
      item.resale || null,
      item.minResale || null,
      item.itemReplace || null,
      item.ownerTag || null,
      item.itemDescription || null,
      JSON.stringify(item.attributes || {}),
    ];
    
    const { rows } = await client.query(sql, params);
    return rows[0].id;
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const sql = getSQL('query','inventory','findInventoryItemById');
    const { rows } = await pool.query(sql,[id]);
    if (!rows[0]) return null;
    return mapRowToInventoryItem(rows[0]);
  }

  async findAll(limit?: number, offset?: number): Promise<InventoryItem[]> {
  const base = getSQL('query','inventory','findAllInventoryItems');
    const clauses: string[] = [];
    const params: any[] = [];
    if (typeof limit === 'number') { params.push(limit); clauses.push(`LIMIT $${params.length}`); }
    if (typeof offset === 'number') { params.push(offset); clauses.push(`OFFSET $${params.length}`); }
    const sql = `${base} ${clauses.join(' ')}`.trim();
    const { rows } = await pool.query(sql, params);
    return rows.map(mapRowToInventoryItem);
  }

  async update(id: string, dto: UpdateInventoryItemDTO): Promise<boolean> {
    const sql = getSQL('command','inventory','updateInventoryItem');
    const params = [
      dto.status,
      dto.categoryId,
      dto.brand,
      dto.model,
      dto.serialNumber,
      dto.color,
      dto.itemCondition,
      dto.quantity,
      dto.priceAmount,
      dto.resale,
      dto.minResale,
      dto.itemReplace,
      dto.ownerTag,
      dto.itemDescription,
      dto.attributes ? JSON.stringify(dto.attributes) : undefined,
      id,
    ];
    const res = await pool.query(sql, params);
    return res.rowCount === 1;
  }

  async delete(id: string): Promise<boolean> {
    const sql = getSQL('command','inventory','deleteInventoryItem');
    const res = await pool.query(sql,[id]);
    return res.rowCount === 1;
  }
}
