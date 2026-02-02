import { Pool, PoolClient } from 'pg';
import { GunTransactionHistory } from '../../../domains/gun/GunTransactionHistory';
import { GunTransactionHistoryRepository } from '../../../domains/gun/GunRepository';
import { loadSql } from '../../db/sqlLoader';

const SQL_CREATE = loadSql('commands', 'gun/gun_transaction_history_create');
const SQL_FIND_TYPE_ID_BY_CODE = loadSql('queries', 'gun/gun_transaction_type_find_id_by_code');

export class PgGunTransactionHistoryRepository implements GunTransactionHistoryRepository {
    constructor(private readonly db: Pool | PoolClient) { }

    async getTransactionTypeIdByCode(code: string): Promise<string | null> {
        const result = await this.db.query<{ id: string }>(SQL_FIND_TYPE_ID_BY_CODE, [code]);
        return result.rows[0]?.id || null;
    }

    async create(history: GunTransactionHistory): Promise<void> {
        await this.db.query(SQL_CREATE, [
            history.id,
            history.inventoryNumber,
            history.inventoryItemId,
            history.transactionDate,
            history.typeId,
            history.clerkUserId,
            history.notes
        ]);
    }
}
