import assert from 'assert';
import { test } from '../../../../testHarness';
import { CreateInventoryStatusUseCase } from '../../../../../application/useCase/inventory/status/CreateInventoryStatusUseCase';
import { DeactivateInventoryStatusUseCase } from '../../../../../application/useCase/inventory/status/DeactivateInventoryStatusUseCase';
import { ValidationError } from '../../../../../application/errors';

class FakeStatusRepo {
  data: any[] = [ { code:'in_inventory', active:true, isTerminal:false, sortOrder:10 } ];
  async list() { return this.data; }
  async find(code: string) { return this.data.find(d => d.code === code) || null; }
  async insert(row: any) { this.data.push({ ...row, active:true }); }
  async deactivate(code: string) { const r = await this.find(code); if (r) r.active = false; }
}

test('CreateInventoryStatusUseCase: rejects invalid code', async () => {
  const repo = new FakeStatusRepo();
  const uc = new CreateInventoryStatusUseCase(repo as any);
  await assert.rejects(() => uc.execute({ code: 'Bad-Case' }), (e:any) => e instanceof ValidationError && /invalid code/.test(e.message));
});

test('CreateInventoryStatusUseCase: rejects duplicate code', async () => {
  const repo = new FakeStatusRepo();
  const uc = new CreateInventoryStatusUseCase(repo as any);
  await assert.rejects(() => uc.execute({ code: 'in_inventory' }), (e:any) => e instanceof ValidationError && /already exists/.test(e.message));
});

test('CreateInventoryStatusUseCase: creates new code', async () => {
  const repo = new FakeStatusRepo();
  const uc = new CreateInventoryStatusUseCase(repo as any);
  await uc.execute({ code: 'for_sale2', isTerminal:false });
  assert(repo.data.some(d => d.code === 'for_sale2'));
});

test('DeactivateInventoryStatusUseCase: requires code', async () => {
  const repo = new FakeStatusRepo();
  const uc = new DeactivateInventoryStatusUseCase(repo as any);
  await assert.rejects(() => uc.execute(''), (e:any) => e instanceof ValidationError && /code required/.test(e.message));
});

test('DeactivateInventoryStatusUseCase: status not found', async () => {
  const repo = new FakeStatusRepo();
  const uc = new DeactivateInventoryStatusUseCase(repo as any);
  await assert.rejects(() => uc.execute('missing'), (e:any) => e instanceof ValidationError && /not found/.test(e.message));
});

test('DeactivateInventoryStatusUseCase: deactivates', async () => {
  const repo = new FakeStatusRepo();
  const uc = new DeactivateInventoryStatusUseCase(repo as any);
  await uc.execute('in_inventory');
  const rec = await repo.find('in_inventory');
  assert.strictEqual(rec?.active, false);
});
