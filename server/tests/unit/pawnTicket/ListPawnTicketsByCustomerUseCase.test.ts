import { ListPawnTicketsByCustomerUseCase } from "../../../src/application/use-case/pawnTicket/query/ListPawnTicketsByCustomerUseCase";
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

describe('ListPawnTicketsByCustomerUseCase', () => {
  const customerId = '550e8400-e29b-41d4-a716-446655440020';
  const userId = '550e8400-e29b-41d4-a716-446655440021';
  const ratePlanId = '550e8400-e29b-41d4-a716-446655440022';
  const itemId1 = '550e8400-e29b-41d4-a716-446655440023';
  const itemId2 = '550e8400-e29b-41d4-a716-446655440024';
  const ticketId1 = '550e8400-e29b-41d4-a716-446655440025';
  const ticketId2 = '550e8400-e29b-41d4-a716-446655440026';
  const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

  it('should return all tickets for a customer', async () => {
    const repo = new MockPawnTicketRepository();
    const tickets = [
      new PawnTicket({
        id: ticketId1,
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
        itemIds: [itemId1],
        tenders: [{ tenderTypeId: 1, amount: 500 }]
      }),
      new PawnTicket({
        id: ticketId2,
        controlNumber: 'CTL-002',
        transactionType: 'PURCHASE',
        customerId: customerId,
        clerkUserId: userId,
        amountFinanced: null,
        financeCharge: null,
        periodicRate: null,
        totalOfPayments: null,
        apr: null,
        ratePlanId: null,
        purchaseTradeValue: 300,
        transactionDate: new Date(),
        maturityDate: new Date(),
        defaultDate: new Date(),
        createdDate: new Date(),
        pawnStatus: 'U',
        itemIds: [itemId2],
        tenders: [{ tenderTypeId: 1, amount: 300 }]
      })
    ];
    repo.findByCustomer.mockResolvedValue(tickets);

    const useCase = new ListPawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: customerId });

    expect(repo.findByCustomer).toHaveBeenCalledWith(customerId);
    expect(result).toHaveLength(2);
    expect(result[0].customerId).toBe(customerId);
    expect(result[1].customerId).toBe(customerId);
  });

  it('should return empty array when customer has no tickets', async () => {
    const repo = new MockPawnTicketRepository();
    repo.findByCustomer.mockResolvedValue([]);

    const useCase = new ListPawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: nonExistentId });

    expect(result).toHaveLength(0);
  });
});
