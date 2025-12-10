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
}

describe('GetCustomerByIdUseCase', () => {
  it('should throw NotFoundError if customer does not exist', async () => {
    const repo = new MockCustomerRepository();
    repo.findById.mockResolvedValue(null);
    const useCase = new GetCustomerByIdUseCase(repo);

    await expect(
      useCase.execute({ id: '999' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should return customer when found', async () => {
    const repo = new MockCustomerRepository();
    const customer = new Customer({
      id: '123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '555-1234',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(customer);

    const useCase = new GetCustomerByIdUseCase(repo);

    const result = await useCase.execute({ id: '123' });

    expect(repo.findById).toHaveBeenCalledWith('123');
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
  });
});
