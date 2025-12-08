import { Pool } from 'pg';
import { InventoryCategory } from '../../../domains/inventory/InventoryCategory';
import { InventoryCategoryRepository } from '../../../domains/inventory/InventoryCategoryRepository';
import { loadSql } from '../../db/sqlLoader';

const SQL_CREATE = loadSql(
    'commands',
    'inventory/inventory_category_create'
);

const SQL_GET_ALL_TREE = loadSql(
    'queries',
    'inventory/inventory_category_get_all_tree'
);

function mapRowToInventoryCategory(row: any): InventoryCategory {
    return new InventoryCategory({
        id: row.id,
        name: row.name,
        code: row.code,
        parentId: row.parent_id ?? null,
        path: row.path ?? null,
        depth: row.depth
    });
}

export class PgInventoryCategoryRepository
    implements InventoryCategoryRepository {
    constructor(private readonly pool: Pool) { }

    async create(category: InventoryCategory): Promise<InventoryCategory> {
        const result = await this.pool.query(SQL_CREATE, [
            category.id,
            category.name,
            category.code,
            category.parentId
        ]);

        return mapRowToInventoryCategory(result.rows[0]);
    }

    async getAllAsTree(): Promise<InventoryCategory[]> {
        const result = await this.pool.query(SQL_GET_ALL_TREE);
        return result.rows.map(mapRowToInventoryCategory);
    }
}
