import { ListStoreTransactionsByDateRangeUseCase } from '../../../../../../src/application/use-case/storeTransaction/query/ListStoreTransactionsByDateRangeUseCase';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';

describe('ListStoreTransactionsByDateRangeUseCase', () => {
  let useCase: ListStoreTransactionsByDateRangeUseCase;
  let mockRepo: jest.Mocked<StoreTransactionRepository>;

  beforeEach(() => {
    mockRepo = {
      listByDateRange: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      listByCustomer: jest.fn(),
      listByControlNumber: jest.fn(),
      createPayment: jest.fn(),
      getLastClose: jest.fn(),
      getActivitySinceClose: jest.fn()
    } as jest.Mocked<StoreTransactionRepository>;

    useCase = new ListStoreTransactionsByDateRangeUseCase(mockRepo);
  });

  it('should query with full day range when no time component provided', async () => {
    mockRepo.listByDateRange.mockResolvedValue([]);

    await useCase.execute({
      from: '2026-01-05',
      to: '2026-01-07'
    });

    expect(mockRepo.listByDateRange).toHaveBeenCalledWith({
      from: new Date('2026-01-05T00:00:00.000Z'),
      to: new Date('2026-01-07T23:59:59.999Z')
    });
  });

  it('should adjust midnight "to" date to end of day', async () => {
    mockRepo.listByDateRange.mockResolvedValue([]);

    await useCase.execute({
      from: '2026-01-05T00:00:00.000Z',
      to: '2026-01-07T00:00:00.000Z'
    });

    expect(mockRepo.listByDateRange).toHaveBeenCalledWith({
      from: new Date('2026-01-05T00:00:00.000Z'),
      to: new Date('2026-01-07T23:59:59.999Z')
    });
  });

  it('should respect explicit non-midnight times', async () => {
    mockRepo.listByDateRange.mockResolvedValue([]);

    await useCase.execute({
      from: '2026-01-05T10:00:00.000Z',
      to: '2026-01-07T15:30:00.000Z'
    });

    expect(mockRepo.listByDateRange).toHaveBeenCalledWith({
      from: new Date('2026-01-05T10:00:00.000Z'),
      to: new Date('2026-01-07T15:30:00.000Z')
    });
  });

  it('should throw error for invalid from date', async () => {
    await expect(
      useCase.execute({
        from: 'invalid-date',
        to: '2026-01-07'
      })
    ).rejects.toThrow('Invalid date');
  });

  it('should throw error for invalid to date', async () => {
    await expect(
      useCase.execute({
        from: '2026-01-05',
        to: 'invalid-date'
      })
    ).rejects.toThrow('Invalid date');
  });

  it('should throw error when from date is after to date', async () => {
    await expect(
      useCase.execute({
        from: '2026-01-10',
        to: '2026-01-05'
      })
    ).rejects.toThrow('`from` date must be <= `to` date');
  });

  it('should map results to DTOs', async () => {
    const mockTransaction = {
      id: '123',
      customerId: 'cust-1',
      clerkUserId: 'clerk-1',
      controlNumber: 'CTL-001',
      typeId: 10,
      occurredAt: new Date('2026-01-06T12:00:00Z'),
      amount: 100,
      taxSales: 100,
      stateTax: 6.5,
      taxExemptUsed: false,
      taxExemptCertificate: null,
      tenderChange: null,
      gunProcFee: null,
      note: null,
      createdAt: new Date('2026-01-06T12:00:00Z'),
      updatedAt: new Date('2026-01-06T12:00:00Z'),
      tenders: [],
      items: []
    };

    mockRepo.listByDateRange.mockResolvedValue([mockTransaction]);

    const result = await useCase.execute({
      from: '2026-01-05',
      to: '2026-01-07'
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('123');
    expect(result[0].controlNumber).toBe('CTL-001');
  });
});
