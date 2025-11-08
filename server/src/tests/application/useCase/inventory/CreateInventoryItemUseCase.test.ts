import assert from 'assert';
import { CreateInventoryItemUseCase } from '../../../../application/useCase/inventory/CreateInventoryItemUseCase';
import { IInventoryRepository } from '../../../../domain/inventory/IInventoryRepository';
import type { PoolClient } from 'pg';
import { test } from '../../../testHarness';

class InMemoryInventoryRepo implements IInventoryRepository {
  items: any[] = [];
  seq = 1;
  
  async createSingleItem(dto: any) { // ✅ Renamed
    const id = String(this.seq++); 
    this.items.push({ id, ...dto }); 
    return id; 
  }
  
  async createInTransaction(client: PoolClient, dto: any) { // ✅ Added
    return this.createSingleItem(dto);
  }
  
  async findById(id: string) { return this.items.find(i => i.id === id) || null; }
  async findAll() { return this.items; }
  async update() { return true; }
  async delete() { return true; }
}

test('application/useCase/inventory: CreateInventoryItemUseCase creates item with attributes', async () => {
  const repo = new InMemoryInventoryRepo();
  const uc = new CreateInventoryItemUseCase(repo);
  const id = await uc.execute({
    categoryId: 'cat1',
    itemCondition: 'Good',
    quantity: 1,
    itemReplace: 500,
    itemDescription: 'Test item',
    attributes: { caliberGauge: '9MM' }
  });
  assert.strictEqual(id, '1');
});
