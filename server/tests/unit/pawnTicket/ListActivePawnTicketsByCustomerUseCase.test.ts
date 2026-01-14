import { ListActivePawnTicketsByCustomerUseCase } from "../../../src/application/use-case/pawnTicket/query/ListActivePawnTicketsByCustomerUseCase";
import { GetPawnTicketCurrentChargesUseCase } from "../../../src/application/use-case/pawnTicket/query/GetPawnTicketCurrentChargesUseCase";
import { PawnTicket } from "../../../src/domains/pawnTicket/PawnTicket";
import { PawnTicketRepository } from "../../../src/domains/pawnTicket/PawnTicketRepository";

class MockPawnTicketRepository implements PawnTicketRepository {
  addPayment = jest.fn();
  setStatus = jest.fn();
  updateMarkings = jest.fn();
  findStatusIdByCode = jest.fn();
  setStatusByCode = jest.fn();
  create = jest.fn();
  listByControlNumber = jest.fn();
  findByCustomer = jest.fn();
  findByDateRange = jest.fn();
  listActiveByCustomer = jest.fn();
  listPreviousItemsByCustomer = jest.fn();
  listHistoryByCustomer = jest.fn();
  updatePaymentFields = jest.fn();
  async findById(id: string): Promise<PawnTicket | null> {
    return null;
  }
}

describe('ListActivePawnTicketsByCustomerUseCase', () => {
  const customerId = '550e8400-e29b-41d4-a716-446655440030';
  const userId = '550e8400-e29b-41d4-a716-446655440031';
  const ratePlanId = '550e8400-e29b-41d4-a716-446655440032';
  const itemId = '550e8400-e29b-41d4-a716-446655440033';
  const ticketId = '550e8400-e29b-41d4-a716-446655440034';
  const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

  it('should return only active tickets for a customer', async () => {
    const repo = new MockPawnTicketRepository();
    const mockChargesUseCase = { execute: jest.fn() } as unknown as GetPawnTicketCurrentChargesUseCase;
    const activeTickets = [
      new PawnTicket({
        id: ticketId,
        controlNumber: 'CTL-001',
        transactionType: 'PAWN',
        customerId: customerId,
        clerkUserId: userId,
        amountFinanced: 200,
        originalPawnAmount: 200,
        periodicRate: 0.25,
        apr: 25,
        purchaseTradeValue: null,
        transactionDate: new Date(),
        maturityDate: new Date(),
        defaultDate: new Date(),
        createdDate: new Date(),
        pawnStatus: 'P',
        itemIds: [itemId],
        tenders: [{ tenderTypeId: 1, amount: 200 }],
        items: [],
        note: undefined
      })
    ];
    repo.listActiveByCustomer.mockResolvedValue(activeTickets);
    (mockChargesUseCase.execute as jest.Mock).mockResolvedValue({
      currentCharges: 50,
      periodsBehind: 1,
      redemptionAmount: 250,
    });

    const useCase = new ListActivePawnTicketsByCustomerUseCase(repo, mockChargesUseCase);

    const result = await useCase.execute({ customerId: customerId });

    expect(repo.listActiveByCustomer).toHaveBeenCalledWith(customerId);
    expect(mockChargesUseCase.execute).toHaveBeenCalledWith({ controlNumber: 'CTL-001' });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: ticketId,
      controlNumber: 'CTL-001',
      transactionType: 'PAWN',
      customerId: customerId,
      clerkUserId: userId,
      amountFinanced: 200,
      originalPawnAmount: 200,
      periodicRate: 0.25,
      apr: 25,
      purchaseTradeValue: null,
      transactionDate: activeTickets[0].transactionDate.toISOString(),
      maturityDate: activeTickets[0].maturityDate.toISOString(),
      defaultDate: activeTickets[0].defaultDate.toISOString(),
      createdDate: activeTickets[0].createdDate.toISOString(),
      pawnStatus: 'P',
      itemIds: [itemId],
      items: [],
      note: undefined,
      currentCharges: 50,
      periodsBehind: 1,
      redemptionAmount: 250,
      customer: { firstName: '', lastName: '' }
    });
  });

  it('should return empty array when customer has no active tickets', async () => {
    const repo = new MockPawnTicketRepository();
    const mockChargesUseCase = { execute: jest.fn() } as unknown as GetPawnTicketCurrentChargesUseCase;
    repo.listActiveByCustomer.mockResolvedValue([]);

    const useCase = new ListActivePawnTicketsByCustomerUseCase(repo, mockChargesUseCase);

    const result = await useCase.execute({ customerId: nonExistentId });

    expect(result).toHaveLength(0);
  });
});

