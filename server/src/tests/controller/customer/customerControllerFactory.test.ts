import assert from 'assert';
import { makeCustomerController } from '../../../controller/customer/customerControllerFactory';
import type { ListCustomersUseCase } from '../../../application/useCase/customer/ListCustomersUseCase';
import type { GetCustomerUseCase } from '../../../application/useCase/customer/GetCustomerUseCase';
import type { CreateCustomerUseCase } from '../../../application/useCase/customer/CreateCustomerUseCase';
import type { UpdateCustomerUseCase } from '../../../application/useCase/customer/UpdateCustomerUseCase';
import type { DeleteCustomerUseCase } from '../../../application/useCase/customer/DeleteCustomerUseCase';
import { test } from '../../testHarness';

// Simple mock use cases
function uc<T>(value: T) { return { execute: async () => value }; }
function throwingUC(err: any) { return { execute: async () => { throw err; } }; }

const baseCustomer = { id: '1', firstName:'A', lastName:'B', dateOfBirth:'2000-01-01', sex:'M', eyeColor:'', height:'', streetAddress:'', city:'', stateUs:'', zipcode:'', idNumber:'', issueDate:'', expirationDate:'', issuingState:'', phone:'', email:'' };

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

const controller = makeCustomerController({
  list: uc([baseCustomer]) as unknown as ListCustomersUseCase,
  get: uc(baseCustomer) as unknown as GetCustomerUseCase,
  create: { execute: async () => 'new-id' } as unknown as CreateCustomerUseCase,
  update: { execute: async () => true } as unknown as UpdateCustomerUseCase,
  delete: { execute: async () => true } as unknown as DeleteCustomerUseCase,
});

test('controller/customer: list returns array', async () => {
  const res = mockRes();
  const req: any = { query: {} };
  await controller.list(req as any, res as any, (e:any)=>{ if (e) throw e; });
  assert.ok(Array.isArray(res.jsonData));
});

test('controller/customer: get 404 when missing', async () => {
  const c2 = makeCustomerController({
    list: uc([]) as unknown as ListCustomersUseCase,
    get: uc(null) as unknown as GetCustomerUseCase,
    create: { execute: async () => 'id' } as unknown as CreateCustomerUseCase,
    update: { execute: async () => false } as unknown as UpdateCustomerUseCase,
    delete: { execute: async () => false } as unknown as DeleteCustomerUseCase,
  });
  const res = mockRes();
  await c2.get({ params:{ id:'x'} } as any, res as any, ()=>{});
  assert.strictEqual(res.sentStatus, 404);
});
