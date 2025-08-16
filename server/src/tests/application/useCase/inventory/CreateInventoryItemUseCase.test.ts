import assert from 'assert';
import { CreateInventoryItemUseCase } from '../../../../application/useCase/inventory/CreateInventoryItemUseCase';
import { IInventoryRepository } from '../../../../domain/inventory/IInventoryRepository';
import { test } from '../../../testHarness';

class InMemoryInventoryRepo implements IInventoryRepository {
  items: any[] = [];
  seq = 1;
  async create(dto: any) { const id = String(this.seq++); this.items.push({ id, ...dto }); return id; }
  async findById(id: string) { return this.items.find(i => i.id === id) || null; }
  async findAll() { return this.items; }
  async update() { return true; }
  async delete() { return true; }
}

test('application/useCase/inventory: CreateInventoryItemUseCase creates firearm', async () => {
  const repo = new InMemoryInventoryRepo();
  const uc = new CreateInventoryItemUseCase(repo);
  const id = await uc.execute({
    type: 'FIREARM',
    categoryId: '1',
    itemCondition: 'Good',
    quantity: 1,
    itemReplace: 500,
    itemDescription: 'Test firearm',
    firearm: { caliberGauge: '9MM' }
  } as any);
  assert.strictEqual(id, '1');
});

test('application/useCase/inventory: CreateInventoryItemUseCase missing firearm attrs', async () => {
  const repo = new InMemoryInventoryRepo();
  const uc = new CreateInventoryItemUseCase(repo);
  await assert.rejects(() => uc.execute({
    type: 'FIREARM',
    quantity: 1,
  } as any), /firearm/);
});
