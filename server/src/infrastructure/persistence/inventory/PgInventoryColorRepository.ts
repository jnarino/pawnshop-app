import { Pool } from 'pg';
import { InventoryGenericColor } from '../../../domains/inventory/InventoryColor';
import { InventoryColorRepository } from '../../../domains/inventory/InventoryColorRepository';
import { loadSql } from '../../db/sqlLoader';

const sqlFindAll = loadSql('queries', 'inventory/inventory_colors_find_all');

export class PgInventoryColorRepository implements InventoryColorRepository {
    constructor(private readonly pool: Pool) { }

    async findAllGenericColors(): Promise<InventoryGenericColor[]> {
        const result = await this.pool.query(sqlFindAll);
        return result.rows.map(row => this.mapRow(row));
    }

    private mapRow(row: any): InventoryGenericColor {
        return new InventoryGenericColor({
            id: row.id,
            value: row.value
        });
    }
}
