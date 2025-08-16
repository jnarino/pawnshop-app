import { IInventoryRepository } from '../../../domain/inventory/IInventoryRepository';
import { InventoryItem } from '../../../domain/inventory/InventoryItem';
import { ValidationError } from '../../errors';
import { config } from '../../../config';

export interface ListInventoryItemsParams { limit?: number; offset?: number; }

export class ListInventoryItemsUseCase {
  constructor(private repo: IInventoryRepository) {}
  async execute(params: ListInventoryItemsParams = {}): Promise<InventoryItem[]> {
    const limit = params.limit ?? config.maxPageSize;
    const offset = params.offset ?? 0;
    if (limit < 1) throw new ValidationError('limit must be >=1');
    if (offset < 0) throw new ValidationError('offset must be >=0');
    if (limit > config.maxPageSize) throw new ValidationError(`limit must be <= ${config.maxPageSize}`);
    return this.repo.findAll(limit, offset);
  }
}
