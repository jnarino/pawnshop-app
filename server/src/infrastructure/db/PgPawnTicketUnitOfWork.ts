
import { Pool, PoolClient } from 'pg';
import { PawnTicketUnitOfWork } from '../../application/common/PawnTicketUnitOfWork';
import { InventoryItemRepository } from '../../domains/inventory/InventoryItemRepository';
import { PawnTicketRepository } from '../../domains/pawnTicket/PawnTicketRepository';
import { StoreTransactionRepository } from '../../domains/storeTransaction/StoreTransactionRepository';
import { PgInventoryItemRepository } from '../persistence/inventory/PgInventoryItemRepository';
import { PgPawnTicketRepository } from '../persistence/pawnTicket/PgPawnTicketRepository';
import { PgStoreTransactionRepository } from '../persistence/storeTransaction/PgStoreTransactionRepository';

export class PgPawnTicketUnitOfWork implements PawnTicketUnitOfWork {
    constructor(private readonly pool: Pool) { }

    async runInTransaction<T>(
        fn: (deps: {
            inventoryItemRepository: InventoryItemRepository;
            pawnTicketRepository: PawnTicketRepository;
            storeTransactionRepository: StoreTransactionRepository;
            dbClient: PoolClient;
        }) => Promise<T>
    ): Promise<T> {
        const client: PoolClient = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const inventoryItemRepository = new PgInventoryItemRepository(client);
            const pawnTicketRepository = new PgPawnTicketRepository(client);
            const storeTransactionRepository = new PgStoreTransactionRepository(client);

            const result = await fn({ 
                inventoryItemRepository, 
                pawnTicketRepository,
                storeTransactionRepository,
                dbClient: client 
            });

            await client.query('COMMIT');
            return result;
        } catch (err) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // ignore rollback error
            }
            throw err;
        } finally {
            client.release();
        }
    }
}
