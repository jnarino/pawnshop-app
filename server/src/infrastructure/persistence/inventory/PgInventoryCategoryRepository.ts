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
        categoryId: row.category_id,
        subcategoryId: row.subcategory_id,
        brand: row.brand,
        path: row.path,
    });
}

export class PgInventoryCategoryRepository
    implements InventoryCategoryRepository {
    constructor(private readonly pool: Pool) { }

    async create(category: InventoryCategory): Promise<InventoryCategory> {
        const result = await this.pool.query(SQL_CREATE, [
            category.categoryId,
            category.subcategoryId,
            category.brand,
            category.path
        ]);

        return mapRowToInventoryCategory(result.rows[0]);
    }

    async getAllAsTree(): Promise<InventoryCategory[]> {
        const result = await this.pool.query(SQL_GET_ALL_TREE);
        return result.rows.map(mapRowToInventoryCategory);
    }
}
