import assert from 'assert';
import { makeInventoryStatusController } from '../../../controller/inventory/inventoryStatusControllerFactory';

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = (c:number) => { res.statusCode = c; return res; };
  res.sentStatus = undefined;
  res.sendStatus = (c:number) => { res.sentStatus = c; return res; };
  res.body = undefined;
  res.json = (b:any) => { res.body = b; return res; };
  return res;
}

(async () => {
  // list
  const listUC = { execute: async () => [{ code:'in_inventory', active:true }] } as any;
  const createUC = { execute: async (_dto:any) => {} } as any;
  const deactivateUC = { execute: async (_code:string) => {} } as any;
  const controller = makeInventoryStatusController({ list: listUC, create: createUC, deactivate: deactivateUC });

  // list
  {
    const req: any = {}; const res = mockRes(); const next = (e?:any)=>{ if (e) throw e; };
    await controller.list(req, res, next);
    assert.deepStrictEqual(res.body, [{ code:'in_inventory', active:true }]);
  }
  // create
  {
    const req: any = { body: { code: 'new_status' } }; const res = mockRes(); const next = (e?:any)=>{ if (e) throw e; };
    await controller.create(req, res, next);
    assert.strictEqual(res.sentStatus, 201);
  }
  // remove
  {
    const req: any = { params: { code: 'obsolete' } }; const res = mockRes(); const next = (e?:any)=>{ if (e) throw e; };
    await controller.remove(req, res, next);
    assert.strictEqual(res.sentStatus, 204);
  }
})();
