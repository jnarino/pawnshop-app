import { CustomerRepository } from '../../../src/domains/customer/CustomerRepository';
import { Customer } from '../../../src/domains/customer/Customer';
import { NotFoundError } from '../../../src/application/common/errors';
import { GetCustomerByIdUseCase } from '../../../src/application/use-case/customer/query/GetCustomerByIdUseCase';

class MockCustomerRepository implements CustomerRepository {
  findById = jest.fn();
  findByName = jest.fn();
  findCustomer = jest.fn();
  listAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  getStatistics = jest.fn();
}

describe('GetCustomerByIdUseCase', () => {
  const customerId = '550e8400-e29b-41d4-a716-446655440001';
  const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

  it('should throw NotFoundError if customer does not exist', async () => {
    const repo = new MockCustomerRepository();
    repo.findById.mockResolvedValue(null);
    const useCase = new GetCustomerByIdUseCase(repo);

    await expect(
      useCase.execute({ id: nonExistentId })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should return customer when found', async () => {
    const repo = new MockCustomerRepository();
    const customer = new Customer({
      id: customerId,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '555-1234',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(customer);

    const useCase = new GetCustomerByIdUseCase(repo);

    const result = await useCase.execute({ id: customerId });

    expect(repo.findById).toHaveBeenCalledWith(customerId);
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
  });
});
