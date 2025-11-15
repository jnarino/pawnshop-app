import type { IInventoryStatusRepository } from '../../../../infrastructure/persistence/InventoryStatusRepository';
import type { InventoryStatus } from '../../../../domain/inventory/InventoryStatus';

export class ListInventoryStatusesUseCase {
  constructor(private readonly repo: IInventoryStatusRepository) {}

  async execute(): Promise<InventoryStatus[]> {
    return this.repo.findAll(); // ✅ Use correct method name
  }
}
