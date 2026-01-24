import { GetLayawayHistoryUseCase } from '../../../../../../src/application/use-case/layaway/query/GetLayawayHistoryUseCase';
import { LayawayRepository } from '../../../../../../src/domains/layaway/LayawayRepository';
import { GetLayawayHistoryRequestDto } from '../../../../../../src/application/dto/layaway/query/GetLayawayHistoryRequestDto';

describe('GetLayawayHistoryUseCase', () => {
  let useCase: GetLayawayHistoryUseCase;
  let mockRepo: jest.Mocked<LayawayRepository>;

  beforeEach(() => {
    mockRepo = {
      findByCriteria: jest.fn(),
      create: jest.fn(),
      findByTicketNum: jest.fn(),
      update: jest.fn(),
      getHistory: jest.fn(),
    } as unknown as jest.Mocked<LayawayRepository>;
    useCase = new GetLayawayHistoryUseCase(mockRepo);
  });

  it('should return history for a valid request', async () => {
    const customerId = 'fe61e30c-303c-4525-93f9-a52bdad9d491';
    const ticketnum = '111441';
    const mockDate = new Date('2023-01-01T12:00:00Z');
    
    const mockHistory = [
      {
        occurredAt: mockDate,
        transactionType: 'Layaway Payment',
        clerkUsername: 'jdoe',
        amount: 50.00
      },
      {
        occurredAt: new Date('2023-01-02T12:00:00Z'),
        transactionType: 'Layaway Void',
        clerkUsername: 'admin',
        amount: -50.00
      }
    ];

    mockRepo.getHistory.mockResolvedValue(mockHistory);

    const input: GetLayawayHistoryRequestDto = { customerId, ticketnum };
    const result = await useCase.execute(input);

    expect(mockRepo.getHistory).toHaveBeenCalledWith(customerId, ticketnum);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      occurredAt: mockDate.toISOString(),
      transactionType: 'Layaway Payment',
      clerkUsername: 'jdoe',
      amount: 50.00
    });
  });

  it('should return empty list when no history found', async () => {
    mockRepo.getHistory.mockResolvedValue([]);

    const result = await useCase.execute({ 
      customerId: 'fe61e30c-303c-4525-93f9-a52bdad9d491', 
      ticketnum: '999999' 
    });

    expect(result).toEqual([]);
  });

  it('should throw validation error for invalid UUID', async () => {
    const input = { 
      customerId: 'invalid-uuid', 
      ticketnum: '123' 
    };

    await expect(useCase.execute(input)).rejects.toThrow();
  });

  it('should throw validation error for missing fields', async () => {
    await expect(useCase.execute({ ticketnum: '123' })).rejects.toThrow();
    await expect(useCase.execute({ customerId: 'fe61e30c-303c-4525-93f9-a52bdad9d491' })).rejects.toThrow();
  });
});
