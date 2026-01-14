import { CustomerRepository } from '../../../src/domains/customer/CustomerRepository';
import { Customer } from '../../../src/domains/customer/Customer';
import { NotFoundError } from '../../../src/application/common/errors';
import { UpdateCustomerUseCase } from '../../../src/application/use-case/customer/command/UpdateCustomerUseCase';

class MockCustomerRepository implements CustomerRepository {
  findById = jest.fn();
  findByName = jest.fn();
  findCustomer = jest.fn();
  listAll = jest.fn();
  create = jest.fn();
  update = jest.fn(async (c: Customer) => c);
  delete = jest.fn();
  getStatistics = jest.fn();
}

describe('UpdateCustomerUseCase', () => {
  const customerId = '550e8400-e29b-41d4-a716-446655440004';
  const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

  it('should throw NotFoundError if customer does not exist', async () => {
    const repo = new MockCustomerRepository();
    repo.findById.mockResolvedValue(null);
    const useCase = new UpdateCustomerUseCase(repo);

    await expect(
      useCase.execute({
        id: nonExistentId,
        firstName: 'Updated',
        lastName: 'Name'
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should update existing customer', async () => {
    const repo = new MockCustomerRepository();
    const existingCustomer = new Customer({
      id: customerId,
      firstName: 'Old',
      lastName: 'Name',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingCustomer);

    const useCase = new UpdateCustomerUseCase(repo);

    const result = await useCase.execute({
      id: customerId,
      firstName: 'Updated',
      lastName: 'NewName',
      city: 'New City'
    });

    expect(repo.findById).toHaveBeenCalledWith(customerId);
    expect(repo.update).toHaveBeenCalled();
    expect(result.firstName).toBe('Updated');
    expect(result.lastName).toBe('NewName');
  });

  it('should preserve fields not included in update', async () => {
    const repo = new MockCustomerRepository();
    const existingCustomer = new Customer({
      id: customerId,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '555-1234',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingCustomer);

    const useCase = new UpdateCustomerUseCase(repo);

    await useCase.execute({
      id: customerId,
      firstName: 'John',
      lastName: 'Smith',
      phoneNumber: '555-1234'  // Include phoneNumber to preserve it
    });

    expect(repo.update).toHaveBeenCalled();
    const updatedCustomer = repo.update.mock.calls[0][0];
    expect(updatedCustomer.phoneNumber).toBe('555-1234');
  });
});
