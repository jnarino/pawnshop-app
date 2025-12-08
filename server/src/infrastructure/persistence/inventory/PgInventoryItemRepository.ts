import { Pool, PoolClient } from 'pg';
import { loadSql } from '../../db/sqlLoader';
import { InventoryItemRepository } from '../../../domains/inventory/InventoryItemRepository';
import { InventoryItem } from '../../../domains/inventory/InventoryItem';

type DbClient = Pool | PoolClient;

const SQL_CREATE = loadSql('commands', 'inventory/inventory_item_create');
const SQL_UPDATE = loadSql('commands', 'inventory/inventory_item_update');
const SQL_DELETE = loadSql('commands', 'inventory/inventory_item_delete');
const SQL_FIND_BY_ID = loadSql('queries', 'inventory/inventory_item_find_by_id');
const SQL_FIND_BY_INVENTORY_NUMBER = loadSql(
    'queries', 'inventory/inventory_item_find_by_inventory_number');
const SQL_FIND_BY_SERIAL_NUMBER = loadSql(
    'queries', 'inventory/inventory_item_find_by_serial_number'
);

function mapRowToInventoryItem(row: any): InventoryItem {
    return new InventoryItem({
        id: row.id,

        categoryId: row.category_id,
        status: row.status,
        quantity: row.quantity,

        brand: row.brand,
        model: row.model,
        serialNumber: row.serial_number,
        colorId: row.color_id,
        itemCondition: row.item_condition,
        ownerMark: row.owner_mark,
        itemDescription: row.item_description,

        priceAmount: row.price_amount !== null ? Number(row.price_amount) : null,
        resale: row.resale !== null ? Number(row.resale) : null,
        minResale: row.min_resale !== null ? Number(row.min_resale) : null,
        itemReplace: row.item_replace !== null ? Number(row.item_replace) : null,

        extra: row.extra ?? {},
        attributes: row.attributes ?? {},

        legacyInventoryNumber: row.legacy_inventory_number,
        legacyItemGuid: row.legacy_item_guid,
        legacyCategoryDescription: row.legacy_category_description,
        legacyBrandColorDescription: row.legacy_brand_color_description,

        inventoryNumber: row.inventory_number,
        lastUpdatedUserId: row.last_updated_user_id,

        createdAt: row.created_at,
        updatedAt: row.updated_at
    });
}

export class PgInventoryItemRepository implements InventoryItemRepository {
    constructor(private readonly db: DbClient) { }

    async create(item: InventoryItem): Promise<InventoryItem> {
        const result = await this.db.query(SQL_CREATE, [
            item.id,
            item.categoryId,
            item.status,
            item.brand,
            item.model,
            item.serialNumber,
            item.colorId,
            item.itemCondition,
            item.quantity,
            item.priceAmount,
            item.resale,
            item.minResale,
            item.itemReplace,
            item.ownerMark,
            item.itemDescription,
            item.extra,
            item.attributes,
            item.legacyInventoryNumber,
            item.legacyItemGuid,
            item.legacyCategoryDescription,
            item.legacyBrandColorDescription,
            item.inventoryNumber,
            item.lastUpdatedUserId,
            item.createdAt,
            item.updatedAt
        ]);

        return mapRowToInventoryItem(result.rows[0]);
    }

    async update(item: InventoryItem): Promise<InventoryItem> {
        const result = await this.db.query(SQL_UPDATE, [
            item.id,
            item.categoryId,
            item.status,
            item.brand,
            item.model,
            item.serialNumber,
            item.colorId,
            item.itemCondition,
            item.quantity,
            item.priceAmount,
            item.resale,
            item.minResale,
            item.itemReplace,
            item.ownerMark,
            item.itemDescription,
            item.extra,
            item.attributes,
            item.legacyInventoryNumber,
            item.legacyItemGuid,
            item.legacyCategoryDescription,
            item.legacyBrandColorDescription,
            item.inventoryNumber,
            item.lastUpdatedUserId,
            item.updatedAt
        ]);

        if (result.rows.length === 0) {
            return Promise.reject(new Error('Inventory item not found for update'));
        }

        return mapRowToInventoryItem(result.rows[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db.query(SQL_DELETE, [id]);
    }

    async findById(id: string): Promise<InventoryItem | null> {
        const result = await this.db.query(SQL_FIND_BY_ID, [id]);
        if (result.rows.length === 0) return null;
        return mapRowToInventoryItem(result.rows[0]);
    }

    async findByInventoryNumber(
        inventoryNumber: string
    ): Promise<InventoryItem | null> {
        const result = await this.db.query(SQL_FIND_BY_INVENTORY_NUMBER, [
            inventoryNumber
        ]);
        if (result.rows.length === 0) return null;
        return mapRowToInventoryItem(result.rows[0]);
    }

    async findBySerialNumber(
        serialNumber: string
    ): Promise<InventoryItem | null> {
        const result = await this.db.query(SQL_FIND_BY_SERIAL_NUMBER, [
            serialNumber
        ]);
        if (result.rows.length === 0) return null;
        return mapRowToInventoryItem(result.rows[0]);
    }
}
