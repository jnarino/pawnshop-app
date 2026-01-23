import { InventoryItemRepository } from '../../domains/inventory/InventoryItemRepository';
import { LayawayRepository } from '../../domains/layaway/LayawayRepository';
import { StoreTransactionRepository } from '../../domains/storeTransaction/StoreTransactionRepository';

export interface LayawayUnitOfWork {
    runInTransaction<T>(
        fn: (deps: {
            inventoryItemRepository: InventoryItemRepository;
            layawayRepository: LayawayRepository;
            storeTransactionRepository: StoreTransactionRepository;
        }) => Promise<T>
    ): Promise<T>;
}
