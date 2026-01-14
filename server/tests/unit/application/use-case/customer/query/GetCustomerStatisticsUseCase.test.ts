import { CustomerRepository } from '../../../../../../src/domains/customer/CustomerRepository';
import { NotFoundError } from '../../../../../../src/application/common/errors';
import { GetCustomerStatisticsUseCase } from '../../../../../../src/application/use-case/customer/query/GetCustomerStatisticsUseCase';

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

describe('GetCustomerStatisticsUseCase', () => {
  it('should return customer statistics with calculated default ratio', async () => {
    const repo = new MockCustomerRepository();
    const useCase = new GetCustomerStatisticsUseCase(repo);

    const mockStats = {
      customerId: '123e4567-e89b-12d3-a456-426614174000',
      customerName: 'John Doe',
      activePawns: 2,
      redeemedPawns: 8,
      defaultedPawns: 2,
      buys: 5,
      totalPawns: 12,
      totalSalesAmount: 1500.50
    };

    repo.getStatistics.mockResolvedValue(mockStats);

    const result = await useCase.execute({ id: '123e4567-e89b-12d3-a456-426614174000' });

    expect(repo.getStatistics).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    expect(result.customerId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.customerName).toBe('John Doe');
    expect(result.activePawns).toBe(2);
    expect(result.redeemedPawns).toBe(8);
    expect(result.defaultedPawns).toBe(2);
    expect(result.buys).toBe(5);
    expect(result.defaultRatio).toBe(17); // 2/12 * 100 = 16.67% rounds to 17%
    expect(result.redemptionRatio).toBe(67); // 8/12 * 100 = 66.67% rounds to 67%
    expect(result.totalSalesAmount).toBe(1500.50);
  });

  it('should return 0% default ratio when customer has no pawn history', async () => {
    const repo = new MockCustomerRepository();
    const useCase = new GetCustomerStatisticsUseCase(repo);

    const mockStats = {
      customerId: '123e4567-e89b-12d3-a456-426614174000',
      customerName: 'Jane Smith',
      activePawns: 0,
      redeemedPawns: 0,
      defaultedPawns: 0,
      buys: 3,
      totalPawns: 0,
      totalSalesAmount: 250.00
    };

    repo.getStatistics.mockResolvedValue(mockStats);

    const result = await useCase.execute({ id: '123e4567-e89b-12d3-a456-426614174000' });

    expect(result.redemptionRatio).toBe(0);
    expect(result.defaultRatio).toBe(0);
    expect(result.buys).toBe(3);
    expect(result.totalSalesAmount).toBe(250.00);
  });

  it('should throw NotFoundError when customer does not exist', async () => {
    const repo = new MockCustomerRepository();
    const useCase = new GetCustomerStatisticsUseCase(repo);

    repo.getStatistics.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: '123e4567-e89b-12d3-a456-426614174000' })
    ).rejects.toThrow(NotFoundError);
  });

  it('should validate input and throw error for invalid UUID', async () => {
    const repo = new MockCustomerRepository();
    const useCase = new GetCustomerStatisticsUseCase(repo);

    await expect(
      useCase.execute({ id: 'invalid-uuid' })
    ).rejects.toThrow();
  });
});
