import assert from 'assert';
import express from 'express';
import request from 'node:http';
import { createApp } from '../../server';
import { test } from '../testHarness';

// NOTE: For a deeper route test you'd mock DB; here we just ensure health route present.

test('route: health endpoint returns ok', async () => {
  const app = createApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const body: any = await new Promise((resolve, reject) => {
    request.get({ hostname: '127.0.0.1', port, path: '/api/health' }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
  server.close();
  assert.strictEqual(body.ok, true);
});
