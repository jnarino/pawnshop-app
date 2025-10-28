import assert from 'assert';
import http from 'node:http';
import express from 'express';
import { test } from '../testHarness';
import { buildInventoryStatusRoute } from '../../infrastructure/http/routes/inventoryStatusRoute';
import { ValidationError } from '../../application/errors';

function httpRequest(port: number, method: string, path: string, body?: any): Promise<{ status:number; json:any; }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request({ hostname:'127.0.0.1', port, path, method, headers:{ 'Content-Type':'application/json', 'Content-Length': data ? Buffer.byteLength(data) : 0 } }, res => {
      let buf=''; res.on('data', c=>buf+=c); res.on('end', () => { let json: any; try { json = buf ? JSON.parse(buf) : undefined; } catch {} resolve({ status: res.statusCode || 0, json }); });
    });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}

function makeApp(controller: any) {
  const app = express();
  app.use(express.json());
  app.use('/api/inventory-status', buildInventoryStatusRoute(controller));
  app.use((err:any,_req:any,res:any,_next:any)=>{
    if (err instanceof ValidationError) return res.status(400).json({ error:{ code: err.code, message: err.message } });
    res.status(500).json({ error:{ code:'INTERNAL', message:'internal' } });
  });
  return app;
}

test('route/inventory-status: CRUD basic flow', async () => {
  const controller = {
    list: (_req:any,res:any)=>res.json([{ code:'in_inventory' }]),
    create: (_req:any,res:any)=>res.sendStatus(201),
    remove: (_req:any,res:any)=>res.sendStatus(204),
  };
  const app = makeApp(controller);
  const server = app.listen(0);
  const port = (server.address() as any).port;

  const listRes = await httpRequest(port,'GET','/api/inventory-status');
  assert.strictEqual(listRes.status, 200);
  assert.deepStrictEqual(listRes.json, [{ code:'in_inventory' }]);

  const createRes = await httpRequest(port,'POST','/api/inventory-status', { code:'new_code' });
  assert.strictEqual(createRes.status, 201);

  const deleteRes = await httpRequest(port,'DELETE','/api/inventory-status/obsolete');
  assert.strictEqual(deleteRes.status, 204);

  server.close();
});
