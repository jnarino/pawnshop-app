import { Pool, PoolClient } from 'pg';
import { HoldUnitOfWork } from '../../application/common/HoldUnitOfWork';
import { InventoryItemRepository } from '../../domains/inventory/InventoryItemRepository';
import { HoldRepository } from '../../domains/hold/HoldRepository';
import { ControlNumberRepository } from '../../domains/controlNumber/ControlNumberRepository';
import { PgInventoryItemRepository } from '../persistence/inventory/PgInventoryItemRepository';
import { PgHoldRepository } from '../persistence/hold/PgHoldRepository';
import { PgControlNumberRepository } from '../persistence/controlNumber/PgControlNumberRepository';

export class PgHoldUnitOfWork implements HoldUnitOfWork {
    constructor(private readonly pool: Pool) { }

    async runInTransaction<T>(
        fn: (deps: {
            inventoryItemRepository: InventoryItemRepository;
            holdRepository: HoldRepository;
            controlNumberRepository: ControlNumberRepository;
        }) => Promise<T>
    ): Promise<T> {
        const client: PoolClient = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const inventoryItemRepository = new PgInventoryItemRepository(client);
            const holdRepository = new PgHoldRepository(client);
            const controlNumberRepository = new PgControlNumberRepository(client);

            const result = await fn({ 
                inventoryItemRepository, 
                holdRepository,
                controlNumberRepository
            });

            await client.query('COMMIT');
            return result;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}
