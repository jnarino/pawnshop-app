
import { InventoryItemRepository } from '../../domains/inventory/InventoryItemRepository';
import { PawnTicketRepository } from '../../domains/pawnTicket/PawnTicketRepository';
import { StoreTransactionRepository } from '../../domains/storeTransaction/StoreTransactionRepository';
import { GunLogRepository, GunTransactionHistoryRepository } from '../../domains/gun/GunRepository';
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
            storeTransactionRepository: StoreTransactionRepository;
            gunLogRepository: GunLogRepository;
            gunTransactionHistoryRepository: GunTransactionHistoryRepository;
            dbClient: PoolClient;
        }) => Promise<T>
    ): Promise<T>;
}
