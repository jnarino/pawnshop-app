import { ListActivePawnTicketsByCustomerUseCase } from "../../../src/application/use-case/pawnTicket/query/ListActivePawnTicketsByCustomerUseCase";
import { PawnTicket } from "../../../src/domains/pawnTicket/PawnTicket";
import { PawnTicketRepository } from "../../../src/domains/pawnTicket/PawnTicketRepository";

class MockPawnTicketRepository implements PawnTicketRepository {
  create = jest.fn();
  listByControlNumber = jest.fn();
  findByCustomer = jest.fn();
  listActiveByCustomer = jest.fn();
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
    const activeTickets = [
      new PawnTicket({
        id: ticketId,
        controlNumber: 'CTL-001',
        transactionType: 'PAWN',
        customerId: customerId,
        clerkUserId: userId,
        amountFinanced: 500,
        financeCharge: 50,
        periodicRate: 0.25,
        totalOfPayments: 550,
        apr: 25,
        ratePlanId: ratePlanId,
        purchaseTradeValue: null,
        transactionDate: new Date(),
        maturityDate: new Date(),
        defaultDate: new Date(),
        createdDate: new Date(),
        pawnStatus: 'P',
        itemIds: [itemId],
        tenders: [{ tenderTypeId: 1, amount: 500 }],
        items: [],
        note: undefined
      })
    ];
    repo.listActiveByCustomer.mockResolvedValue(activeTickets);

    const useCase = new ListActivePawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: customerId });

    expect(repo.listActiveByCustomer).toHaveBeenCalledWith(customerId);
    expect(result).toHaveLength(1);
    expect(result[0].pawnStatus).toBe('P');
  });

  it('should return empty array when customer has no active tickets', async () => {
    const repo = new MockPawnTicketRepository();
    repo.listActiveByCustomer.mockResolvedValue([]);

    const useCase = new ListActivePawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: nonExistentId });

    expect(result).toHaveLength(0);
  });
});

