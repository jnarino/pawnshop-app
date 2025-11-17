import assert from 'assert';
import { CreateCustomerUseCase } from '../../../../application/useCase/customer/CreateCustomerUseCase';
import type { ICustomerRepository } from '../../../../domain/customer/ICustomerRepository';
import type { Customer } from '../../../../domain/customer/Customer';
import { test } from '../../../testHarness';

// ✅ Complete mock implementation following SOLID principles
class MockCustomerRepository implements ICustomerRepository {
  private customers: Customer[] = [];
  private sequence = 1;

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.sequence.toString(); // ✅ Use .toString() instead of String()
    this.sequence++;
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id,
      ...customer,
      createdAt: now,
      updatedAt: now
    };
    this.customers.push(newCustomer);
    return id;
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customers.find(c => c.id === id) || null;
  }

  async findAll(limit?: number, offset?: number): Promise<Customer[]> {
    let result = [...this.customers];
    if (offset) result = result.slice(offset);
    if (limit) result = result.slice(0, limit);
    return result;
  }

  async findByDobAndIdNumber(dateOfBirth: string, idNumber: string): Promise<Customer | null> {
    return this.customers.find(c =>
      c.dateOfBirth === dateOfBirth && c.idNumber === idNumber
    ) || null;
  }

  async findByQuery(params: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    idNumber?: string;
    limit?: number;
    offset?: number;
  }): Promise<Customer[]> {
    let filtered = this.customers.filter(customer => {
      if (params.firstName && !customer.firstName?.toLowerCase().includes(params.firstName.toLowerCase())) {
        return false;
      }
      if (params.lastName && !customer.lastName?.toLowerCase().includes(params.lastName.toLowerCase())) {
        return false;
      }
      if (params.dateOfBirth && customer.dateOfBirth !== params.dateOfBirth) {
        return false;
      }
      if (params.phoneNumber && customer.phoneNumber !== params.phoneNumber) {
        return false;
      }
      if (params.idNumber && customer.idNumber !== params.idNumber) {
        return false;
      }
      return true;
    });

    if (params.offset) filtered = filtered.slice(params.offset);
    if (params.limit) filtered = filtered.slice(0, params.limit);
    return filtered;
  }

  async update(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.customers[index] = {
      ...this.customers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.customers.splice(index, 1);
    return true;
  }

  // ✅ Helper method for testing
  clear(): void {
    this.customers = [];
    this.sequence = 1;
  }
}

test('CreateCustomerUseCase: creates customer successfully', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  const id = await useCase.execute({
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    phoneNumber: '555-1234'
  });

  assert.strictEqual(id, '1');
  const customer = await repo.findById(id);
  assert.strictEqual(customer?.firstName, 'John');
  assert.strictEqual(customer?.lastName, 'Doe');
  assert.strictEqual(customer?.dateOfBirth, '1990-01-01');
  assert.strictEqual(customer?.phoneNumber, '555-1234');
  assert(customer?.createdAt);
  assert(customer?.updatedAt);
});

test('CreateCustomerUseCase: validates required firstName', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  try {
    await useCase.execute({ lastName: 'Doe' } as any);
    assert.fail('Should have thrown validation error');
  } catch (error) {
    assert(error instanceof Error);
    assert(error.message.includes('First name is required'));
  }
});

test('CreateCustomerUseCase: validates required lastName', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  try {
    await useCase.execute({ firstName: 'John' } as any);
    assert.fail('Should have thrown validation error');
  } catch (error) {
    assert(error instanceof Error);
    assert(error.message.includes('Last name is required'));
  }
});

test('CreateCustomerUseCase: validates date of birth not in future', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  try {
    await useCase.execute({
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: futureDate.toISOString().split('T')[0]
    });
    assert.fail('Should have thrown validation error');
  } catch (error) {
    assert(error instanceof Error);
    assert(error.message.includes('Date of birth cannot be in the future'));
  }
});

