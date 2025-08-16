import { IInventoryRepository } from '../../../domain/inventory/IInventoryRepository';
import { InventoryItem } from '../../../domain/inventory/InventoryItem';

export class GetInventoryItemUseCase {
  constructor(private repo: IInventoryRepository) {}
  async execute(id: string): Promise<InventoryItem | null> { return this.repo.findById(id); }
}
