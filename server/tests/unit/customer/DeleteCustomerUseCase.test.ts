import { CustomerRepository } from '../../../src/domains/customer/CustomerRepository';
import { ForbiddenError } from '../../../src/application/common/errors';
import { DeleteCustomerUseCase } from '../../../src/application/use-case/customer/command/DeleteCustomerUseCase';

class MockCustomerRepository implements CustomerRepository {
  findById = jest.fn();
  findByName = jest.fn();
  findCustomer = jest.fn();
  listAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
}

describe('DeleteCustomerUseCase', () => {
  it('should forbid non-admin and non-manager from deleting customers', async () => {
    const repo = new MockCustomerRepository();
    const useCase = new DeleteCustomerUseCase(repo);

    const actor = { id: '1', username: 'test', role: 'sales_associate' };

    await expect(
      useCase.execute(actor, '123')
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should allow admin to delete customer', async () => {
    const repo = new MockCustomerRepository();
    const useCase = new DeleteCustomerUseCase(repo);

    const actor = { id: '1', username: 'admin', role: 'admin' };

    await useCase.execute(actor, '123');

    expect(repo.delete).toHaveBeenCalledWith('123');
  });

  it('should allow manager to delete customer', async () => {
    const repo = new MockCustomerRepository();
    const useCase = new DeleteCustomerUseCase(repo);

    const actor = { id: '1', username: 'manager', role: 'manager' };

    await useCase.execute(actor, '456');

    expect(repo.delete).toHaveBeenCalledWith('456');
  });
});
