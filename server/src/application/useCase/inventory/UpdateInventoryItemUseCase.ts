import { IInventoryRepository, UpdateInventoryItemDTO } from '../../../domain/inventory/IInventoryRepository';
import { validateUpdateInventoryItem } from '../../validation/inventoryValidation';

export class UpdateInventoryItemUseCase {
  constructor(private repo: IInventoryRepository) {}
  async execute(id: string, partial: UpdateInventoryItemDTO): Promise<boolean> {
    const cleaned = validateUpdateInventoryItem(partial);
    return this.repo.update(id, cleaned);
  }
}
