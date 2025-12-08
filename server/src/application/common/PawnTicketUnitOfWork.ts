import { InventoryItemRepository } from '../../domains/inventory/InventoryItemRepository';
import { PawnTicketRepository } from '../../domains/pawnTicket/PawnTicketRepository';

/**
 * Application-level abstraction: "run these pawn-related operations
 * inside a single DB transaction".
 */
export interface PawnTicketUnitOfWork {
    runInTransaction<T>(
        fn: (deps: {
            inventoryItemRepository: InventoryItemRepository;
            pawnTicketRepository: PawnTicketRepository;
        }) => Promise<T>
    ): Promise<T>;
}
