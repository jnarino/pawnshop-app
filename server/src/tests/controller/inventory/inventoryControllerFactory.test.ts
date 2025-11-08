import assert from 'assert';
import { makeInventoryController } from '../../../controller/inventory/inventoryControllerFactory';
import { test } from '../../testHarness';

function uc<T>(value: T) { return { execute: async () => value }; }
function throwingUC(err: any) { return { execute: async () => { throw err; } }; }

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = (c:number) => { res.statusCode = c; return res; };
  res.jsonData = undefined;
  res.json = (d:any) => { res.jsonData = d; return res; };
  res.sentStatus = undefined;
  res.sendStatus = (c:number) => { res.sentStatus = c; return res; };
  return res;
}

test('controller/inventory: create returns id', async () => {
  const controller = makeInventoryController({
    list: uc([]) as any,
    get: uc(null) as any,
    create: { execute: async () => 'new-inv-id' } as any,
    update: uc(true) as any,
    delete: uc(true) as any,
  });
  const req: any = { body: { type: 'FIREARM', firearm: { caliberGauge: '9MM' }, quantity:1 } };
  const res = mockRes();
  await controller.create(req, res as any, (e:any)=>{ if (e) throw e; });
  assert.strictEqual(res.statusCode, 201);
  assert.deepStrictEqual(res.jsonData, { id: 'new-inv-id' });
});

test('controller/inventory: get missing propagates NotFoundError', async () => {
  const controller = makeInventoryController({
    list: uc([]) as any,
    get: uc(null) as any,
    create: uc('id') as any,
    update: uc(false) as any,
    delete: uc(false) as any,
  });
  const res = mockRes();
  let captured: any;
  await controller.get({ params:{ id:'missing'} } as any, res as any, (e:any)=>{ captured = e; });
  assert.ok(captured, 'expected error passed to next');
  assert.match(String(captured.message || captured), /not found/i);
});

test('controller/inventory: update returns 204', async () => {
  const controller = makeInventoryController({
    list: uc([]) as any,
    get: uc({ id:'1' }) as any,
    create: uc('id') as any,
    update: { execute: async () => true } as any,
    delete: uc(true) as any,
  });
  const res = mockRes();
  await controller.update({ params:{ id:'1' }, body:{ itemCondition:'Good'} } as any, res as any, (e:any)=>{ if (e) throw e; });
  assert.strictEqual(res.sentStatus, 204);
});

test('controller/inventory: update missing yields NotFoundError', async () => {
  const controller = makeInventoryController({
    list: uc([]) as any,
    get: uc(null) as any,
    create: uc('id') as any,
    update: { execute: async () => false } as any,
    delete: uc(true) as any,
  });
  let err:any;
  await controller.update({ params:{ id:'no' }, body:{} } as any, {} as any, (e:any)=>{ err = e; });
  assert.ok(err);
});

test('controller/inventory: delete returns 204', async () => {
  const controller = makeInventoryController({
    list: uc([]) as any,
    get: uc({ id:'1'}) as any,
    create: uc('id') as any,
    update: uc(true) as any,
    delete: { execute: async () => true } as any,
  });
  const res = mockRes();
  await controller.delete({ params:{ id:'1'} } as any, res as any, (e:any)=>{ if (e) throw e; });
  assert.strictEqual(res.sentStatus, 204);
});

test('controller/inventory: delete missing propagates NotFoundError', async () => {
  const controller = makeInventoryController({
    list: uc([]) as any,
    get: uc(null) as any,
    create: uc('id') as any,
    update: uc(true) as any,
    delete: { execute: async () => false } as any,
  });
  let err:any;
  await controller.delete({ params:{ id:'missing'} } as any, {} as any, (e:any)=>{ err = e; });
  assert.ok(err);
});
