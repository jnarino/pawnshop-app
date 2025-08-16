import assert from 'assert';
import http from 'node:http';
import express from 'express';
import { test } from '../testHarness';
import { buildInventoryRoute } from '../../route/inventoryRoute';
import { NotFoundError, ValidationError } from '../../application/errors';

function httpRequest(port: number, method: string, path: string, body?: any): Promise<{ status:number; json:any; }>{
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers: { 'Content-Type':'application/json', 'Content-Length': data ? Buffer.byteLength(data) : 0 } }, res => {
      let buf='';
      res.on('data', c => buf+=c);
      res.on('end', () => {
        let json: any = undefined;
        try { json = buf ? JSON.parse(buf) : undefined; } catch {}
        resolve({ status: res.statusCode || 0, json });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function makeApp(fake: any) {
  const app = express();
  app.use(express.json());
  app.use('/api/inventory', buildInventoryRoute(fake));
  // simple error handler mimicking real one minimal subset
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof ValidationError) return res.status(400).json({ error:{ code: err.code, message: err.message } });
    if (err instanceof NotFoundError) return res.status(404).json({ error:{ code: err.code, message: err.message } });
    res.status(500).json({ error:{ code: 'INTERNAL', message: 'internal' } });
  });
  return app;
}

test('route/inventory: list returns injected data', async () => {
  const fake = { list: async (_req:any,_res:any,_n:any)=>{}, get: async()=>{}, create: async()=>{}, update: async()=>{}, delete: async()=>{} } as any; // placeholder to satisfy types
  const controller = {
    list: (_req:any,res:any)=>res.json([{ id:'1'}]),
    get: (_req:any,res:any,next:any)=>next(new NotFoundError('missing')), // to test error path separately
    create: (_req:any,res:any,next:any)=>next(new ValidationError('invalid firearm attributes')),
    update: (_req:any,res:any)=>res.sendStatus(204),
    delete: (_req:any,res:any)=>res.sendStatus(204),
  } as any;
  const app = makeApp(controller);
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const listRes = await httpRequest(port, 'GET', '/api/inventory');
  assert.strictEqual(listRes.status, 200);
  assert.deepStrictEqual(listRes.json, [{ id:'1'}]);
  const createRes = await httpRequest(port, 'POST', '/api/inventory', { type:'FIREARM' });
  assert.strictEqual(createRes.status, 400);
  const getRes = await httpRequest(port, 'GET', '/api/inventory/abc');
  assert.strictEqual(getRes.status, 404);
  server.close();
});
