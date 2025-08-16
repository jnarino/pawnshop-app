import assert from 'assert';
import { UpdateInventoryItemUseCase } from '../../../../application/useCase/inventory/UpdateInventoryItemUseCase';
import { DeleteInventoryItemUseCase } from '../../../../application/useCase/inventory/DeleteInventoryItemUseCase';
import { CreateInventoryItemUseCase } from '../../../../application/useCase/inventory/CreateInventoryItemUseCase';
import { IInventoryRepository, CreateInventoryItemDTO, UpdateInventoryItemDTO } from '../../../../domain/inventory/IInventoryRepository';
import { test } from '../../../testHarness';

class InMemRepo implements IInventoryRepository {
  data: any[] = [];
  seq = 1;
  async create(dto: CreateInventoryItemDTO) { const id = String(this.seq++); this.data.push({ id, status: dto.status ?? 'in_inventory', ...dto }); return id; }
  async findById(id: string) { return this.data.find(d => d.id === id) || null; }
  async findAll() { return this.data; }
  async update(id: string, dto: UpdateInventoryItemDTO) { const idx = this.data.findIndex(d=>d.id===id); if (idx===-1) return false; this.data[idx] = { ...this.data[idx], ...dto }; return true; }
  async delete(id: string) { const before = this.data.length; this.data = this.data.filter(d=>d.id!==id); return this.data.length !== before; }
}

function makeRepoWithItem() {
  const repo = new InMemRepo();
  const create = new CreateInventoryItemUseCase(repo);
  return { repo, create };
}

test('application/useCase/inventory: UpdateInventoryItemUseCase updates fields', async () => {
  const { repo, create } = makeRepoWithItem();
  const id = await create.execute({ type: 'FIREARM', firearm: { caliberGauge: '9MM' }, quantity:1 } as any);
  const updateUC = new UpdateInventoryItemUseCase(repo);
  const ok = await updateUC.execute(id, { itemCondition: 'Excellent', quantity: 2 });
  assert.strictEqual(ok, true);
  const item = await repo.findById(id);
  assert.strictEqual(item?.itemCondition, 'Excellent');
  assert.strictEqual(item?.quantity, 2);
});

test('application/useCase/inventory: UpdateInventoryItemUseCase returns false on missing', async () => {
  const repo = new InMemRepo();
  const updateUC = new UpdateInventoryItemUseCase(repo);
  const ok = await updateUC.execute('nope', { itemCondition: 'Bad' });
  assert.strictEqual(ok, false);
});

test('application/useCase/inventory: DeleteInventoryItemUseCase deletes item', async () => {
  const { repo, create } = makeRepoWithItem();
  const id = await create.execute({ type: 'JEWELRY', jewelry: { metal: 'Gold' }, quantity:1 } as any);
  const delUC = new DeleteInventoryItemUseCase(repo);
  const ok = await delUC.execute(id);
  assert.strictEqual(ok, true);
  const still = await repo.findById(id);
  assert.strictEqual(still, null);
});

test('application/useCase/inventory: DeleteInventoryItemUseCase missing returns false', async () => {
  const repo = new InMemRepo();
  const delUC = new DeleteInventoryItemUseCase(repo);
  const ok = await delUC.execute('missing');
  assert.strictEqual(ok, false);
});
