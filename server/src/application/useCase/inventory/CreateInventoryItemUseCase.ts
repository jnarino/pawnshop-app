import { IInventoryRepository, CreateInventoryItemDTO } from '../../../domain/inventory/IInventoryRepository';
import { validateCreateInventoryItem } from '../../validation/inventoryValidation';
import type { PoolClient } from 'pg';

export class CreateInventoryItemUseCase {
  constructor(private repo: IInventoryRepository) {}
  async execute(dto: CreateInventoryItemDTO): Promise<string> {
    return this.repo.createSingleItem(dto);
  }

  async createInTransaction(client: PoolClient, dto: CreateInventoryItemDTO): Promise<string> {
    return this.repo.createInTransaction(client, dto);
  }

  async findById(id: string): Promise<any> {
    return this.repo.findById(id);
  }
}
