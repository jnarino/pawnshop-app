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
const SQL_GET_CATEGORY_BY_SUBCATEGORY_ID = loadSql(
    'queries',
    'inventory/inventory_category_get_by_subcategory_id'
);
const SQL_CREATE = loadSql(
    'commands',
    'inventory/inventory_category_create'
);
const SQL_EXISTS_BY_CODE = loadSql(
    'queries',
    'inventory/inventory_category_exists_by_code'
);

function mapRowToInventoryCategory(row: any): InventoryCategory {
    return new InventoryCategory({
        id: row.id,
        name: row.name,
        code: row.code,
        isActive: row.is_active
    });
}

export class PgInventoryCategoryRepository
    implements InventoryCategoryRepository {
    constructor(private readonly db: DbClient) { }

    async existsByCode(code: string): Promise<boolean> {
        const result = await this.db.query(SQL_EXISTS_BY_CODE, [code]);
        return (result.rowCount ?? 0) > 0;
    }

    async create(category: InventoryCategory): Promise<InventoryCategory> {
        const result = await this.db.query(SQL_CREATE, [
            category.id,
            category.name,
            category.code,
            category.isActive ?? true
        ]);
        return mapRowToInventoryCategory(result.rows[0]);
    }

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

    async getCategoryBySubcategoryId(subcategoryId: string): Promise<InventoryCategory | null> {
        const result = await this.db.query(SQL_GET_CATEGORY_BY_SUBCATEGORY_ID, [subcategoryId]);
        if (result.rowCount === 0) return null;
        return mapRowToInventoryCategory(result.rows[0]);
    }
}
