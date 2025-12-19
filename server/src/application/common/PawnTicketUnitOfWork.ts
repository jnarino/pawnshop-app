import { InventoryItemRepository } from '../../domains/inventory/InventoryItemRepository';
import { PawnTicketRepository } from '../../domains/pawnTicket/PawnTicketRepository';
import { PoolClient } from 'pg';

/**
 * Application-level abstraction: "run these pawn-related operations
 * inside a single DB transaction".
 */
export interface PawnTicketUnitOfWork {
    runInTransaction<T>(
        fn: (deps: {
            inventoryItemRepository: InventoryItemRepository;
            pawnTicketRepository: PawnTicketRepository;
            dbClient: PoolClient;
        }) => Promise<T>
    ): Promise<T>;
}
