import { Pool, PoolClient } from 'pg';
import { LayawayUnitOfWork } from '../../application/common/LayawayUnitOfWork';
import { InventoryItemRepository } from '../../domains/inventory/InventoryItemRepository';
import { LayawayRepository } from '../../domains/layaway/LayawayRepository';
import { StoreTransactionRepository } from '../../domains/storeTransaction/StoreTransactionRepository';
import { PgInventoryItemRepository } from '../persistence/inventory/PgInventoryItemRepository';
import { PgLayawayRepository } from '../persistence/layaway/PgLayawayRepository';
import { PgStoreTransactionRepository } from '../persistence/storeTransaction/PgStoreTransactionRepository';

export class PgLayawayUnitOfWork implements LayawayUnitOfWork {
    constructor(private readonly pool: Pool) { }

    async runInTransaction<T>(
        fn: (deps: {
            inventoryItemRepository: InventoryItemRepository;
            layawayRepository: LayawayRepository;
            storeTransactionRepository: StoreTransactionRepository;
        }) => Promise<T>
    ): Promise<T> {
        const client: PoolClient = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const inventoryItemRepository = new PgInventoryItemRepository(client);
            const layawayRepository = new PgLayawayRepository(client);
            const storeTransactionRepository = new PgStoreTransactionRepository(client);

            const result = await fn({ 
                inventoryItemRepository, 
                layawayRepository,
                storeTransactionRepository
            });

            await client.query('COMMIT');
            return result;
        } catch (err) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // ignore
            }
            throw err;
        } finally {
            client.release();
        }
    }
}
