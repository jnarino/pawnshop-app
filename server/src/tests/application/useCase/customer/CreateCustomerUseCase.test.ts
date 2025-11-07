import assert from 'assert';
import { CreateCustomerUseCase } from '../../../../application/useCase/customer/CreateCustomerUseCase';
import { ICustomerRepository } from '../../../../domain/customer/ICustomerRepository';
import { ValidationError } from '../../../../application/errors';
import { test } from '../../../testHarness';
import { Customer } from '../../../../domain/customer/Customer';

class MockRepo implements ICustomerRepository {
  data: Customer[] = [];
  async findAll() { return this.data; }
  async findById(id: string) { return this.data.find(c => c.id === id) || null; }
  async create(dto: Omit<Customer, 'id'>) { const id = 'new-id'; this.data.push({ id, ...dto }); return id; }
  async update() { return true; }
  async delete() { return true; }
  async findByDobAndIdNumber(dateOfBirth: string, idNumber: string): Promise<Customer | null> {
    // Reuse the mock’s data via findAll so we don’t duplicate storage logic
    const all = await this.findAll();
    return all.find(c => c.dateOfBirth === dateOfBirth && c.idNumber === idNumber) ?? null;
  }
}

const base: Omit<Customer, 'id'> = {
  firstName: 'Jane',
  lastName: 'Smith',
  dateOfBirth: '1980-05-05',
  sex: 'F',
  eyeColorId: 'blue-color-uuid-here', // ✅ Changed from eyeColor to eyeColorId
  height: '5\'6"',
  streetAddress: '1 First St',
  city: 'Metro',
  stateUs: 'CA',

  zipCode: '90001',
  idNumber: 'ID999',
  idIssueDate: '2020-01-01',
  idExpiration: '2030-01-01',
  idState: 'CA',
  phoneNumber: '555-2222',
  email: 'jane@example.com',
  middleName: undefined,

};

test('application/useCase/customer: CreateCustomerUseCase creates customer', async () => {
  const repo = new MockRepo();
  const uc = new CreateCustomerUseCase(repo);
  const id = await uc.execute(base);
  assert.strictEqual(id, 'new-id');
});

test('application/useCase/customer: CreateCustomerUseCase validation error', async () => {
  const uc = new CreateCustomerUseCase(new MockRepo());
  const bad = { ...base } as any;
  delete bad.firstName;
  await assert.rejects(() => uc.execute(bad), (e: any) => e instanceof ValidationError && /firstName/.test(e.message));
});
