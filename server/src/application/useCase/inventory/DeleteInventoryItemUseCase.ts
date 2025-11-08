import { IInventoryRepository } from '../../../domain/inventory/IInventoryRepository';

export class DeleteInventoryItemUseCase {
  constructor(private repo: IInventoryRepository) {}
  async execute(id: string): Promise<boolean> { return this.repo.delete(id); }
}
