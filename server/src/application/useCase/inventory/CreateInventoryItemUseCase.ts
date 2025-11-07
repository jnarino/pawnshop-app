import { IInventoryRepository, CreateInventoryItemDTO } from '../../../domain/inventory/IInventoryRepository';
import { InventoryItem } from '../../../domain/inventory/InventoryItem';
import { ValidationError } from '../../errors';
import type { PoolClient } from 'pg';

export class CreateInventoryItemUseCase {
  constructor(private readonly repo: IInventoryRepository) {}

  async execute(dto: CreateInventoryItemDTO): Promise<string> {
    if (!dto.categoryId) throw new ValidationError('categoryId is required');
    return this.repo.createSingleItem(dto);
  }

  async createInTransaction(client: PoolClient, dto: CreateInventoryItemDTO): Promise<string> {
    if (!dto.categoryId) throw new ValidationError('categoryId is required');
    return this.repo.createInTransaction(client, dto);
  }

  // ✅ Add method to find by ID within transaction context
  async findByIdInTransaction(client: PoolClient, id: string): Promise<InventoryItem | null> {
    // Use the same client to ensure we can see the newly created item
    return this.repo.findByIdInTransaction?.(client, id) || this.repo.findById(id);
  }

  async findById(id: string): Promise<InventoryItem | null> {
    return this.repo.findById(id);
  }

  async update(id: string, updates: { status?: string }): Promise<boolean> {
    return this.repo.update(id, updates);
  }
}
