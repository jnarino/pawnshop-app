import { PawnTicketRepository } from '../../../src/domains/pawnTicket/PawnTicketRepository';
import { PawnTicket } from '../../../src/domains/pawnTicket/PawnTicket';
import { FindPawnTicketsByCustomerUseCase } from '../../../src/application/use-case/pawnTicket/query/FindPawnTicketsByCustomerUseCase';

class MockPawnTicketRepository implements PawnTicketRepository {
  create = jest.fn();
  listByControlNumber = jest.fn();
  findByCustomer = jest.fn();
  listActiveByCustomer = jest.fn();
}

describe('FindPawnTicketsByCustomerUseCase', () => {
  const customerId = '550e8400-e29b-41d4-a716-446655440040';
  const userId = '550e8400-e29b-41d4-a716-446655440041';
  const ratePlanId = '550e8400-e29b-41d4-a716-446655440042';
  const itemId1 = '550e8400-e29b-41d4-a716-446655440043';
  const itemId2 = '550e8400-e29b-41d4-a716-446655440044';
  const ticketId1 = '550e8400-e29b-41d4-a716-446655440045';
  const ticketId2 = '550e8400-e29b-41d4-a716-446655440046';
  const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

  it('should find all tickets for a customer', async () => {
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
        pawnStatus: 'active',
        itemIds: [itemId1],
        tenders: [{ tenderTypeId: 1, amount: 500 }]
      }),
      new PawnTicket({
        id: ticketId2,
        controlNumber: 'CTL-002',
        transactionType: 'PAWN',
        customerId: customerId,
        clerkUserId: userId,
        amountFinanced: 300,
        financeCharge: 30,
        periodicRate: 0.25,
        totalOfPayments: 330,
        apr: 25,
        ratePlanId: ratePlanId,
        purchaseTradeValue: null,
        transactionDate: new Date(),
        maturityDate: new Date(),
        defaultDate: new Date(),
        pawnStatus: 'defaulted',
        itemIds: [itemId2],
        tenders: [{ tenderTypeId: 1, amount: 300 }]
      })
    ];
    repo.findByCustomer.mockResolvedValue(tickets);

    const useCase = new FindPawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: customerId });

    expect(repo.findByCustomer).toHaveBeenCalledWith(customerId);
    expect(result).toHaveLength(2);
  });

  it('should return empty array when customer not found', async () => {
    const repo = new MockPawnTicketRepository();
    repo.findByCustomer.mockResolvedValue([]);

    const useCase = new FindPawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: nonExistentId });

    expect(result).toHaveLength(0);
  });
});
