
import { Pool, PoolClient } from 'pg';
import { PawnTicketUnitOfWork } from '../../application/common/PawnTicketUnitOfWork';
import { InventoryItemRepository } from '../../domains/inventory/InventoryItemRepository';
import { PawnTicketRepository } from '../../domains/pawnTicket/PawnTicketRepository';
import { StoreTransactionRepository } from '../../domains/storeTransaction/StoreTransactionRepository';
import { CustomerRepository } from '../../domains/customer/CustomerRepository';
import { GunLogRepository, GunTransactionHistoryRepository } from '../../domains/gun/GunRepository';
import { PgInventoryItemRepository } from '../persistence/inventory/PgInventoryItemRepository';
import { PgPawnTicketRepository } from '../persistence/pawnTicket/PgPawnTicketRepository';
import { PgStoreTransactionRepository } from '../persistence/storeTransaction/PgStoreTransactionRepository';
import { PgCustomerRepository } from '../persistence/customer/PgCustomerRepository';
import { PgGunLogRepository } from '../persistence/gun/PgGunLogRepository';
import { PgGunTransactionHistoryRepository } from '../persistence/gun/PgGunTransactionHistoryRepository';

export class PgPawnTicketUnitOfWork implements PawnTicketUnitOfWork {
    constructor(private readonly pool: Pool) { }

    async runInTransaction<T>(
        fn: (deps: {
            inventoryItemRepository: InventoryItemRepository;
            pawnTicketRepository: PawnTicketRepository;
            storeTransactionRepository: StoreTransactionRepository;
            customerRepository: CustomerRepository;
            gunLogRepository: GunLogRepository;
            gunTransactionHistoryRepository: GunTransactionHistoryRepository;
            dbClient: PoolClient;
        }) => Promise<T>
    ): Promise<T> {
        const client: PoolClient = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const inventoryItemRepository = new PgInventoryItemRepository(client);
            const pawnTicketRepository = new PgPawnTicketRepository(client);
            const storeTransactionRepository = new PgStoreTransactionRepository(client);
            const customerRepository = new PgCustomerRepository(client);
            const gunLogRepository = new PgGunLogRepository(client);
            const gunTransactionHistoryRepository = new PgGunTransactionHistoryRepository(client);

            const result = await fn({ 
                inventoryItemRepository, 
                pawnTicketRepository,
                storeTransactionRepository,
                customerRepository,
                gunLogRepository,
                gunTransactionHistoryRepository,
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
