import { Pool, PoolClient } from 'pg';
import { GunLog } from '../../../domains/gun/GunLog';
import { GunLogRepository } from '../../../domains/gun/GunRepository';
import { loadSql } from '../../db/sqlLoader';

const SQL_CREATE = loadSql('commands', 'gun/gun_log_create');
const SQL_UPDATE = loadSql('commands', 'gun/gun_log_update');
const SQL_FIND_BY_INVENTORY_ITEM_ID = loadSql('queries', 'gun/gun_log_find_by_inventory_item_id');

export class PgGunLogRepository implements GunLogRepository {
    constructor(private readonly db: Pool | PoolClient) { }

    async getNextGunTransferNumber(): Promise<string> {
        const result = await this.db.query<{ get_next_gun_transfer_number: string }>('SELECT get_next_gun_transfer_number()');
        return result.rows[0].get_next_gun_transfer_number;
    }

    async update(gunLog: GunLog): Promise<void> {
        await this.db.query(SQL_UPDATE, [
            gunLog.id,
            gunLog.soldDate ?? null,
            gunLog.soldFirstName ?? null,
            gunLog.soldMiddleName ?? null,
            gunLog.soldLastName ?? null,
            gunLog.soldStreetAddress ?? null,
            gunLog.soldCity ?? null,
            gunLog.soldState ?? null,
            gunLog.soldZipCode ?? null,
            gunLog.soldAmount ?? null,
            gunLog.soldIdType ?? null,
            gunLog.soldIdNumber ?? null,
            gunLog.nicstn ?? null,
            gunLog.transactionNum ?? null,
            gunLog.origTransNum ?? null
        ]);
    }

    async findByInventoryItemId(inventoryItemId: string): Promise<GunLog | null> {
        const result = await this.db.query(SQL_FIND_BY_INVENTORY_ITEM_ID, [inventoryItemId]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new GunLog({
            id: row.id,
            inventoryItemId: row.inventory_item_id,
            manufacturer: row.manufacturer,
            model: row.model,
            serial: row.serial,
            caliber: row.caliber,
            action: row.action,
            condition: row.condition,
            gunType: row.guntype,
            importer: row.importer,
            buyerAmount: Number(row.buyer_amount),
            buyerDate: new Date(row.buyer_date),
            buyerFirstName: row.buyer_first_name,
            buyerMiddleName: row.buyer_middle_name,
            buyerLastName: row.buyer_last_name,
            buyerStreetAddress: row.buyer_street_address,
            buyerCity: row.buyer_city,
            buyerState: row.buyer_state_us,
            buyerZipCode: row.buyer_zip_code,
            buyerIdType: row.buyer_id_type,
            buyerIdNumber: row.buyer_id_number,
            
            soldDate: row.sold_date ? new Date(row.sold_date) : undefined,
            soldFirstName: row.sold_first_name,
            soldMiddleName: row.sold_middle_name,
            soldLastName: row.sold_last_name,
            soldStreetAddress: row.sold_street_address,
            soldCity: row.sold_city,
            soldState: row.sold_state_us,
            soldZipCode: row.sold_zip_code,
            soldAmount: row.sold_amount ? Number(row.sold_amount) : undefined,
            soldIdType: row.sold_id_type,
            soldIdNumber: row.sold_id_number,
            nicstn: row.nicstn,
            transactionNum: row.transaction_num,
            
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        });
    }

    async create(gunLog: GunLog): Promise<void> {
        await this.db.query(SQL_CREATE, [
            gunLog.id,
            gunLog.inventoryItemId,
            gunLog.manufacturer,
            gunLog.model,
            gunLog.serial,
            gunLog.caliber,
            gunLog.action,
            gunLog.condition,
            gunLog.gunType,
            gunLog.importer,
            gunLog.buyerAmount,
            gunLog.buyerDate,
            gunLog.buyerFirstName,
            gunLog.buyerMiddleName,
            gunLog.buyerLastName,
            gunLog.buyerStreetAddress,
            gunLog.buyerCity,
            gunLog.buyerState,
            gunLog.buyerZipCode,
            gunLog.buyerIdType,
            gunLog.buyerIdNumber
        ]);
    }
}
