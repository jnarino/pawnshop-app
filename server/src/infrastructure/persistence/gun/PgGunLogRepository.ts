import { Pool, PoolClient } from 'pg';
import { GunLog } from '../../../domains/gun/GunLog';
import { GunLogRepository } from '../../../domains/gun/GunRepository';
import { loadSql } from '../../db/sqlLoader';

const SQL_CREATE = loadSql('commands', 'gun/gun_log_create');

export class PgGunLogRepository implements GunLogRepository {
    constructor(private readonly db: Pool | PoolClient) { }

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
