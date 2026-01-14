import { ListHistoryPawnsByCustomerUseCase } from '../../../src/application/use-case/pawnTicket/query/ListHistoryPawnsByCustomerUseCase';
import { PawnTicketRepository } from '../../../src/domains/pawnTicket/PawnTicketRepository';

describe('ListHistoryPawnsByCustomerUseCase', () => {
  const customerId = '550e8400-e29b-41d4-a716-446655440030';

  let useCase: ListHistoryPawnsByCustomerUseCase;
  let mockRepo: jest.Mocked<PawnTicketRepository>;

  beforeEach(() => {
    mockRepo = {
      addPayment: jest.fn(),
      setStatus: jest.fn(),
      updateMarkings: jest.fn(),
      findStatusIdByCode: jest.fn(),
      setStatusByCode: jest.fn(),
      create: jest.fn(),
      listByControlNumber: jest.fn(),
      findByCustomer: jest.fn(),
      findByDateRange: jest.fn(),
      listActiveByCustomer: jest.fn(),
      listPreviousItemsByCustomer: jest.fn(),
      listHistoryByCustomer: jest.fn(),
      updatePaymentFields: jest.fn(),
      findById: jest.fn()
    } as jest.Mocked<PawnTicketRepository>;

    useCase = new ListHistoryPawnsByCustomerUseCase(mockRepo);
  });

  it('should return pawn history when found', async () => {
    const mockHistory = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        control_number: 'CTL-001',
        date_in: '2026-01-01T00:00:00+00',
        date_out: '2026-02-01T00:00:00+00',
        status: 'Redeem',
        amount: '500',
        amount_paid: '500',
        items: [
          { id: 'item-1', description: 'Gold Ring' },
          { id: 'item-2', description: 'Diamond Necklace' }
        ]
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        control_number: 'CTL-002',
        date_in: '2025-12-15T00:00:00+00',
        date_out: null,
        status: 'Pending',
        amount: '300',
        amount_paid: '150',
        items: [
          { id: 'item-3', description: 'Laptop' }
        ]
      }
    ];

    (mockRepo.listHistoryByCustomer as jest.Mock).mockResolvedValue(mockHistory);

    const result = await useCase.execute({ customerId });

    expect(result).toHaveLength(2);
    expect(result[0].controlNumber).toBe('CTL-001');
    expect(result[0].amount).toBe(500);
    expect(result[0].amountPaid).toBe(500);
    expect(result[0].status).toBe('Redeem');
    expect(result[0].items).toHaveLength(2);
    expect(result[1].controlNumber).toBe('CTL-002');
    expect(result[1].dateOut).toBeNull();
    expect(result[1].status).toBe('Pending');
    expect(mockRepo.listHistoryByCustomer).toHaveBeenCalledWith(customerId);
  });

  it('should return empty array when no history found', async () => {
    (mockRepo.listHistoryByCustomer as jest.Mock).mockResolvedValue([]);

    const result = await useCase.execute({ customerId });

    expect(result).toEqual([]);
    expect(mockRepo.listHistoryByCustomer).toHaveBeenCalledWith(customerId);
  });

  it('should throw validation error for invalid UUID', async () => {
    await expect(
      useCase.execute({ customerId: 'invalid-uuid' })
    ).rejects.toThrow();
  });

  it('should throw validation error for missing customerId', async () => {
    await expect(
      useCase.execute({ customerId: undefined })
    ).rejects.toThrow();
  });

  it('should convert dates to ISO format', async () => {
    const dateIn = '2026-01-10T14:30:00Z';
    const dateOut = '2026-02-10T14:30:00Z';

    const mockHistory = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        control_number: 'CTL-001',
        date_in: dateIn,
        date_out: dateOut,
        status: 'CLOSED',
        amount: '750',
        amount_paid: '750',
        items: [
          { id: 'item-1', description: 'Item A' },
          { id: 'item-2', description: 'Item B' },
          { id: 'item-3', description: 'Item C' }
        ]
      }
    ];

    (mockRepo.listHistoryByCustomer as jest.Mock).mockResolvedValue(mockHistory);

    const result = await useCase.execute({ customerId });

    expect(result[0].dateIn).toBe(dateIn);
    expect(result[0].dateOut).toBe(dateOut);
  });

  it('should preserve all fields in response', async () => {
    const mockHistory = [
      {
        id: 'abc123',
        control_number: 'CTL-003',
        date_in: '2026-01-20T00:00:00+00',
        date_out: '2026-02-20T00:00:00+00',
        status: 'Redeemed',
        amount: '1000',
        amount_paid: '1000',
        items: [
          { id: 'item-1', description: 'Watch' },
          { id: 'item-2', description: 'Ring' },
          { id: 'item-3', description: 'Bracelet' },
          { id: 'item-4', description: 'Necklace' },
          { id: 'item-5', description: 'Earrings' }
        ]
      }
    ];

    (mockRepo.listHistoryByCustomer as jest.Mock).mockResolvedValue(mockHistory);

    const result = await useCase.execute({ customerId });

    expect(result[0]).toEqual({
      id: 'abc123',
      controlNumber: 'CTL-003',
      dateIn: '2026-01-20T00:00:00+00',
      dateOut: '2026-02-20T00:00:00+00',
      status: 'Redeemed',
      amount: 1000,
      amountPaid: 1000,
      items: [
        { id: 'item-1', description: 'Watch' },
        { id: 'item-2', description: 'Ring' },
        { id: 'item-3', description: 'Bracelet' },
        { id: 'item-4', description: 'Necklace' },
        { id: 'item-5', description: 'Earrings' }
      ]
    });
  });
});
