import { IInventoryRepository } from '../../../domain/inventory/IInventoryRepository';
import { InventoryItem } from '../../../domain/inventory/InventoryItem';
import { validatePagination, PaginationInput } from '../../validation/pagination';

export interface ListInventoryItemsParams extends PaginationInput {}

export class ListInventoryItemsUseCase {
  constructor(private repo: IInventoryRepository) {}
  async execute(params: ListInventoryItemsParams = {}): Promise<InventoryItem[]> {
  const { limit, offset } = validatePagination(params);
  return this.repo.findAll(limit, offset);
  }
}
