import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';
import { InventoryStatus } from '../../domain/inventory/InventoryStatus';

export class InventoryStatusRepository {
  async list(): Promise<InventoryStatus[]> {
    const sql = getSQL('query','inventory','listStatuses');
    const { rows } = await pool.query(sql);
    return rows.map(r => ({
      code: r.code,
      description: r.description ?? undefined,
      isTerminal: r.is_terminal,
      sortOrder: r.sort_order,
      active: r.active,
    }));
  }
  async find(code: string): Promise<InventoryStatus | null> {
    const sql = getSQL('query','inventory','findStatusByCode');
    const { rows } = await pool.query(sql,[code]);
    const r = rows[0];
    if (!r) return null;
    return {
      code: r.code,
      description: r.description ?? undefined,
      isTerminal: r.is_terminal,
      sortOrder: r.sort_order,
      active: r.active,
    };
  }
  async insert(input: { code: string; description?: string; isTerminal: boolean; sortOrder: number; }) {
    await pool.query(
      `INSERT INTO inventory_item_status(code, description, is_terminal, sort_order, active)
       VALUES ($1,$2,$3,$4,true)`,
      [input.code, input.description ?? null, input.isTerminal, input.sortOrder]
    );
  }
  async deactivate(code: string) {
    await pool.query(
      `UPDATE inventory_item_status SET active = false, updated_at = now() WHERE code = $1`,
      [code]
    );
  }
}
