import { InventoryStatusRepository } from '../../../../infrastructure/persistence/InventoryStatusRepository';
import { InventoryStatus } from '../../../../domain/inventory/InventoryStatus';

export class ListInventoryStatusesUseCase {
  constructor(private repo: InventoryStatusRepository) {}
  async execute(): Promise<InventoryStatus[]> {
    return this.repo.list();
  }
}
