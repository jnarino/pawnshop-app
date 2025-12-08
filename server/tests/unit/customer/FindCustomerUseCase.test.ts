import { CustomerRepository } from '../../../src/domains/customer/CustomerRepository';
import { Customer } from '../../../src/domains/customer/Customer';
import { FindCustomerUseCase } from '../../../src/application/use-case/customer/query/FindCustomerUseCase';

class MockCustomerRepository implements CustomerRepository {
  findById = jest.fn();
  findByName = jest.fn();
  findCustomer = jest.fn();
  listAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
}

describe('FindCustomerUseCase', () => {
  it('should find customers by last name', async () => {
    const repo = new MockCustomerRepository();
    const customers = [
      new Customer({
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      new Customer({
        id: '2',
        firstName: 'Jane',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    ];
    repo.findCustomer.mockResolvedValue(customers);

    const useCase = new FindCustomerUseCase(repo);

    const result = await useCase.execute({ lastName: 'Doe' });

    expect(repo.findCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ lastName: 'Doe' })
    );
    expect(result).toHaveLength(2);
  });

  it('should find customers by first and last name', async () => {
    const repo = new MockCustomerRepository();
    const customers = [
      new Customer({
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    ];
    repo.findCustomer.mockResolvedValue(customers);

    const useCase = new FindCustomerUseCase(repo);

    const result = await useCase.execute({ 
      firstName: 'John',
      lastName: 'Smith' 
    });

    expect(repo.findCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ 
        firstName: 'John',
        lastName: 'Smith'
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe('John');
  });

  it('should return empty array when no customers found', async () => {
    const repo = new MockCustomerRepository();
    repo.findCustomer.mockResolvedValue([]);

    const useCase = new FindCustomerUseCase(repo);

    const result = await useCase.execute({ lastName: 'Nonexistent' });

    expect(result).toHaveLength(0);
  });
});
