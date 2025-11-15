import assert from 'assert';
import { makeCustomerController } from '../../../controller/customer/customerControllerFactory';
import { ValidationError } from '../../../application/errors';
import { test } from '../../testHarness';

// Mock use cases
const mockUseCases = {
  list: {
    execute: async (params: any) => [
      { id: '1', firstName: 'John', lastName: 'Doe', dateOfBirth: params.dateOfBirth }
    ]
  },
  get: {
    execute: async (id: string) =>
      id === 'existing' ? { id, firstName: 'John', lastName: 'Doe' } : null
  },
  create: {
    execute: async (data: any) => 'new-customer-id'
  },
  update: {
    execute: async (id: string, data: any) => id === 'existing'
  },
  delete: {
    execute: async (id: string) => Promise.resolve()
  }
};

function createMockRequest(params = {}, query = {}, body = {}) {
  return { params, query, body } as any;
}

function createMockResponse() {
  const res: any = {
    status: function (code: number) { this.statusCode = code; return this; },
    json: function (data: any) { this.jsonData = data; return this; },
    send: function (data?: any) { this.sentData = data; return this; },
    sendStatus: function (code: number) { this.statusCode = code; return this; }
  };
  return res;
}

test('customerController: list customers with pagination', async () => {
  const controller = makeCustomerController(mockUseCases as any);
  const req = createMockRequest({}, { limit: '10', offset: '0', firstName: 'John' });
  const res = createMockResponse();

  await controller.list(req, res, () => { });

  assert.strictEqual(res.jsonData.length, 1);
  assert.strictEqual(res.jsonData[0].firstName, 'John');
});

test('customerController: list validates pagination parameters', async () => {
  const controller = makeCustomerController(mockUseCases as any);
  const req = createMockRequest({}, { limit: 'invalid' });
  const res = createMockResponse();
  let nextCalled = false;

  await controller.list(req, res, (error: any) => {
    nextCalled = true;
    assert(error instanceof ValidationError);
    assert(error.message.includes('limit/offset must be numbers'));
  });

  assert(nextCalled);
});

test('customerController: get existing customer', async () => {
  const controller = makeCustomerController(mockUseCases as any);
  const req = createMockRequest({ id: 'existing' });
  const res = createMockResponse();

  await controller.get(req, res, () => { });

  assert.strictEqual(res.jsonData.id, 'existing');
  assert.strictEqual(res.jsonData.firstName, 'John');
});

test('customerController: get non-existing customer returns 404', async () => {
  const controller = makeCustomerController(mockUseCases as any);
  const req = createMockRequest({ id: 'non-existing' });
  const res = createMockResponse();

  await controller.get(req, res, () => { });

  assert.strictEqual(res.statusCode, 404);
});

test('customerController: create customer', async () => {
  const controller = makeCustomerController(mockUseCases as any);
  const req = createMockRequest({}, {}, { firstName: 'Jane', lastName: 'Smith' });
  const res = createMockResponse();

  await controller.create(req, res, () => { });

  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.jsonData.id, 'new-customer-id');
});

test('customerController: update existing customer', async () => {
  const controller = makeCustomerController(mockUseCases as any);
  const req = createMockRequest({ id: 'existing' }, {}, { firstName: 'Updated' });
  const res = createMockResponse();

  await controller.update(req, res, () => { });

  assert.strictEqual(res.statusCode, 204);
});

test('customerController: update non-existing customer returns 404', async () => {
  const controller = makeCustomerController(mockUseCases as any);
  const req = createMockRequest({ id: 'non-existing' }, {}, { firstName: 'Updated' });
  const res = createMockResponse();

  await controller.update(req, res, () => { });

  assert.strictEqual(res.statusCode, 404);
});

test('customerController: delete customer', async () => {
  const controller = makeCustomerController(mockUseCases as any);
  const req = createMockRequest({ id: 'existing' });
  const res = createMockResponse();

  await controller.delete(req, res, () => { });

  assert.strictEqual(res.statusCode, 204);
});
