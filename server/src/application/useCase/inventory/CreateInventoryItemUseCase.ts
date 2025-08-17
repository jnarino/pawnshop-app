import { IInventoryRepository, CreateInventoryItemDTO } from '../../../domain/inventory/IInventoryRepository';
import { validateCreateInventoryItem } from '../../validation/inventoryValidation';

export class CreateInventoryItemUseCase {
  constructor(private repo: IInventoryRepository) {}
  async execute(input: CreateInventoryItemDTO, opts?: { forceInPawn?: boolean }): Promise<string> {
    const cleaned = validateCreateInventoryItem(input);
    if (opts?.forceInPawn) cleaned.status = 'in_pawn';
    return this.repo.create(cleaned);
  }
}
