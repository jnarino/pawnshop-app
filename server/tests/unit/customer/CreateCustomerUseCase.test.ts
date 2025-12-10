import { CustomerRepository } from '../../../src/domains/customer/CustomerRepository';
import { Customer } from '../../../src/domains/customer/Customer';
import { CreateCustomerUseCase } from '../../../src/application/use-case/customer/command/CreateCustomerUseCase';

class MockCustomerRepository implements CustomerRepository {
  findById = jest.fn();
  findByName = jest.fn();
  findCustomer = jest.fn();
  listAll = jest.fn();
  create = jest.fn(async (c: Customer) => c);
  update = jest.fn();
  delete = jest.fn();
}

describe('CreateCustomerUseCase', () => {
  it('should create a customer with minimal required fields', async () => {
    const repo = new MockCustomerRepository();
    const useCase = new CreateCustomerUseCase(repo);

    const result = await useCase.execute({
      firstName: 'John',
      lastName: 'Doe'
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
  });

  it('should create a customer with all optional fields', async () => {
    const repo = new MockCustomerRepository();
    const useCase = new CreateCustomerUseCase(repo);

    const result = await useCase.execute({
      firstName: 'Jane',
      middleName: 'M',
      lastName: 'Smith',
      streetAddress: '123 Main St',
      city: 'Springfield',
      stateUs: 'IL',
      zipCode: '12345',
      phoneNumber: '555-1234',
      email: 'jane@example.com',
      dateOfBirth: '1990-01-01'
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Smith');
    expect(result.city).toBe('Springfield');
  });

  it('should handle null optional fields', async () => {
    const repo = new MockCustomerRepository();
    const useCase = new CreateCustomerUseCase(repo);

    const result = await useCase.execute({
      firstName: 'Bob',
      lastName: 'Johnson',
      middleName: null,
      streetAddress: null
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.middleName).toBeNull();
    expect(result.streetAddress).toBeNull();
  });
});
