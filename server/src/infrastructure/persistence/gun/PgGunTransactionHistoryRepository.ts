import { Pool, PoolClient } from 'pg';
import { GunTransactionHistory } from '../../../domains/gun/GunTransactionHistory';
import { GunTransactionHistoryRepository } from '../../../domains/gun/GunRepository';
import { loadSql } from '../../db/sqlLoader';

const SQL_CREATE = loadSql('commands', 'gun/gun_transaction_history_create');

export class PgGunTransactionHistoryRepository implements GunTransactionHistoryRepository {
    constructor(private readonly db: Pool | PoolClient) { }

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
