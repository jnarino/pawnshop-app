import { IInventoryRepository, CreateInventoryItemDTO } from '../../../domain/inventory/IInventoryRepository';
import { validateCreateInventoryItem } from '../../validation/inventoryValidation';

export class CreateInventoryItemUseCase {
  constructor(private repo: IInventoryRepository) {}
  async execute(input: CreateInventoryItemDTO): Promise<string> {
    const cleaned = validateCreateInventoryItem(input);
    return this.repo.create(cleaned);
  }
}