test('CreateCustomerUseCase: validates phone number format', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  try {
    await useCase.execute({
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: 'invalid-phone'
    });
    assert.fail('Should have thrown validation error');
  } catch (error) {
    assert(error instanceof Error);
    assert(error.message.includes('Invalid phone number format'));
  }
});

test('CreateCustomerUseCase: accepts valid phone number formats', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  const validPhones = [
    '555-1234',
    '(555) 123-4567',
    '555 123 4567',
    '5551234567',
    '+1-555-123-4567'
  ];

  for (const phone of validPhones) {
    repo.clear();
    const id = await useCase.execute({
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: phone
    });

    const customer = await repo.findById(id);
    assert(customer);
    assert.strictEqual(customer.phoneNumber, phone);
  }
});

test('CreateCustomerUseCase: handles optional fields', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  const id = await useCase.execute({
    firstName: 'Jane',
    lastName: 'Smith',
    middleName: 'Marie',
    streetAddress: '123 Main St',
    city: 'Anytown',
    stateUs: 'FL',
    zipCode: '12345',
    email: 'jane@example.com'
  });

  const customer = await repo.findById(id);
  assert.strictEqual(customer?.firstName, 'Jane');
  assert.strictEqual(customer?.lastName, 'Smith');
  assert.strictEqual(customer?.middleName, 'Marie');
  assert.strictEqual(customer?.streetAddress, '123 Main St');
  assert.strictEqual(customer?.city, 'Anytown');
  assert.strictEqual(customer?.stateUs, 'FL');
  assert.strictEqual(customer?.zipCode, '12345');
  assert.strictEqual(customer?.email, 'jane@example.com');
});

test('CreateCustomerUseCase: trims whitespace from names', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  const id = await useCase.execute({
    firstName: '  John  ',
    lastName: '  Doe  '
  });

  const customer = await repo.findById(id);
  assert.strictEqual(customer?.firstName, 'John');
  assert.strictEqual(customer?.lastName, 'Doe');
});

test('CreateCustomerUseCase: validates empty names after trimming', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  try {
    await useCase.execute({
      firstName: '   ',
      lastName: 'Doe'
    });
    assert.fail('Should have thrown validation error');
  } catch (error) {
    assert(error instanceof Error);
    assert(error.message.includes('First name is required'));
  }
});

test('CreateCustomerUseCase: handles repository errors', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  // ✅ Mock repository failure
  repo.create = async () => {
    throw new Error('Database connection failed');
  };

  try {
    await useCase.execute({
      firstName: 'John',
      lastName: 'Doe'
    });
    assert.fail('Should have thrown repository error');
  } catch (error) {
    assert(error instanceof Error);
    assert.strictEqual(error.message, 'Database connection failed');
  }
});

test('CreateCustomerUseCase: generates sequential IDs', async () => {
  const repo = new MockCustomerRepository();
  const useCase = new CreateCustomerUseCase(repo);

  const id1 = await useCase.execute({
    firstName: 'John',
    lastName: 'Doe'
  });

  const id2 = await useCase.execute({
    firstName: 'Jane',
    lastName: 'Smith'
  });

  assert.strictEqual(id1, '1');
  assert.strictEqual(id2, '2');
  assert.notStrictEqual(id1, id2);
});

// ✅ Add test for the new method
test('CreateCustomerUseCase: findByDobAndIdNumber works correctly', async () => {
  const repo = new MockCustomerRepository();

  // Create a customer with specific DOB and ID
  await repo.create({
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    idNumber: 'DL123456789'
  });

  // Test finding by DOB and ID
  const found = await repo.findByDobAndIdNumber('1990-01-01', 'DL123456789');
  assert(found);
  assert.strictEqual(found.firstName, 'John');
  assert.strictEqual(found.lastName, 'Doe');

  // Test not finding with wrong data
  const notFound = await repo.findByDobAndIdNumber('1990-01-01', 'WRONG123');
  assert.strictEqual(notFound, null);
});
