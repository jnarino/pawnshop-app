import { InventoryItemRepository } from '../../domains/inventory/InventoryItemRepository';
import { HoldRepository } from '../../domains/hold/HoldRepository';
import { ControlNumberRepository } from '../../domains/controlNumber/ControlNumberRepository';

export interface HoldUnitOfWork {
  runInTransaction<T>(
    fn: (deps: {
      inventoryItemRepository: InventoryItemRepository;
      holdRepository: HoldRepository;
      controlNumberRepository: ControlNumberRepository;
    }) => Promise<T>
  ): Promise<T>;
}
