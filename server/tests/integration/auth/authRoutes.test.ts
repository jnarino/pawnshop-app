// tests/integration/authRoutes.test.ts
import request from 'supertest';
import { createApp } from '../../../src/container';
import { pool } from '../../../src/infrastructure/db';

afterAll(async () => {
  await pool.end();
});

describe('Auth routes', () => {
  it('should return 400 on invalid login payload', async () => {
    const app = await createApp();

    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation error');
  });
});
