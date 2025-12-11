import { Pool, PoolClient } from 'pg';
import { InventoryCategory } from '../../../domains/inventory/InventoryCategory';
import { InventoryCategoryRepository } from '../../../domains/inventory/InventoryCategoryRepository';
import { loadSql } from '../../db/sqlLoader';

type DbClient = Pool | PoolClient;

const SQL_GET_ROOT_CATEGORIES = loadSql(
    'queries',
    'inventory/inventory_category_get_root_categories'
);

const SQL_GET_SUBCATEGORIES = loadSql(
    'queries',
    'inventory/inventory_category_get_subcategories_given_root'
);
const SQL_GET_BRANDS_GIVEN_CATEGORY_ROOT = loadSql(
    'queries',
    'inventory/inventory_category_get_brands_given_category_root'
);

function mapRowToInventoryCategory(row: any): InventoryCategory {
    return new InventoryCategory({
        id: row.id,
        name: row.name
    });
}

export class PgInventoryCategoryRepository
    implements InventoryCategoryRepository {
    constructor(private readonly db: DbClient) { }

    async getSubcategoriesGivenCategoryRoot(categoryId: string): Promise<InventoryCategory[]> {
        const result = await this.db.query(SQL_GET_SUBCATEGORIES, [categoryId]);
        return result.rows.map(mapRowToInventoryCategory);
    }

    async getRootCategories(): Promise<InventoryCategory[]> {
        const result = await this.db.query(SQL_GET_ROOT_CATEGORIES);
        return result.rows.map(mapRowToInventoryCategory);
    }

    async getBrandsGivenCategoryRoot(categoryId: string): Promise<InventoryCategory[]> {
        const result = await this.db.query(SQL_GET_BRANDS_GIVEN_CATEGORY_ROOT, [categoryId]);
        return result.rows.map(mapRowToInventoryCategory);
    }
}
