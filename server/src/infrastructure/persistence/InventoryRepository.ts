import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';
import { InventoryItem } from '../../domain/inventory/InventoryItem';
import { CreateInventoryItemDTO, IInventoryRepository, UpdateInventoryItemDTO } from '../../domain/inventory/IInventoryRepository';

// Mapping is handled mostly by SQL aliases. Just ensure numeric/JSON fields are normalized.
// Exported for testing (mapping tests)
export function mapRowToInventoryItem(r: any): InventoryItem {
  return {
    id: typeof r.id === 'number' ? String(r.id) : r.id,
    inventoryNumber: r.inventoryNumber,
    status: r.status,
    categoryId: r.categoryId,
    brand: r.brand ?? undefined,
    model: r.model ?? undefined,
    serialNumber: r.serialNumber ?? undefined,
    color: r.color ?? undefined,
    itemCondition: r.itemCondition ?? undefined,
    quantity: r.quantity,
    amount: r.amount !== null ? Number(r.amount) : undefined,
    resale: r.resale !== null ? Number(r.resale) : undefined,
    itemReplace: r.itemReplace !== null ? Number(r.itemReplace) : undefined,
    binNumber: r.binNumber ?? undefined,
    ownerTag: r.ownerTag ?? undefined,
    itemDescription: r.itemDescription ?? undefined,
    attributes: r.attributes ?? {},
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class InventoryRepository implements IInventoryRepository {
  async create(dto: CreateInventoryItemDTO): Promise<string> {
    const sql = getSQL('command','inventory','createInventoryItem');
    const params = [
      dto.status ?? 'in_inventory',
      dto.categoryId,
      dto.brand,
      dto.model,
      dto.serialNumber,
      dto.color,
      dto.itemCondition,
      dto.quantity ?? 1,
      dto.amount,
      dto.resale,
      dto.itemReplace,
      dto.binNumber,
      dto.ownerTag,
      dto.itemDescription,
      dto.attributes ? JSON.stringify(dto.attributes) : JSON.stringify({}),
      dto.inventoryNumber ?? null,
    ];
    const { rows } = await pool.query(sql, params);
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
      dto.amount,
      dto.resale,
      dto.itemReplace,
      dto.binNumber,
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
